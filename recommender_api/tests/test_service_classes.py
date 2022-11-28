import re

from recommender_api.service_classes import valid_service_classes


def test_get_service_ptv_data_with_invalid_ids():
    assert len(valid_service_classes) == 228
    for uri in valid_service_classes:
        assert re.match(r"^http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P[0-9]{1,2}(?:\.[0-9]{1,2})?$", uri)
