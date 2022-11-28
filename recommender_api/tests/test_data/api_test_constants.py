import pandas as pd
import numpy as np

FASTTEXT_PATH = "fasttext"
XGBOOST_PATH = "xgboost"

AUTHORIZATION_HEADER_NAME = 'Authorization'
VALID_AUTHORIZATION = 'Basic YWJjZDphYmNk'
TEST_SESSION = 'test_session'
TEST_ORGANISATION = 'test_organisation'
TEST_SERVICE = 'test_service'
EMBEDDING_SIZE = (768,)

URL = 'service-recommender/v1/recommend_service'
TEXT_SEARCH_URL = 'service-recommender/v1/text_search'
ATTRIBUTE_URL = 'service-recommender/v1/session_attributes'
FEEDBACK_URL = 'service-recommender/v1/recommendation_feedback'
TRANSLATION_URL = 'service-recommender/v1/translation'
CONTENT_TYPE_HEADER = {'Content-Type': 'application/json'}
AUTHORIZATION_HEADER = {AUTHORIZATION_HEADER_NAME: VALID_AUTHORIZATION}
VALID_HEADERS = {**CONTENT_TYPE_HEADER, **AUTHORIZATION_HEADER}

TEST_SERVICE_ID = 'd64476db-f2df-4699-bb6a-1bfae007577a'
TEST_SERVICE_CHANNEL_ID = 'ab7fa8f8-b467-4a84-aaca-75c577d9e75e'
REDIRECT_FEEDBACK_TEST_SERVICE_ID_LIST = ['d64476db-f2df-4699-bb6a-1bfae007577a',
                                          '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
                                          'b9e2ff7d-3d18-476d-94e0-4a818f1136d6']

CORRECT_INPUT = {
    'life_situation_meters': {
        'working_studying': [7],
        'family': [7],
        'friends': [7],
        'health': [7],
        'improvement_of_strengths': [0, 1],
        'housing': [7],
        'finance': [7],
        'self_esteem': [7],
        'resilience': [7],
        'life_satisfaction': [7]},
    'session_id': TEST_SESSION,
    'service_filters': {
        'include_national_services': False
    }
}

CORRECT_INPUT_WITHOUT_SESSION = {
    'life_situation_meters': {
        'working_studying': [7],
        'family': [7],
        'friends': [7],
        'health': [7],
        'improvement_of_strengths': [0, 1],
        'housing': [7],
        'finance': [7],
        'self_esteem': [7],
        'resilience': [7],
        'life_satisfaction': [7]},
    'service_filters': {
        'include_national_services': False
    }
}

FEEDBACK_TEST_DATA = {
    'auroraai_recommendation_id': 99700,
    'feedback_score': -1,
    'service_feedbacks': [
        {'service_id': 'e7df7411-64ef-48ef-ad5f-eebacde480e2', 'feedback_score': -1},
        {'service_id': 'd64476db-f2df-4699-bb6a-1bfae007577a', 'feedback_score': 1}
    ]
}

TEXT_SEARCH_TEST_DATA = [{
        'service_id': TEST_SERVICE_ID,
        "service_channels": [{
            "service_channel_id": TEST_SERVICE_CHANNEL_ID,
            "web_pages": ['url1']
        }],
        'rank': -1
    }]

REDIRECT_AND_FEEDBACK_TEST_DATA = pd.DataFrame(\
    np.c_[[1, 1, 1, 2, 2, 3],
          ['b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
           'd64476db-f2df-4699-bb6a-1bfae007577a',
           '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
           'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
           'd64476db-f2df-4699-bb6a-1bfae007577a',
           '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'],
          [1, np.nan, 1, 1, np.nan, -1],
          np.repeat("test_service", 6),
          [np.nan, np.datetime64('now'), np.nan,
           np.nan, np.datetime64('now'), np.nan]],
    columns=['recommendation_id',
             'service_id',
             'feedback_score',
             'calling_service',
             'redirect_time'])
