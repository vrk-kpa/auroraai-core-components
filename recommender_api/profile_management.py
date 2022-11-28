from typing import Any, Dict, List

import requests

from tools.config import config
from tools.utils import get_secret

profile_management_url = config['profile_management_api_url']

CHANNEL_TYPE_FOR_SESSION_TRANSFER = 'EChannel'


def get_profile_management_api_key() -> str:
    return (config.get('profile_management_recommender_api_key')
            or get_secret('Profile_Management_Recommender_Api_key')['value'])


def add_session_transfer_indicator(recommended_services: List[Dict[str, Any]]):
    response = requests.post(
        f'{profile_management_url}/v1/aurora_ai_services/session_transfer_supports',
        json={'ptv_service_channel_ids': _get_session_transfer_channel_candidates(recommended_services)},
        headers={'authorization': f'Key {get_profile_management_api_key()}'}
    )

    response.raise_for_status()
    session_transfer_supports = response.json()

    _set_session_transfer_boolean(recommended_services, session_transfer_supports)


def get_client_info(authorization_header):
    response = requests.get(
        f'{profile_management_url}/oauth/client_info',
        headers={'Authorization': authorization_header}
    )
    response.raise_for_status()
    return response.json()


def post_session_attributes(attributes, service_channel_id):
    response = None
    try:
        url = f'{profile_management_url}/v1/session_attributes'
        headers = {'authorization': f'Key {get_profile_management_api_key()}'}
        body = {
            "sessionAttributes": attributes,
            "ptvServiceChannelId": service_channel_id
        }

        response = requests.post(url, json=body, headers=headers)
        response.raise_for_status()

        return response.json()

    except requests.exceptions.HTTPError as error:
        status = response.status_code if response is not None else 500
        message = 'Error'
        if status == 400:
            try:
                message = response.json()['message']
            except (ValueError, KeyError):
                message = "Validation error"

        if status == 404:
            message = "Service channel id not found"

        raise ProfileManagementApiError(status, message) from error


def _get_session_transfer_channel_candidates(recommended_services: List[Dict[str, Any]]):
    return [
        service_channel['service_channel_id']
        for service in recommended_services
        for service_channel in service['service_channels']
        if service_channel.get('service_channel_type') == CHANNEL_TYPE_FOR_SESSION_TRANSFER
    ]


def _set_session_transfer_boolean(
        recommended_services: List[Dict[str, Any]],
        session_transfer_supports: Dict[str, Any]
):
    for service in recommended_services:
        for service_channel in service['service_channels']:
            service_channel['session_transfer'] = bool(
                session_transfer_supports.get(service_channel['service_channel_id'])
            )


class ProfileManagementApiError(Exception):
    def __init__(self, http_status=200, message="Error from profile-management-api"):
        self.http_status = http_status
        self.message = message
        super().__init__(self.message)
