import csv
import json
from itertools import islice
from typing import List, Set, Dict

from tools.config import config


MOCK_SERVICE_MUNICIPALITY = '000'  # Non-existing municipality

CSV_ROWS_TO_SKIP = 5
CSV_COLUMNS = 4


class MunicipalityData:
    def __init__(self):
        self.valid_municipality_codes = self._parse_municipality_codes(config['municipality_file'])
        self.valid_municipality_codes.add(MOCK_SERVICE_MUNICIPALITY)

        self._region_mappings = self._parse_municipality_mappings(config['municipality_region_mapping_file'])
        self._hospital_district_mappings = self._parse_municipality_mappings(
            config['municipality_hospital_district_mapping_file'])

    @property
    def valid_region_codes(self) -> Set[str]:
        return set(self._region_mappings.keys())

    @property
    def valid_hospital_district_codes(self) -> Set[str]:
        return set(self._hospital_district_mappings.keys())

    def regions_to_municipalities(self, region_codes: List[str]) -> List[str]:
        return [municipality for region in region_codes for municipality in self._region_mappings[region]]

    def hospital_districts_to_municipalities(self, district_codes: List[str]) -> List[str]:
        return [
            municipality for district in district_codes for municipality in self._hospital_district_mappings[district]
        ]

    @staticmethod
    def _parse_municipality_mappings(filename: str) -> Dict[str, List[str]]:
        with open(filename, encoding='cp1252') as file:
            csvreader = csv.reader(file, delimiter=';')
            mappings: Dict[str, List[str]] = {}

            for row in islice(csvreader, CSV_ROWS_TO_SKIP, None):
                if len(row) != CSV_COLUMNS:
                    continue
                municipality = row[0].replace("'", '')
                region = row[2].replace("'", '')
                mappings[region] = mappings.get(region, []) + [municipality]
            return mappings

    @staticmethod
    def _parse_municipality_codes(filename) -> Set[str]:
        with open(filename) as file:
            municipality_codes = json.load(file)
        return set(municipality_codes.keys())


municipality_data = MunicipalityData()
