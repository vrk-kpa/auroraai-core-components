from dataclasses import dataclass
from typing import Dict, List

from recommender_api.municipality_data import municipality_data
from recommender_api.search_text_filter import filter_special_chars
from .wellbeing_service_county_codes import wellbeing_service_county_codes


@dataclass
class RecommenderParameters:
    def __init__(self, body):
        self.limit: int = body.get('limit', 5)
        self.rerank: bool = body.get('rerank', False)
        self.session_id: str = body.get('session_id', '')

        filters = body.get('service_filters', {})
        self.service_classes: List[str] = filters.get('service_classes', [])
        self.municipality_codes: List[str] = \
            filters.get('municipality_codes', []) \
            + municipality_data.regions_to_municipalities(filters.get('region_codes', [])) \
            + municipality_data.hospital_districts_to_municipalities(
                filters.get('hospital_district_codes', [])) \
            + wellbeing_service_county_codes.counties_to_municipalities(
                filters.get('wellbeing_service_county_codes', []))
                
        self.include_national_services = filters.get(
            'include_national_services', True)
        self.target_groups: List[str] = filters.get('target_groups', [])
        self.service_collections: List[str] = filters.get(
            'service_collections', [])
        self.funding_type: List[str] = filters.get('funding_type', [])

@dataclass
class RecommenderTextSearchParameters(RecommenderParameters):
    """Data class to hold the input parameters for text search."""

    def __init__(self, body):
        super().__init__(body)
        self.search_text: str = filter_special_chars(
            body.get('search_text', ''))


@dataclass
class Recommender3x10dParameters(RecommenderParameters):
    """Data class to hold the input parameters for 3x10d recommender."""

    def __init__(self, body):
        super().__init__(body)
        self.life_situation_meters: Dict[str, List[int]] = body.get(
            'life_situation_meters')
