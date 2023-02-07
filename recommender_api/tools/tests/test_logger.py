import json
import logging
import sys
import warnings
from datetime import datetime
from multiprocessing import Pool
import time

import flask
import pytest

from recommender_api.tools.logger import log


def set_test_stream():
    # stab the handler stream as pytest redirects stderr
    root_logger = logging.getLogger()
    handler = next(handler for handler in root_logger.handlers if handler.name == "aai-json-handler")
    handler.stream = sys.stderr
    root_logger.setLevel(logging.DEBUG)
    return


def test_debug_log(capfd):
    set_test_stream()
    log.debug('foobar')
    out, err = capfd.readouterr()
    output = json.loads(err)
    assert output['debugMessage'] == 'foobar'


def test_very_long_log_entry(capfd):
    set_test_stream()

    request = flask.Request.from_values(data=("foo" * 900000), query_string="")

    with log.open():
        log.audit.request(request)

    out, err = capfd.readouterr()
    parse_logs(err)  # this should not raise any errors



def test_error_logging_from_threads(capfd):
    set_test_stream()
    with Pool() as p:
        p.map(logging_task, range(4))

    out, err = capfd.readouterr()
    audit_logs, tech_logs = parse_logs(err)

    assert len(audit_logs) == len(tech_logs) == 4
    audit_ids = {row['requestId'] for row in audit_logs}
    tech_ids = {row['requestId'] for row in tech_logs}

    assert audit_ids == tech_ids
    assert len(audit_ids) == 4


def test_capturing_3rd_party_logs(capfd):
    set_test_stream()

    third_party_logger = logging.getLogger("3rd_party_log")
    third_party_logger.propagate = True

    with log.open():
        try:
            third_party_logger.info("foo")
            raise ValueError("bar")
        except ValueError:
            third_party_logger.error("baz", exc_info=True, stack_info=True)

    stdout, stderr = capfd.readouterr()
    audit_logs, tech_logs = parse_logs(stderr)

    assert tech_logs[0]['logs']['messages'] == ['foo', 'baz']

    errors = tech_logs[0]['logs']['errors']
    assert len(errors) == 2
    assert errors[0] == "<class 'ValueError'>: bar"
    assert errors[1].startswith("Stack (most recent call last):")


@pytest.mark.skipif(
    "no:warnings" not in sys.argv,
    reason="Run pytest with '-p no:warnings' to diasable warning capture and test warning formatting."
)
def test_warning_format(capfd):
    warnings.warn("The ice, is gonna BREAK!", category=UserWarning)

    _, stderr = capfd.readouterr()
    __, tech_logs = parse_logs(stderr)

    assert tech_logs[0]['errors'][0].startswith('UserWarning: The ice')
    assert tech_logs[0]['operationName'] == 'warning'
    assert datetime.fromisoformat(tech_logs[0]['timestamp']).date() == datetime.today().date()


def logging_task(error_code):
    time.sleep(0.1)
    with log.open():
        log.technical.error(f"technical error: {error_code}")
        log.technical.error("technical error: 999")
        log.audit.error(f"audit error: {error_code}")


def parse_logs(err):
    text_logs = err.strip().split('\n')
    json_logs = [row for row in map(json.loads, text_logs)]
    audit_logs = [row for row in json_logs if row['type'] == 'audit']
    tech_logs = [row for row in json_logs if row['type'] == 'technical']

    return audit_logs, tech_logs