import logging
import warnings
from uuid import UUID, uuid4
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, TypeVar
from .config import config

from flask import Response, Request
from pythonjsonlogger import jsonlogger

_log_context: ContextVar = ContextVar("log_context", default={})


class Log:
    """
    This logger class can be used for canonical logging, i.e. creating one big log row per REST call.

    A single global instance of this class is created below that can be used for all logging. The logger
    collects the log data into a context variable during request handling and at the end of request handler
    the log row is flushed to the log stream.
    """

    def __init__(self):
        pass

    @contextmanager
    def open(self):
        yield self
        self.flush()

    @property
    def technical(self):
        return self._get_context()['technical']

    @property
    def audit(self):
        return self._get_context()['audit']

    def flush(self):
        self.technical.flush(),
        self.audit.flush()
        _log_context.set({})

    @staticmethod
    def debug(message: str):
        """
        This method can be used for debug printing, it bypasses the context buffers.
        """
        logging.getLogger().debug(message)

    @staticmethod
    def _get_context():
        context = _log_context.get()
        if not context:
            request_id = uuid4()
            context = {
                'audit': AuditLogContext(request_id),
                'technical': TechnicalLogContext(request_id)
            }
            _log_context.set(context)
        return context


# The global log instance that other modules should import
log = Log()


class LogOperationName(Enum):
    PTV_DATA_LOADER = "ptvDataLoader"
    SERVER_INITIALIZATION = "serverInitialization"
    DB_AUTHENTICATION = "dbAuthentication"
    SERVER_START = "serverStart"
    API_CALL = "apiCall"
    MESSAGE = "message"
    WARNING = "warning"

    def __str__(self):
        return str(self.value)


class LogEntry:
    type: str = ""

    def __init__(self):
        self.errors: Optional[List[str]] = None


class AuditLogEntry(LogEntry):
    type: str = "audit"

    def __init__(self):
        super().__init__()
        self.sqlQueries: List[str] = []
        self.senderIP: str = ""
        self.httpBody: str = ""
        self.queryString: str = ""
        self.dbPassword: str = ""
        self.username: str = ""
        self.apiKey: str = ""
        self.attributes: List[str] = []
        self.clientId: str = ""
        self.retrievedAttributes: [] = []
        self.contactedDataProviders: List[Dict] = []


class TechnicalLogEntry(LogEntry):
    type: str = "technical"

    def __init__(self):
        super().__init__()
        self.environment: str = ""
        self.httpPath: str = ""
        self.httpMethod: str = ""
        self.httpStatusCode: Optional[int] = None
        self.durationMs: Optional[int] = None
        self.operationName: LogOperationName = LogOperationName.MESSAGE
        self.host: str = ""
        self.port: Optional[int] = None
        self.dbHost: str = ""
        self.dbPort: Optional[int] = None
        self.dbName: str = ""
        self.ptvServiceChannelId: str = ""
        self.auroraAIServiceId: str = ""
        self.bertPath: str = ""
        self.ptvEmbeddingsPath: str = ""
        self.branch: str = ""
        self.build: str = ""
        self.commitSha: str = ""
        self.messages: Optional[List[str]] = None


EntryType = TypeVar('EntryType')


class BaseLogContext:
    """Base class for logger that is stored in context variable."""

    def __init__(self, request_id: UUID):
        self.request_id = request_id
        self.data = LogEntry()

    def error(self, message: str):
        if not self.data.errors:
            self.data.errors = []
        self.data.errors.append(message)

    def info(self, key: str, value):
        if key in self.data.__dict__:
            self.data.__dict__[key] = value

    def to_dict(self):
        return {
            'requestId': self.request_id,
            'timestamp': datetime.utcnow().isoformat(),
            'type': self.data.type,
            'logs': {k: v for k, v in self.data.__dict__.items() if v not in [None, '', [], {}]}
        }

    def flush(self):
        log_dict = self.to_dict()

        if log_dict.get('logs'):
            logging.getLogger().info(log_dict)


class TechnicalLogContext(BaseLogContext):
    """Technical logger that is stored in context variable."""

    def __init__(self, request_id: UUID):
        super().__init__(request_id)
        self.data: TechnicalLogEntry = TechnicalLogEntry()

    def request(self, request: Request):
        self.data.operationName = LogOperationName.API_CALL
        self.data.httpPath = request.base_url
        self.data.httpMethod = request.method

    def response(self, response: Response):
        self.data.httpStatusCode = response.status_code

    def database(self, host: str, port: int, name: str):
        self.data.dbHost = host
        self.data.dbPort = port
        self.data.dbName = name

    def message(self, message: str):
        if not self.data.messages:
            self.data.messages = []
        self.data.messages.append(message)


class AuditLogContext(BaseLogContext):
    """Audit logger that is stored in context variable."""

    def __init__(self, request_id):
        super().__init__(request_id)
        self.data: AuditLogEntry = AuditLogEntry()

    def request(self, request: Request):
        self.data.queryString = request.query_string.decode("utf-8")
        self.data.httpBody = request.data.decode("utf-8")

    def sql_query(self, query: str):
        self.data.sqlQueries.append(query)

    def contacted_data_provider(self, requests_log_record: logging.LogRecord):
        self.data.contactedDataProviders.append({
            'request': requests_log_record.getMessage()
        })


class AuroraAiJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        if record.levelname == 'DEBUG' and record.name == 'root':
            message_dict['debugMessage'] = record.message

        log_record.update(message_dict)


class RequestsLogHandler(logging.NullHandler):
    """Pass requests lib logs to the canonical logger."""
    def handle(self, record: logging.LogRecord):
        log.audit.contacted_data_provider(record)
        return False


class AuroraAiLogHandler(logging.StreamHandler):
    """
    A normal stream handler, except pass handle logs from 3rd party libs
    through the canonical logger.
    """
    def handle(self, record: logging.LogRecord):
        if record.name != 'root':
            log.technical.message(record.getMessage())
            if record.exc_info is not None:
                error_type, error, _ = record.exc_info
                log.technical.error(f'{error_type}: {error}')
            if record.stack_info is not None:
                log.technical.error(record.stack_info)

            return False

        super(AuroraAiLogHandler, self).handle(record)


def init_logging_lib():
    """
    Initialize the 'logging' library used to output the logs to stderr.
    """
    handler_name = "aai-json-handler"
    root_logger = logging.getLogger()
    if handler_name not in [handler.name for handler in root_logger.handlers]:
        root_logger.setLevel(config['log_level'].upper())
        formatter = AuroraAiJsonFormatter(json_ensure_ascii=False)
        log_handler = AuroraAiLogHandler()
        log_handler.setFormatter(formatter)
        log_handler.name = handler_name
        root_logger.addHandler(log_handler)

    requests_logger = logging.getLogger("urllib3.connectionpool")
    requests_logger.setLevel(logging.DEBUG)
    requests_logger.addHandler(RequestsLogHandler())
    requests_logger.propagate = False


def format_warnings_to_json(msg, category, filename, lineno, line=None):
    category_name = category.__name__ if category else "Warning"

    entry = {
        'type': 'technical',
        'operationName': LogOperationName.WARNING,
        'timestamp': datetime.utcnow().isoformat(),
        'errors': [f"{category_name}: {msg} in {filename} line {lineno}. Line: {line}"]
    }

    record = logging.LogRecord(category_name, logging.WARNING, filename, lineno, entry, None, None)

    return f"{AuroraAiJsonFormatter().format(record)}\n"


warnings.formatwarning = format_warnings_to_json