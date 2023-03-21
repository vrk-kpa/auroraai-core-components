# pylint: disable=unused-argument
import json

from recommender_api import main
from recommender_api.tests.test_data.api_test_constants import FASTTEXT_PATH, TRANSLATION_URL, VALID_HEADERS


def test_translate_search_text(mock_translate_text):
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()
    response = client.post(
        f'{TRANSLATION_URL}/search_text',
        data=json.dumps({
            "source_language": "de",
            "search_text": "Bayerische Reinheitsgebot"
        }),
        headers=VALID_HEADERS
    )
    assert response.status_code == 200
    assert json.loads(response.data) == {'target_language': 'fi', 'search_text': 'translated text'}


def test_translate_ptv_service(mock_translate_ptv_service):
    client = main.create_app(fasttext_path=FASTTEXT_PATH).test_client()
    response = client.post(
        f'{TRANSLATION_URL}/ptv_service',
        data=json.dumps({
            "target_language": "de",
            "service_id": "d64476db-f2df-4699-bb6a-1bfae007577a"
        }),
        headers=VALID_HEADERS
    )
    assert response.status_code == 200
    assert json.loads(response.data) == {
        'target_language': 'de',
        'service': {
            'description': 'translated description',
            'service_id': 'd64476db-f2df-4699-bb6a-1bfae007577a',
            'machine_translated': True
        }
    }
