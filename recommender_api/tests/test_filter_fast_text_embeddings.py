import numpy as np
from numpy.testing import assert_array_equal

from recommender_api.service_recommender import _filter_fast_text_embeddings


def test_filter_fast_text_embeddings():
    embeddings_input = {
        'ids': [
            'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
            '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
            'd64476db-f2df-4699-bb6a-1bfae007577a'
        ],
        'values': np.array([[1, 2], [3, 4], [5, 6]])
    }

    filtered_service_ids, filtered_embeddings = _filter_fast_text_embeddings(
        embeddings_input, ['091'], False, [], [], [], [])

    assert filtered_service_ids == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        'd64476db-f2df-4699-bb6a-1bfae007577a'
    ]
    assert_array_equal(filtered_embeddings, np.array([[1, 2], [5, 6]]))
