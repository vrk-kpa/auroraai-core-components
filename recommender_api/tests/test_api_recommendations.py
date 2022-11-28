# pylint: disable=unused-argument
import datetime
import json
import copy
import sys
from typing import Dict, Any, List, Tuple, Set
import logging
import re

import pytest
from unittest.mock import patch

from tools.config import config
from tools.logger import log
from tools.db import db_connection, db_endpoint

from recommender_api import main
from recommender_api.tests.test_data.api_test_constants import CORRECT_INPUT, FEEDBACK_TEST_DATA, \
    CORRECT_INPUT_WITHOUT_SESSION, FASTTEXT_PATH, URL, TEST_SERVICE, TEST_ORGANISATION, CONTENT_TYPE_HEADER, \
    AUTHORIZATION_HEADER_NAME, VALID_HEADERS, FEEDBACK_URL, TEXT_SEARCH_URL, ATTRIBUTE_URL, \
    TEST_SERVICE_ID, TEST_SERVICE_CHANNEL_ID

DB_HOST_ROUTING, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REGION = config['db_host_routing'], config['db_port'], \
                                                                  config['db_api_user'], config['db_password'], \
                                                                  config['db_name'], config['region']


def set_log_test_stream():
    # stab the handler stream as pytest redirects stderr
    root_logger = logging.getLogger()
    handler = next(
        handler for handler in root_logger.handlers if handler.name == "aai-json-handler")
    handler.stream = sys.stderr
    return


def test_service_recommendation_incorrect_method(mock_client):
    client = mock_client
    response = client.get(URL)
    assert response.status_code == 405


def assert_status_forbidden(response):
    assert response.status_code == 401


def assert_result_format(response):
    assert response.status_code == 200
    log.debug(f'response: {response}')
    log.debug(f'json: {response.data}')
    response_data = response.json
    assert 'recommended_services' in response_data
    assert 'auroraai_recommendation_id' in response_data


def assert_recommendations(response_data: Dict, ids: List[str], names: List[str]):
    log.debug(f'response_data: {response_data}')
    assert {service['service_id']
            for service in response_data['recommended_services']} == set(ids)

    for recommendation in response_data['recommended_services']:
        assert 'service_id' in recommendation
        assert 'service_name' in recommendation
    for id_ in ids:
        assert id_ in [r['service_id']
                       for r in response_data['recommended_services']]
    for name_ in names:
        assert name_ in [r['service_name']
                         for r in response_data['recommended_services']]


def assert_service_channels(service: Dict, channel_ids: Set[str]):
    response_channel_ids = {channel['service_channel_id']
                            for channel in service['service_channels']}
    assert channel_ids == response_channel_ids


def assert_db_store(
        recommendation_id: int,
        service_ids: List[str],
        attributes: Dict[str, Any],
        request_path='/service-recommender/v1/recommend_service'
):
    with db_connection(db_endpoint_address=DB_HOST_ROUTING, db_auth_endpoint=db_endpoint(DB_NAME, REGION),
                       db_name=DB_NAME, port=DB_PORT, user=DB_USER, region=REGION) as conn:
        with conn.cursor() as cur:
            # check recommendation_id exists
            cur.execute('select * from service_recommender.recommendation where recommendation_id = %s',
                        (recommendation_id,))
            res = cur.fetchall()
            assert len(res) == 1
            assert res[0][1] == attributes.get('session_id')
            assert res[0][2] == TEST_ORGANISATION
            assert res[0][3] == TEST_SERVICE
            assert isinstance(res[0][4], datetime.datetime)
            assert res[0][5] == request_path
            assert res[0][6].items() == attributes.items()

            # Check recommendations match in DB
            cur.execute('select service_id from service_recommender.recommendation_service '
                        'where recommendation_id = %s',
                        (recommendation_id,))
            results = cur.fetchall()
            result_sercvice_ids = [r[0] for r in results]
            assert set(result_sercvice_ids) == set(service_ids)


def assert_db_feedback(feedback: Dict[str, Any]):
    with db_connection(db_endpoint_address=DB_HOST_ROUTING, db_auth_endpoint=db_endpoint(DB_NAME, REGION),
                       db_name=DB_NAME, port=DB_PORT, user=DB_USER, region=REGION) as conn:
        with conn.cursor() as cur:
            # Check recommendation feedback match in DB
            cur.execute('select feedback_score from service_recommender.recommendation_feedback '
                        'where recommendation_id = %s',
                        (feedback['auroraai_recommendation_id'],))
            results = cur.fetchall()
            result_scores = [r[0] for r in results]
            assert result_scores == [feedback['feedback_score']]

            # Check recommendation service feedbacks match in DB
            cur.execute('select service_id, feedback_score from service_recommender.recommendation_service_feedback '
                        'where recommendation_id = %s',
                        (feedback['auroraai_recommendation_id'],))
            results = cur.fetchall()
            ordered_results = sorted(results, key=lambda tup: tup[0])
            ordered_service_feedbacks = sorted([(f['service_id'], f['feedback_score'])
                                                for f in feedback['service_feedbacks']],
                                               key=lambda tup: tup[0])
            assert ordered_results == ordered_service_feedbacks


@pytest.mark.disable_client_info_mock
def test_missing_authorization(mock_client):
    client = mock_client
    response = client.post(URL, headers=CONTENT_TYPE_HEADER)
    assert_status_forbidden(response)


@pytest.mark.disable_client_info_mock
def test_invalid_authorization(mock_client):
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()
    headers = {**CONTENT_TYPE_HEADER, **{AUTHORIZATION_HEADER_NAME: 'invalid'}}
    response = client.post(URL, headers=headers)
    assert_status_forbidden(response)


def test_recommend_service_incorrect_input_simple_values(mock_add_session_transfer_indicator,
                                                         mock_get_service_collections_from_ptv):
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()

    invalid_inputs = {
        'service_filters': ['foo', 1, None, [], {'foobar': ['091']}, {'service_collections': ['foobarmock']}],
        'age': ['abc', -1, 0, 1000, '20', None],
        'limit': ['foo', -1, 0, '1', None],
        'session_id': [0, None],
        'life_situation_meters': [{}, None],
    }

    for key in invalid_inputs:
        test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]

        for value in invalid_inputs[key]:
            test_data[key] = value
            response = client.post(URL, data=json.dumps(
                test_data), headers=VALID_HEADERS)
            status = response.status_code
            assert status == 400, f'Expected status 400, got {status} with input "{key}": {value}.'


def test_recommend_service_incorrect_input_life_situation_meters():
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()

    invalid_inputs = [[None], [-1], [11], ['5'], ['foobar'], [1.5], 5, None]
    life_situation_meter_keys = [
        'working_studying',
        'family',
        'friends',
        'health',
        'improvement_of_strengths',
        'housing',
        'finance',
        'self_esteem',
        'resilience',
        'life_satisfaction'
    ]

    for key in life_situation_meter_keys:
        test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]

        for value in invalid_inputs:
            test_data['life_situation_meters'][key] = value
            response = client.post(URL, data=json.dumps(
                test_data), headers=VALID_HEADERS)
            status = response.status_code
            assert status == 400, f'Expected status 400, got {status} with input "{key}": {value}.'


def test_recommend_service_incorrect_input_service_filters():
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()

    invalid_codes = [['XYZ'], [-1], [91], [], ['091', 1], None]

    invalid_inputs = {
        'service_classes': [[], None, ['foobar'], [None], [123, 456]],
        'municipality_codes': invalid_codes,
        'region_codes': invalid_codes,
        'hospital_district_codes': invalid_codes,
        'include_national_services': ['true', 0, 1, 0.0, None, []]
    }

    for key in invalid_inputs:
        test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]

        for value in invalid_inputs[key]:
            test_data['service_filters'][key] = value
            response = client.post(URL, data=json.dumps(
                test_data), headers=VALID_HEADERS)
            status = response.status_code
            assert status == 400, f'Expected status 400, got {status} with input "{key}": {value}.'


def test_service_recommendation_municipal(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['municipality_codes'] = ['091']
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    response_json = json.loads(response.data)
    assert_result_format(response)
    assert_recommendations(
        response_json,
        [
            'd64476db-f2df-4699-bb6a-1bfae007577a',
            'e7df7411-64ef-48ef-ad5f-eebacde480e2',
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6'
        ],
        [
            'Taideopetus kulttuurikeskuksissa',
            'Harrastustoiminta',
            'Palvelu luokassa 5.3'
        ]
    )

    services = response_json['recommended_services']
    assert_service_channels(
        services[0],
        {
            'f283c2dc-8223-408a-8a73-1d62489e1f58',
            'fadd4cc4-4a00-4002-afb1-bbcfacdde5c1',
            'd589d34d-7dc1-4e25-af7b-dfd2ee9bf062'
        }
    )

    recommendation_id = json.loads(response.data)['auroraai_recommendation_id']

    assert_db_store(
        recommendation_id,
        [
            'd64476db-f2df-4699-bb6a-1bfae007577a',
            'e7df7411-64ef-48ef-ad5f-eebacde480e2',
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6'
        ],
        test_data
    )

    # Test giving feedback
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['auroraai_recommendation_id'] = recommendation_id
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 200
    assert_db_feedback(feedback)


def test_service_recommendation_nationwide(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['include_national_services'] = True

    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert_result_format(response)
    assert_recommendations(
        json.loads(response.data),
        [
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
            '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
            'd64476db-f2df-4699-bb6a-1bfae007577a',
            '6c415cf0-827d-47d0-86e4-866100bc86a8',
            '811c88b7-74db-414c-bbce-9735c9feb14a'
        ],
        [
            'Palvelu luokassa 5.3',
            'Palvelu luokissa 5.1 ja 10.2',
            'Taideopetus kulttuurikeskuksissa',
            'Työnhakuvalmennus',
            'Kansallinen palvelu luokissa 4.1 ja 10.2'
        ]
    )
    recommendation_id = json.loads(response.data)['auroraai_recommendation_id']

    assert_db_store(
        recommendation_id,
        [
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
            '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
            'd64476db-f2df-4699-bb6a-1bfae007577a',
            '6c415cf0-827d-47d0-86e4-866100bc86a8',
            '811c88b7-74db-414c-bbce-9735c9feb14a'
        ],
        test_data
    )


def test_service_recommendation_service_class_filter(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['service_classes'] = [
        'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.1',
        'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.3'
    ]

    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert_result_format(response)
    assert_recommendations(
        json.loads(response.data),
        [
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
            '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
        ],
        [
            'Palvelu luokassa 5.3',
            'Palvelu luokissa 5.1 ja 10.2'
        ]
    )

    recommendation_id = json.loads(response.data)['auroraai_recommendation_id']

    assert_db_store(
        recommendation_id,
        [
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
            '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
        ],
        test_data
    )


def test_service_recommendation_include_national_services(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['municipality_codes'] = ['638']
    test_data['service_filters']['include_national_services'] = True

    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert_result_format(response)
    assert_recommendations(
        json.loads(response.data),
        [
            '07058248-f002-4897-b1d5-7df9aa734c55',
            '6c415cf0-827d-47d0-86e4-866100bc86a8',
            '811c88b7-74db-414c-bbce-9735c9feb14a',
            '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
        ],
        [
            'Osallistu päätöksentekoon ja lainvalmisteluun',
            'Työnhakuvalmennus',
            'Kansallinen palvelu luokissa 4.1 ja 10.2',
            'Palvelu luokissa 5.1 ja 10.2'
        ]
    )

    recommendation_id = json.loads(response.data)['auroraai_recommendation_id']

    assert_db_store(
        recommendation_id,
        [
            '07058248-f002-4897-b1d5-7df9aa734c55',
            '6c415cf0-827d-47d0-86e4-866100bc86a8',
            '811c88b7-74db-414c-bbce-9735c9feb14a',
            '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
        ],
        test_data
    )


def test_service_recommendation_complex_filter(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters'] = {
        'service_classes': [
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5',
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P4.1'
        ],
        'municipality_codes': ['091'],
        'include_national_services': True
    }

    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert_result_format(response)
    assert_recommendations(
        json.loads(response.data),
        [
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
            '811c88b7-74db-414c-bbce-9735c9feb14a'
        ],
        [
            'Palvelu luokassa 5.3',
            'Kansallinen palvelu luokissa 4.1 ja 10.2'
        ]
    )

    recommendation_id = json.loads(response.data)['auroraai_recommendation_id']

    assert_db_store(
        recommendation_id,
        [
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
            '811c88b7-74db-414c-bbce-9735c9feb14a'
        ],
        test_data
    )


def test_service_recommendation_session_transfer_support(mock_client, requests_mock):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['municipality_codes'] = ['091']

    profile_manager_url = \
        f'{config["profile_management_api_url"]}/v1/aurora_ai_services/session_transfer_supports'

    requests_mock.post(profile_manager_url, json={
        'f283c2dc-8223-408a-8a73-1d62489e1f58': True})

    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert_result_format(response)

    assert len(response.json['recommended_services']) == 3

    channels = response.json['recommended_services'][0]['service_channels']
    assert len(channels) == 3

    assert channels[0]['service_channel_id'] == 'f283c2dc-8223-408a-8a73-1d62489e1f58'
    assert channels[0]['service_channel_type'] == 'EChannel'
    assert channels[0]['session_transfer']

    assert channels[1]['service_channel_id'] == 'fadd4cc4-4a00-4002-afb1-bbcfacdde5c1'
    assert channels[1]['service_channel_type'] == 'Phone'
    assert not channels[1]['session_transfer']

    assert channels[2]['service_channel_id'] == 'd589d34d-7dc1-4e25-af7b-dfd2ee9bf062'
    assert channels[2]['service_channel_type'] == 'PrintableForm'
    assert not channels[2]['session_transfer']


def test_service_recommendation_limit(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['limit'] = 1
    test_data['service_filters']['municipality_codes'] = ['091']
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert_result_format(response)
    assert_recommendations(json.loads(response.data), ['d64476db-f2df-4699-bb6a-1bfae007577a'],
                           ['Taideopetus kulttuurikeskuksissa'])
    recommendation_id = json.loads(response.data)['auroraai_recommendation_id']

    assert_db_store(recommendation_id, [
        'd64476db-f2df-4699-bb6a-1bfae007577a'], test_data)

    # Test other values for limit
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['limit'] = 0
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert response.status_code == 400

    test_data['limit'] = 1000
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert response.status_code == 400

    test_data['limit'] = 10
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert response.status_code == 200

    expected_count = 3
    test_data['limit'] = expected_count
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert response.status_code == 200
    recommendations = response.json.get('recommended_services')
    assert len(recommendations) == expected_count


def test_service_recommendation_missing_input(mock_client, mock_add_session_transfer_indicator):
    client = mock_client
    # Missing ls meters completely
    response = client.post(URL, data=json.dumps({}), headers=VALID_HEADERS)
    assert response.status_code == 400

    # Missing one ls meter. Should be OK
    for ls_meter in CORRECT_INPUT['life_situation_meters']:
        incorrect_input = copy.deepcopy(CORRECT_INPUT)
        del incorrect_input['life_situation_meters'][ls_meter]
        response = client.post(URL, data=json.dumps(
            incorrect_input), headers=VALID_HEADERS)
        assert response.status_code == 200


def test_service_recommendation_no_services_in_municipality(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['municipality_codes'] = [
        '019']  # Aura, should be empty in test data
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert_result_format(response)
    assert_recommendations(json.loads(response.data), [], [])
    recommendation_id = json.loads(response.data)['auroraai_recommendation_id']

    assert_db_store(recommendation_id, [], test_data)


def test_session_id_url(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['municipality_codes'] = [
        '091']  # currently session_id is added to Hki (091) only
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)

    # Check that Taidepoetus url has session_id
    taide_opetus_service = [service for service in response.json['recommended_services']
                            if service['service_id'] == 'd64476db-f2df-4699-bb6a-1bfae007577a'][0]
    echannel = [channel for channel in taide_opetus_service['service_channels']
                if channel['service_channel_id'] == 'f283c2dc-8223-408a-8a73-1d62489e1f58'][0]
    url = rf'https://unit-test-host/service-recommender/v1/redirect\?service_id={taide_opetus_service["service_id"]}' \
          rf'&service_channel_id={echannel["service_channel_id"]}' \
          rf'&link_id=\d+' \
          rf'&recommendation_id=\d+' \
          rf'&session_id=test_session'
    assert re.match(url, echannel['web_pages'][0])


def test_url(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(
        CORRECT_INPUT_WITHOUT_SESSION)  # type: Dict[str, Any]
    test_data['service_filters']['municipality_codes'] = [
        '091']  # currently session_id is added to Hki (091) only
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)

    # Check that Taidepoetus url has session_id
    taide_opetus_service = [service for service in response.json['recommended_services']
                            if service['service_id'] == 'd64476db-f2df-4699-bb6a-1bfae007577a'][0]
    echannel = [channel for channel in taide_opetus_service['service_channels']
                if channel['service_channel_id'] == 'f283c2dc-8223-408a-8a73-1d62489e1f58'][0]
    url = rf'https://unit-test-host/service-recommender/v1/redirect\?service_id={taide_opetus_service["service_id"]}' \
          rf'&service_channel_id={echannel["service_channel_id"]}' \
          rf'&link_id=\d+' \
          rf'&recommendation_id=\d+'
    assert re.match(url, echannel['web_pages'][0])


def test_service_recommendation_meters_invalid(mock_client):
    client = mock_client
    # Missing one ls meter
    for ls_meter in CORRECT_INPUT['life_situation_meters']:
        incorrect_input = copy.deepcopy(CORRECT_INPUT)
        incorrect_input['life_situation_meters'][ls_meter] = -1
        response = client.post(URL, data=json.dumps(
            incorrect_input), headers=VALID_HEADERS)
        assert response.status_code == 400
        incorrect_input['life_situation_meters'][ls_meter] = 11
        response = client.post(URL, data=json.dumps(
            incorrect_input), headers=VALID_HEADERS)
        assert response.status_code == 400


def test_text_search_recommendation_is_saved(mock_client, mock_add_session_transfer_indicator):
    with patch(
            'recommender_api.blueprints.blueprints.text_search_in_ptv',
            return_value=[{
                'service_id': TEST_SERVICE_ID,
                "service_channels": [{
                    "service_channel_id": TEST_SERVICE_CHANNEL_ID,
                    "web_pages": ['url1']
                }]
            }]
    ):
        client = mock_client
        mock_client.fasttext_model = None
        mock_client.fasttext_embeddings = None

        search_request = {'search_text': 'testi'}
        response = client.post(TEXT_SEARCH_URL, data=json.dumps(
            search_request), headers=VALID_HEADERS)
        assert response.status_code == 200

        recommendation_id = json.loads(response.data)[
            'auroraai_recommendation_id']

        assert_db_store(
            recommendation_id,
            [TEST_SERVICE_ID],
            search_request,
            '/service-recommender/v1/text_search'
        )


def test_text_search_input_with_bad_encoding(mock_client):
    client = mock_client
    mock_client.fasttext_model = None
    mock_client.fasttext_embeddings = None

    search_request = b'{"search_text": "testi\xf7testi"}'
    response = client.post(
        TEXT_SEARCH_URL, data=search_request, headers=VALID_HEADERS)
    assert response.status_code == 400
    assert response.data == b'Invalid encoding in request. Only UTF-8 is supported.'


def test_text_search_redirect_urls_returned(mock_client, mock_add_session_transfer_indicator):
    TEST_SERVICE_ID = 'd64476db-f2df-4699-bb6a-1bfae007577a'
    TEST_SERVICE_CHANNEL_ID = 'ab7fa8f8-b467-4a84-aaca-75c577d9e75e'

    with patch(
            'recommender_api.blueprints.blueprints.text_search_in_ptv',
            return_value=[{
                'service_id': TEST_SERVICE_ID,
                "service_channels": [{
                    "service_channel_id": TEST_SERVICE_CHANNEL_ID,
                    "web_pages": ['url1']
                }]
            }]
    ):
        client = mock_client
        mock_client.fasttext_model = None
        mock_client.fasttext_embeddings = None

        search_request = {'search_text': 'testi'}
        response = client.post(TEXT_SEARCH_URL, data=json.dumps(
            search_request), headers=VALID_HEADERS)
        assert response.status_code == 200

        response_url = response.json['recommended_services'][0]['service_channels'][0]['web_pages'][0]

        url = rf'https://unit-test-host/service-recommender/v1/redirect\?service_id={TEST_SERVICE_ID}' \
              rf'&service_channel_id={TEST_SERVICE_CHANNEL_ID}' \
              rf'&link_id=\d+' \
              rf'&recommendation_id=\d+'
    assert re.match(url, response_url)


def test_api_call_logging(mock_client, mock_add_session_transfer_indicator, capfd):
    set_log_test_stream()

    with mock_client as client:
        test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
        test_data['service_filters']['municipality_codes'] = ['091']
        response = client.post(URL, data=json.dumps(test_data), headers=VALID_HEADERS)
        recommendation_id = json.loads(response.data)[
            'auroraai_recommendation_id']

        # Send feedback
        feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
        feedback['auroraai_recommendation_id'] = recommendation_id
        client.post(FEEDBACK_URL, data=json.dumps(
            feedback), headers=VALID_HEADERS)

        # Make invalid session query
        client.get(ATTRIBUTE_URL, data=json.dumps({}), headers=VALID_HEADERS)

    out, err = capfd.readouterr()
    audit_logs, tech_logs = parse_logs(err)

    assert [(row['logs']['httpPath'], row['logs']['httpStatusCode']) for row in tech_logs] == [
        ('http://localhost/service-recommender/v1/recommend_service', 200),
        ('http://localhost/service-recommender/v1/recommendation_feedback', 200),
        ('http://localhost/service-recommender/v1/session_attributes', 400)
    ]

    assert_sql_row_count(audit_logs, 2)
    assert_matching_request_ids(audit_logs, tech_logs)


def assert_sql_row_count(audit_logs, expected: int):
    rows_with_sql = [
        row for row in audit_logs if row['logs'].get('sqlQueries')]
    assert len(rows_with_sql) == expected


def assert_matching_request_ids(audit_logs, tech_logs):
    audit_ids = {row['requestId'] for row in audit_logs}
    tech_ids = {row['requestId'] for row in tech_logs}
    assert audit_ids == tech_ids
    assert len(audit_ids) == 3


def parse_logs(raw_log: str) -> Tuple[List[Dict], List[Dict]]:
    text_logs = raw_log.strip().split('\n')
    json_logs = [row for row in map(json.loads, text_logs)]

    audit_logs = [row for row in json_logs if row['type'] == 'audit']
    tech_logs = [row for row in json_logs if row['type'] == 'technical']

    return audit_logs, tech_logs


def test_recommend_service_cosine_similarity_min_max(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert response.status_code == 200

    data = response.json.get('recommended_services')
    similarities = [item.get('similarity_score') for item in data]

    greater_than_zero = map(lambda x: x>0, similarities)
    assert all(greater_than_zero)

    less_than_one = map(lambda x: x<1, similarities)
    assert all(less_than_one)


def test_recommend_service_cosine_similarity_value(mock_client, mock_add_session_transfer_indicator):
    test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
    test_data['service_filters']['municipality_codes'] = ['638'] # only on service in this municipality in test data
    client = mock_client
    response = client.post(URL, data=json.dumps(
        test_data), headers=VALID_HEADERS)
    assert response.status_code == 200

    data = response.json.get('recommended_services')
    similarities = [item.get('similarity_score') for item in data]
    assert len(similarities) == 1

    value = 0.5660 # computed by hand to test the new similarity function
    within_limits = (value>0.5659 and value<0.5661)
    assert within_limits
