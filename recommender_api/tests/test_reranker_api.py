# pylint: disable=unused-argument,invalid-name
# reasons: mock_add_session_transfer_indicator parameter needed,
# general naming convention of this project followed
import json
import copy
import os
import sys
from unittest.mock import patch
from typing import Dict, Any
import logging
import pytest
from xgboost.sklearn import XGBRanker
from recommender_api.tools.config import config

from recommender_api import main, ft
from recommender_api.tests.test_data.api_test_constants import CORRECT_INPUT, \
    FASTTEXT_PATH, URL, AUTHORIZATION_HEADER_NAME, VALID_HEADERS, TEXT_SEARCH_URL, \
    VALID_AUTHORIZATION, TEXT_SEARCH_TEST_DATA, XGBOOST_PATH, \
    REDIRECT_FEEDBACK_TEST_SERVICE_ID_LIST, REDIRECT_AND_FEEDBACK_TEST_DATA, \
    TEST_SERVICE

from recommender_api.tests.test_api_recommendations import assert_result_format, set_log_test_stream
from recommender_api.service_recommender import get_redirects_and_feedback, compute_redirect_data, \
    compute_feedback_data


if os.getenv('ENVIRONMENT') == 'localunittest':

    DB_HOST_ROUTING, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REGION = config['db_host_routing'], config['db_port'], \
        config['db_api_user'], config['db_password'], \
        config['db_name'], config['region']

    AUTHORIZATION_HEADER = {AUTHORIZATION_HEADER_NAME: VALID_AUTHORIZATION}


    @pytest.fixture(autouse=True)
    def set_test():
        test_app = main.create_app(fasttext_path=FASTTEXT_PATH)
        test_app.config['TESTING'] = True


    def test_text_search_rank(mock_client, mock_add_session_transfer_indicator):
        with patch(
                'recommender_api.blueprints.blueprints.text_search_in_ptv',
                return_value=TEXT_SEARCH_TEST_DATA
        ):
            search_request = {'search_text': 'testi'}
            response = mock_client.post(TEXT_SEARCH_URL, data=json.dumps(
                search_request), headers=VALID_HEADERS)
            assert response.status_code == 200

            services = response.json.get('recommended_services')
            assert 'rank' in services[0].keys()
            assert services[0]['rank'] == -1


    def test_text_search_rerank(mock_client, mock_add_session_transfer_indicator):
        with patch(
                'recommender_api.blueprints.blueprints.text_search_in_ptv',
                return_value=TEXT_SEARCH_TEST_DATA
        ):
            search_request = {'search_text': 'testi', 'rerank': False}
            response = mock_client.post(TEXT_SEARCH_URL, data=json.dumps(
                search_request), headers=VALID_HEADERS)
            assert response.status_code == 200

            search_request = {'search_text': 'testi', 'rerank': True}
            response = mock_client.post(TEXT_SEARCH_URL, data=json.dumps(
                search_request), headers=VALID_HEADERS)
            assert response.status_code == 200

            search_request = {'search_text': 'testi', 'rerank': "false"}
            response = mock_client.post(TEXT_SEARCH_URL, data=json.dumps(
                search_request), headers=VALID_HEADERS)
            assert response.status_code == 400

            search_request = {'search_text': 'testi', 'rerank': "true"}
            response = mock_client.post(TEXT_SEARCH_URL, data=json.dumps(
                search_request), headers=VALID_HEADERS)
            assert response.status_code == 400

            search_request = {'search_text': 'testi', 'rerank': "abcf"}
            response = mock_client.post(TEXT_SEARCH_URL, data=json.dumps(
                search_request), headers=VALID_HEADERS)
            assert response.status_code == 400

            search_request = {'search_text': 'testi', 'rerank': -1}
            response = mock_client.post(TEXT_SEARCH_URL, data=json.dumps(
                search_request), headers=VALID_HEADERS)
            assert response.status_code == 400


    def test_recommend_service_ranks_when_rerank_false(mock_client, mock_add_session_transfer_indicator):
        test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
        test_data['rerank'] = False
        test_data['limit'] = 3
        response = mock_client.post(URL, data=json.dumps(
            test_data), headers=VALID_HEADERS)
        assert_result_format(response)
        ranks = [item.get('rank') for item in response.json.get('recommended_services')]
        assert ranks == [1, 2, 3]


    def test_recommend_service_ranks_when_rerank_true(mock_client, mock_add_session_transfer_indicator):
        test_data = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
        test_data['rerank'] = True
        test_data['limit'] = 3
        response = mock_client.post(URL, data=json.dumps(
            test_data), headers=VALID_HEADERS)
        assert_result_format(response)
        ranks = [item.get('rank') for item in response.json.get('recommended_services')]
        assert ranks == [1, 2, 3]


    def test_recommend_service_rerank_order_differs(mock_client, mock_add_session_transfer_indicator):
        test_data1 = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
        test_data2 = copy.deepcopy(CORRECT_INPUT)  # type: Dict[str, Any]
        test_data1['rerank'] = False
        test_data2['rerank'] = True
        test_data1['limit'] = 3
        test_data2['limit'] = 3

        response1 = mock_client.post(URL, data=json.dumps(
            test_data1), headers=VALID_HEADERS)
        assert_result_format(response1)
        response2 = mock_client.post(URL, data=json.dumps(
            test_data2), headers=VALID_HEADERS)
        assert_result_format(response2)

        result1 = [item.get('service_id') for item in response1.json.get('recommended_services')]
        result2 = [item.get('service_id') for item in response2.json.get('recommended_services')]

        expected = result1 != result2
        assert expected


    def test_get_redirects_and_feedback():
        feedback_data = get_redirects_and_feedback(REDIRECT_FEEDBACK_TEST_SERVICE_ID_LIST,
                                                   TEST_SERVICE)
        feedback_data = feedback_data.query("recommendation_id >= 99990")
        assert set(feedback_data.recommendation_id) == {99990, 99991, 99992, 99993}


    def test_compute_redirect_data():
        redirects = compute_redirect_data(REDIRECT_FEEDBACK_TEST_SERVICE_ID_LIST,
                              REDIRECT_AND_FEEDBACK_TEST_DATA)
        assert all(redirects['prev_redirects_service'].values == [2,0,0])

    def test_compute_feedback_data():
        pos_feedback = compute_feedback_data(REDIRECT_FEEDBACK_TEST_SERVICE_ID_LIST,
                                             1,
                                             REDIRECT_AND_FEEDBACK_TEST_DATA)
        assert all(pos_feedback['prev_pos_feedback_service'].values == [0, 1, 2])

        neg_feedback = compute_feedback_data(REDIRECT_FEEDBACK_TEST_SERVICE_ID_LIST,
                                             -1,
                                             REDIRECT_AND_FEEDBACK_TEST_DATA)
        assert all(neg_feedback['prev_neg_feedback_service'].values == [0, 1, 0])


    @pytest.fixture(scope='module')
    def mock_client2():
        app = main.create_app(fasttext_path=FASTTEXT_PATH)
        app.config['TESTING'] = True
        app.fasttext_embeddings = main.load_fasttext_embeddings(FASTTEXT_PATH)
        app.fasttext_model = ft.load_model(f'{FASTTEXT_PATH}/{config["fasttext_model_file"]}')
        booster = XGBRanker()
        booster.load_model(f'{XGBOOST_PATH}/{config["xgboost_model_file"]}')
        app.xgboost_model = booster
        client = app.test_client()
        yield client
        client.delete()


    def test_text_search_ranks_when_rerank_false(mock_client2, mock_add_session_transfer_indicator):
        search_request = {'search_text': 'testi', 'rerank': False, 'limit': 3}
        response = mock_client2.post(TEXT_SEARCH_URL, data=json.dumps(
            search_request), headers=VALID_HEADERS)
        assert response.status_code == 200
        assert_result_format(response)
        ranks = [item.get('rank') for item in response.json.get('recommended_services')]
        assert ranks == [1, 2, 3]


    def test_text_search_ranks_when_rerank_true(mock_client2, mock_add_session_transfer_indicator):
        search_request = {'search_text': 'harrastusmahdollisuus', 'rerank': True, 'limit': 3}
        response = mock_client2.post(TEXT_SEARCH_URL, data=json.dumps(
            search_request), headers=VALID_HEADERS)
        assert response.status_code == 200
        assert_result_format(response)
        ranks = [item.get('rank') for item in response.json.get('recommended_services')]
        assert ranks == [1, 2, 3]


    def test_text_search_rerank_order_differs(mock_client2, mock_add_session_transfer_indicator):
        search_request1 = {'search_text': 'harrastusmahdollisuus', 'rerank': True, 'limit': 3}
        search_request2 = {'search_text': 'harrastusmahdollisuus', 'rerank': False, 'limit': 3}
        response1 = mock_client2.post(TEXT_SEARCH_URL, data=json.dumps(
            search_request1), headers=VALID_HEADERS)
        response2 = mock_client2.post(TEXT_SEARCH_URL, data=json.dumps(
            search_request2), headers=VALID_HEADERS)
        result1 = [item.get('service_id') for item in response1.json.get('recommended_services')]
        result2 = [item.get('service_id') for item in response2.json.get('recommended_services')]
        expected = result1 != result2
        assert expected
