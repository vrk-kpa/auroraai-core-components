import json
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode

from werkzeug.datastructures import HeaderSet

from recommender_api.tools.config import config
from recommender_api import main
from recommender_api.tests.test_data.api_test_constants import FASTTEXT_PATH, VALID_HEADERS, ATTRIBUTE_URL


def test_get_session_attributes(requests_mock):
    mock_response = {
        "life_situation_meters": {"family": [8]},
        "municipality_code": '049',
        "age": 20
    }

    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()

    recommender_url_with_token = ATTRIBUTE_URL + '?access_token=testtoken'
    profile_management_url = f'{config["profile_management_api_url"]}/v1/session_attributes'

    requests_mock.get(profile_management_url, json=mock_response)
    response = client.get(recommender_url_with_token, headers=VALID_HEADERS)

    assert requests_mock.called_once
    assert requests_mock.last_request.headers['authorization'] == 'Key top-secret'

    assert response.status_code == 200
    assert response.access_control_allow_origin == '*'
    assert response.access_control_allow_headers == HeaderSet(['Content-Type'])
    assert json.loads(response.data) == mock_response


def test_get_session_attributes_with_profile_management_errors(requests_mock):
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()

    test_errors = [
        {"code": 400, "message": b"Invalid access token format"},
        {"code": 401, "message": b"Error"},
        {"code": 404, "message": b"Access token does not exist"},
        {"code": 500, "message": b"Error"},
        {"code": 504, "message": b"Error"}
    ]

    for error in test_errors:
        recommender_url_with_token = ATTRIBUTE_URL + '?access_token=testtoken'
        profile_management_url = f'{config["profile_management_api_url"]}/v1/session_attributes'

        requests_mock.get(profile_management_url, status_code=error['code'], json={
            "error": "Some error message"})
        response = client.get(recommender_url_with_token,
                              headers=VALID_HEADERS)

        assert requests_mock.last_request.headers['authorization'] == 'Key top-secret'

        assert response.status_code == error['code']
        assert response.access_control_allow_origin == '*'
        assert response.access_control_allow_headers == HeaderSet([
            'Content-Type'])
        assert response.data == error['message']


def test_get_session_attributes_without_token():
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()

    for test_url in [
        ATTRIBUTE_URL,
        ATTRIBUTE_URL + '?wrongquery=testtoken',
        ATTRIBUTE_URL + '?access_token='
    ]:
        response = client.get(test_url, data=json.dumps({}), headers=VALID_HEADERS)
        assert response.status_code == 400
        assert response.data == b'access_token is a required parameter'


def test_post_session_attributes_returns_direct_link(requests_mock):
    test_data = {
        "service_channel_id": "f283c2dc-8223-408a-8a73-1d62489e1f58",
        "session_attributes": {
            "life_situation_meters": {"family": [8]},
            "municipality_code": '049',
            "age": 20
        }
    }

    response = _make_session_transfer_request(requests_mock, test_data)

    assert response.status_code == 200
    assert response.data.decode("utf-8") == 'url2?auroraai_access_token=testtoken'

    assert requests_mock.called_once
    assert requests_mock.last_request.headers['authorization'] == 'Key top-secret'

    profile_management_request_body = requests_mock.last_request.json()
    assert profile_management_request_body['sessionAttributes'] == test_data['session_attributes']
    assert profile_management_request_body['ptvServiceChannelId'] == test_data['service_channel_id']


def test_post_session_attributes_returns_redirect_link(requests_mock):
    test_data = {
        "service_channel_id": "f283c2dc-8223-408a-8a73-1d62489e1f58",
        "service_id": "d64476db-f2df-4699-bb6a-1bfae007577a",
        "auroraai_recommendation_id": 3456,
        "session_attributes": {"age": 20}
    }

    response = _make_session_transfer_request(requests_mock, test_data)

    assert response.status_code == 200

    redirect_url = urlparse(response.data.decode("utf-8"))
    assert parse_qs(redirect_url.query)['auroraai_access_token'][0] == 'testtoken'
    assert parse_qs(redirect_url.query)['service_id'][0] == test_data['service_id']
    assert parse_qs(redirect_url.query)['service_channel_id'][0] == test_data['service_channel_id']
    assert parse_qs(redirect_url.query)['recommendation_id'][0] == str(test_data['auroraai_recommendation_id'])
    assert parse_qs(redirect_url.query)['link_id'][0] == '0'

    assert urlunparse(redirect_url._replace(query=urlencode({}, True))) == "https://unit-test-host/service-recommender/v1/redirect"

    assert requests_mock.called_once
    assert requests_mock.last_request.headers['authorization'] == 'Key top-secret'

    profile_management_request_body = requests_mock.last_request.json()
    assert profile_management_request_body['sessionAttributes'] == test_data['session_attributes']
    assert profile_management_request_body['ptvServiceChannelId'] == test_data['service_channel_id']



def test_post_session_attributes_with_profile_management_error(requests_mock):
    test_data = {
        "service_channel_id": "f283c2dc-8223-408a-8a73-1d62489e1f58",
        "session_attributes": {"age": 20}
    }

    test_errors = [
        {"code": 400, "message": b"Validation error"},
        {"code": 401, "message": b"Error"},
        {"code": 404, "message": b"Service channel id not found"},
        {"code": 500, "message": b"Error"},
        {"code": 504, "message": b"Error"}
    ]

    for error in test_errors:
        client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()
        profile_management_url = f'{config["profile_management_api_url"]}/v1/session_attributes'

        requests_mock.post(profile_management_url, status_code=error['code'], json={"error": "message"})
        response = client.post(ATTRIBUTE_URL, data=json.dumps(test_data), headers=VALID_HEADERS)

        assert requests_mock.last_request.headers['authorization'] == 'Key top-secret'

        assert response.status_code == error['code']
        assert response.data == error['message']


def test_post_session_attributes_invalid_inputs():
    invalid_inputs = [
        {},
        {"service_channel_id": "f283c2dc-8223-408a-8a73-1d62489e1f58"},
        {
            "session_attributes": {
                "life_situation_meters": {"family": [8]},
                "municipality_code": '049',
                "age": 20
            }
        },
        {
            "service_channel_id": "f283c2dc-8223-408a-8a73-1d62489e1f58",
            "session_attributes": {"municipality_code": '9999'}
        }
    ]

    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()
    for test_data in invalid_inputs:
        response = client.post(ATTRIBUTE_URL, data=json.dumps(
            test_data), headers=VALID_HEADERS)
        assert response.status_code == 400


def _make_session_transfer_request(requests_mock, test_data):
    mock_response = {"accessToken": "testtoken"}

    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()
    profile_management_url = f'{config["profile_management_api_url"]}/v1/session_attributes'

    requests_mock.post(profile_management_url, json=mock_response)
    return client.post(ATTRIBUTE_URL, data=json.dumps(test_data), headers=VALID_HEADERS)
