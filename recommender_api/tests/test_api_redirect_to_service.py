# pylint: disable=unused-argument

import json
import copy
from typing import Dict, Any

from recommender_api.tests.test_data.api_test_constants import CORRECT_INPUT, VALID_HEADERS, URL


def test_redirect_to_service(mock_client, mock_add_session_transfer_indicator):
    with mock_client as client:
        test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
        test_data['service_filters']['municipality_codes'] = ['091']
        response = client.post(URL, data=json.dumps(
            test_data), headers=VALID_HEADERS)
        redirect_url = response.json['recommended_services'][0]['service_channels'][0]['web_pages'][0]
        response = client.get(redirect_url)
        assert response.status_code == 302


def test_redirect_to_service_with_session_access_token(mock_client, mock_add_session_transfer_indicator):
    with mock_client as client:
        test_data = copy.deepcopy(CORRECT_INPUT)
        test_data['service_filters']['municipality_codes'] = ['091']
        response = client.post(URL, data=json.dumps(
            test_data), headers=VALID_HEADERS)
        token_query = '&auroraai_access_token=TOKEN'
        redirect_url = f"{response.json['recommended_services'][0]['service_channels'][0]['web_pages'][0]}{token_query}"
        response = client.get(redirect_url, follow_redirects=True)
        assert token_query in str(response.request)
        # follow_redirects is TRUE = actual status code is sent which is 404
        # since the host of the URL does not really exist
        assert response.status_code == 404


def test_redirect_to_service_invalid_params(mock_client, mock_add_session_transfer_indicator):
    with mock_client as client:
        redirect_url = f'/service-recommender/v1/redirect?service_id=a9ba7a3c-30b2-41a8-8f24-e0fc255402a6&service_channel_id=a9ba7a3c-30b2-41a8-8f24-e0fc255402a6&link_id=0&recommendation_id=999999'
        response = client.get(redirect_url)
        assert response.status_code == 404


def test_redirect_to_service_missing_params(mock_client, mock_add_session_transfer_indicator):
    with mock_client as client:
        redirect_url = f'/service-recommender/v1/redirect'
        response = client.get(redirect_url)
        assert response.status_code == 400
