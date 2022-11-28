# pylint: disable=unused-argument
import json
import copy

from recommender_api.tests.test_data.api_test_constants import FEEDBACK_TEST_DATA, VALID_HEADERS, FEEDBACK_URL


def test_feedback(mock_client):
    # Test giving feedback with valid payload
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['auroraai_recommendation_id'] = 99990
    response = mock_client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 200


def test_feedback_invalid_recommendation_id(mock_client):
    client = mock_client

    # Test giving feedback with a non-existent id
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['auroraai_recommendation_id'] = 987654
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 404

    # Test giving feedback with a string formed recommendation ID
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['auroraai_recommendation_id'] = '99700'
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 400


def test_feedback_invalid_score(mock_client):
    client = mock_client

    # Test giving feedback when general feedback is invalid
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['feedback_score'] = 20
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 400

    # Test giving feedback when service feedback is invalid
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['service_feedbacks'][0]['feedback_score'] = 20
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 400


def test_feedback_invalid_service_id(mock_client):
    client = mock_client

    # Test giving feedback with invalid UUID
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['service_feedbacks'][0]['service_id'] = 'id1'
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 400

    # Test giving feedback with UUIDv1 (should fail too)
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['service_feedbacks'][0]['service_id'] = '491d94b0-1ba0-11ec-9621-0242ac130002'
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)

    # Test giving feedback with unexistent service_id
    feedback = copy.deepcopy(FEEDBACK_TEST_DATA)
    feedback['service_feedbacks'][0]['service_id'] = '867fa742-3806-4fa5-b2c0-5749ea325167'
    response = client.post(FEEDBACK_URL, data=json.dumps(
        feedback), headers=VALID_HEADERS)
    assert response.status_code == 404
