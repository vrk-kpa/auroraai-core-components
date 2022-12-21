from typing import Any, Dict, List, Optional, Tuple

from recommender_api.tools.config import config
from recommender_api.tools.logger import log

MOCK_SERVICE_ID = '999'
MOCK_SERVICE_URL = f'{config["service_host"]}/mock-service/service'
log.debug(f'mock service url {MOCK_SERVICE_URL}')


def _get_mock_service():
    return {
        "charge_additional_info": "",
        "charge_type": "",
        "requirements": [
            ""
        ],
        "service_channels": [
            {
                "address": "",
                "emails": [],
                "phone_numbers": [],
                "service_channel_description_summary": "Mock palvelun verkkosivu",
                "service_channel_id": "f4eda39d-92ba-40cd-ae4a-a524e586969f",
                "service_channel_name": "Sessionsiirtolinkki, osa attribuuteista tuettu",
                "service_channel_type": "EChannel",
                "service_hours": [],
                "web_pages": [
                    MOCK_SERVICE_URL
                ]
            },
            {
                "address": "",
                "emails": [],
                "phone_numbers": [],
                "service_channel_description_summary": "Mock palvelun verkkosivu",
                "service_channel_id": "0ba11195-de64-43b3-af64-41aba7285364",
                "service_channel_name": "Sessionsiirtolinkki, kaikki attribuutit tuettu",
                "service_channel_type": "EChannel",
                "service_hours": [],
                "web_pages": [
                    MOCK_SERVICE_URL
                ]
            },
            {
                "address": "",
                "emails": [],
                "phone_numbers": [],
                "service_channel_description_summary": "Mock palvelun verkkosivu",
                "service_channel_id": "7a330e4e-f5e1-4884-81ea-34805fac20aa",
                "service_channel_name": "Ei session siirtoa",
                "service_channel_type": "EChannel",
                "service_hours": [],
                "web_pages": [
                    MOCK_SERVICE_URL
                ]
            }
        ],
        "service_description": "Mock palvelu",
        "service_id": "6a2b1374-9a2d-47bc-8cd9-33b0db1566e1",
        "service_name": "Testaa session siirtoa mock palvelussa"
    }


def mock_service_results() -> Tuple[List[str], List[Dict[str, Any]]]:
    return [MOCK_SERVICE_ID], [_get_mock_service()]


def search_mock_service_channel(service_channel_id: str) -> Optional[Dict[str, Any]]:
    mock_service = _get_mock_service()
    for channel in mock_service['service_channels']:
        if channel['service_channel_id'] == service_channel_id:
            return channel
    return None
