import math
import pandas as pd
import pytest

from recommender_api.service_recommender import calculate_similarities


def test_calculate_similarities_with_life_situation_0():
    similarities = calculate_similarities(
        _generate_service_vectors(),
        _generate_3x10d_values(0)
    )

    similarities_list = similarities.values.tolist()
    assert not any([math.isnan(x) for x in similarities_list])
    assert all([0 <= x <= 10 for x in similarities_list])
    assert len(similarities_list) == 3


def test_calculate_similarities_with_life_situation_1():
    similarities = calculate_similarities(
        _generate_service_vectors(),
        _generate_3x10d_values(1)
    )

    similarities_list = similarities.values.tolist()
    assert not any([math.isnan(x) for x in similarities_list])
    assert all([0 <= x <= 10 for x in similarities_list])
    assert len(similarities_list) == 3


def test_calculate_similarities_with_life_situation_10():
    similarities = calculate_similarities(
        _generate_service_vectors(),
        _generate_3x10d_values(10)
    )

    similarities_list = similarities.values.tolist()
    assert not any([math.isnan(x) for x in similarities_list])
    assert all([0 <= x <= 10 for x in similarities_list])
    assert len(similarities_list) == 3


def test_calculate_similarities_no_stamps_for_one_service():
    # one of the generated service vectors has 0 value for both 'health' and 'housing'
    similarities = calculate_similarities(
        _generate_service_vectors(),
        {'health': [5], 'housing': [0]}
    )

    similarities_list = similarities.values.tolist()
    assert not any([math.isnan(x) for x in similarities_list])
    assert all([0 <= x <= 10 for x in similarities_list])
    assert len(similarities_list) == 2


def test_calculate_similarities_with_no_stamps_for_any_service():
    # all the generated service vectors have 0 value for 'life_satisfaction'
    with pytest.raises(ValueError):
        calculate_similarities(
            _generate_service_vectors(),
            {'life_satisfaction': [1]}
        )


column_names = [
    'health',
    'resilience',
    'housing',
    'working_studying',
    'family',
    'friends',
    'finance',
    'improvement_of_strenghs',
    'self_esteem',
    'life_satisfaction'
]


def _generate_3x10d_values(value):
    return {key: value for key in column_names}


def _generate_service_vectors():
    service_vectors = pd.DataFrame([
        ['s1', 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        ['s2', 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        ['s3', 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0],
    ], columns=(['service_id'] + column_names))

    service_vectors.set_index('service_id', inplace=True)
    return service_vectors
