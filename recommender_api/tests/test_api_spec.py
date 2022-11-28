import pytest
from marshmallow import ValidationError
from recommender_api.api_spec import TextSearchInput, PostSessionAttributesInput


def test_text_search_input_accepts_basic_search_text():
    TextSearchInput().load({"search_text": "Åke-Öykkäröi 30291x Ääliå"})


def test_text_search_input_accepts_minimal_search_textt():
    TextSearchInput().load({"search_text": "a"})


def test_text_search_input_accepts_maximal_search_textt():
    TextSearchInput().load({"search_text": "9" * 1024})


def test_text_search_input_rejects_empty_input():
    with pytest.raises(ValidationError):
        TextSearchInput().load({"search_text": ""})


def test_text_search_input_rejects_none_input():
    with pytest.raises(ValidationError):
        TextSearchInput().load({"search_text": None})


def test_text_search_input_rejects_too_long_search_text():
    with pytest.raises(ValidationError):
        TextSearchInput().load({"search_text": "9" * 1025})


def test_text_search_input_accepts_search_text_with_special_characters():
    # These marshmallow input validation does nothing to these. These are filtered elsewhere.
    for character in "[]/\\=!#${}@&%()\"'\t":
        TextSearchInput().load({"search_text": character})


def test_text_search_input_accepts_limit_number():
    TextSearchInput().load({
        "search_text": "testi",
        "limit": 50
    })


def test_text_search_input_rejects_limit_string():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "limit": "12"
        })


def test_text_search_input_rejects_municipality_code():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "municipality_code": "091"
        })

def test_text_search_input_accepts_rerank_false():
    TextSearchInput().load({
        "search_text": "testi",
        "rerank": False
    })


def test_text_search_input_accepts_rerank_true():
    TextSearchInput().load({
        "search_text": "testi",
        "rerank": True
    })


def test_text_search_input_rejects_rerank_true_string():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "rerank": "true"
        })


def test_text_search_input_rejects_rerank_false_string():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "rerank": "false"
        })


def test_text_search_input_rejects_rerank_number_zero():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "rerank": 0
        })


def test_text_search_input_rejects_rerank_number_one():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "rerank": 1
        })


def test_text_search_input_rejects_rerank_string():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "rerank": "abcdf"
        })


def test_text_search_rejects_include_national_services_rejects_false_as_string():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": "false"}
        })


def test_text_search_rejects_include_national_services_rejects_true_as_string():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": "true"}
        })


def test_text_search_rejects_include_national_services_rejects_null_as_string():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": "null"}
        })


def test_text_search_rejects_include_national_services_rejects_number_zero():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": 0}
        })


def test_text_search_rejects_include_national_services_rejects_number_one():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": 1}
        })


def test_text_search_rejects_include_national_services_rejects_none():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": None}
        })


def test_text_search_rejects_include_national_services_rejects_empty_list():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": []}
        })


def test_text_search_rejects_include_national_services_rejects_float():
    with pytest.raises(ValidationError):
        TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": 0.0}
        })


def test_text_search_input_accepts_include_national_services_false():
    TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": False}
        })


def test_text_search_input_accepts_include_national_services_true():
    TextSearchInput().load({
            "search_text": "testi",
            "service_filters": {"include_national_services": True}
        })


def test_post_attributes_management_input_accepts_channel_id_and_attributes():
    PostSessionAttributesInput().load({
        "service_channel_id": "582fc45e-0a2b-412d-ac42-626c7c928569",
        "session_attributes": {"age": 20}
    })


def test_post_attributes_management_input_accepts_service_id_without_recommendation_id():
    PostSessionAttributesInput().load({
        "service_channel_id": "582fc45e-0a2b-412d-ac42-626c7c928569",
        "service_id": "3d95016a-7109-4815-a097-3427323dd141",
        "session_attributes": {"age": 20}
    })


def test_post_attributes_management_input_accepts_recommendation_id_and_service_id():
    PostSessionAttributesInput().load({
        "service_channel_id": "582fc45e-0a2b-412d-ac42-626c7c928569",
        "service_id": "3d95016a-7109-4815-a097-3427323dd141",
        "auroraai_recommendation_id": 1234,
        "session_attributes": {"age": 20}
    })


def test_post_attributes_management_input_rejects_recommendation_id_without_service_id():
    with pytest.raises(ValidationError):
        PostSessionAttributesInput().load({
            "service_channel_id": "582fc45e-0a2b-412d-ac42-626c7c928569",
            "auroraai_recommendation_id": 1234,
            "session_attributes": {"age": 20}
        })


def test_post_attributes_management_input_rejects_non_uuid_service_channel_id():
    with pytest.raises(ValidationError):
        PostSessionAttributesInput().load({
            "service_channel_id": "foobar",
            "session_attributes": {"age": 20}
        })


def test_post_attributes_management_input_rejects_non_uuid_service_id():
    with pytest.raises(ValidationError):
        PostSessionAttributesInput().load({
            "service_channel_id": "582fc45e-0a2b-412d-ac42-626c7c928569",
            "service_id": "foobar",
            "session_attributes": {"age": 20}
        })


def test_post_attributes_management_input_rejects_non_integer_recommendation_id():
    with pytest.raises(ValidationError):
        PostSessionAttributesInput().load({
            "service_channel_id": "582fc45e-0a2b-412d-ac42-626c7c928569",
            "service_id": "3d95016a-7109-4815-a097-3427323dd141",
            "auroraai_recommendation_id": "1234",
            "session_attributes": {"age": 20}
        })


def test_post_attributes_management_input_rejects_negative_recommendation_id():
    with pytest.raises(ValidationError):
        PostSessionAttributesInput().load({
            "service_channel_id": "582fc45e-0a2b-412d-ac42-626c7c928569",
            "service_id": "3d95016a-7109-4815-a097-3427323dd141",
            "auroraai_recommendation_id": -1234,
            "session_attributes": {"age": 20}
        })


def test_post_attributes_management_input_rejects_empty_dict():
    with pytest.raises(ValidationError):
        PostSessionAttributesInput().load({})
