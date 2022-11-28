import os
from unittest.mock import patch
import pytest

from recommender_api import main
from recommender_api.tests.test_data.api_test_constants import TEST_ORGANISATION, TEST_SERVICE, FASTTEXT_PATH, XGBOOST_PATH
from recommender_api.tests.test_db import mock_rds_describe_db_instances, mock_auth_token


@pytest.fixture(name="mock_db_auth", autouse=True)
def fixture_mock_db_auth():
    with patch('botocore.client.BaseClient._make_api_call', new=mock_rds_describe_db_instances):
        with patch('tools.db.auth_token', new=mock_auth_token):
            yield


@pytest.fixture(name="mock_init_fasttext", autouse=True)
def fixture_mock_init_fasttext():
    """do not init fasttext in unit tests until we have a plan how to test it"""
    with patch(
            'recommender_api.main.init_fasttext',
            return_value=None
    ):
        yield


@pytest.fixture(autouse=True)
def mock_client():
    app = main.create_app(fasttext_path=FASTTEXT_PATH)
    app.config['TESTING'] = True
    app.fasttext_embeddings = None
    app.fasttext_model = None
    client = app.test_client()
    yield client
    client.delete()


@pytest.fixture(name="mock_get_client_info", autouse=True)
def fixture_mock_get_client_info(request):
    if 'disable_client_info_mock' not in request.keywords:
        with patch(
                'recommender_api.blueprints.blueprints.profile_management.get_client_info',
                return_value={'provider': {'fi': TEST_ORGANISATION},
                              'name': {'fi': TEST_SERVICE}}
        ):
            yield
    else:
        yield


@pytest.fixture(name="mock_add_session_transfer_indicator")
def fixture_mock_add_session_transfer_indicator():
    with patch(
            'recommender_api.blueprints.blueprints.profile_management.add_session_transfer_indicator',
            new=lambda services: services
    ):
        yield


@pytest.fixture(name="mock_get_secret", autouse=True)
def fixture_mock_get_secret():
    with patch(
            'recommender_api.profile_management.get_secret',
            return_value={'value': 'top-secret'}
    ):
        yield


@pytest.fixture(name="mock_get_service_collections_from_ptv")
def fixture_mock_get_service_collections_from_ptv():
    with patch(
            'recommender_api.api_spec.get_service_collections_from_ptv',
            return_value={'744c4b61-fde5-4d23-a844-cee5728b9119'}
    ):
        yield


@pytest.fixture(name="mock_translate_text")
def fixture_mock_translate_text():
    with patch(
            'recommender_api.blueprints.blueprints.translate_text',
            new=lambda _, __, ___: "translated text"
    ):
        yield


@pytest.fixture(name="mock_translate_ptv_service")
def fixture_mock_translate_ptv_service():
    with patch(
            'recommender_api.blueprints.blueprints.translate_service_information',
            new=lambda service, __, ___: {
                "service_id": service.get("service_id"),
                "description": "translated description"
            }
    ):
        yield


def pytest_addoption(parser):
    # ability to test API on different hosts
    parser.addoption("--host", action="store", default="http://localhost:5000")


@pytest.fixture(scope="session")
def host(request):
    return request.config.getoption("--host")


@pytest.fixture(scope="session")
def api_v1_host(host_name):
    return os.path.join(host_name, "api", "v1")
