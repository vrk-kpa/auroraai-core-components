import csv
from recommender_api.tools.config import config
from itertools import islice
from pathlib import Path
from typing import List, Set, Dict

CSV_ROWS_TO_SKIP = 1
CSV_COLUMNS = 4

class WellbeingServiceCountyCodes : 
    def __init__(self):
        self.valid_counties = self._parse_wellbeing_service_county_codes_file(config['wellbeing_service_county_codes_file'])

        self.municipality_mappings = self._parse_municipality_mappings(config['municipality_to_wellbeing_service_county_codes_mapping_file'])

    @property
    def valid_county_codes(self) -> Set[str]:
        return set(self.valid_counties.keys())

    def counties_to_municipalities(self, county_codes: List[str]) -> List[str]:
        return [municipality for county in county_codes for municipality in self.municipality_mappings[county]]

    @staticmethod
    def _parse_wellbeing_service_county_codes_file(filename: str) -> Dict[str, str]:
        path = Path(__file__).parent.parent / filename
        with path.open(encoding='cp1252') as file:
            csvreader = csv.reader(file, delimiter=';')
            mappings: Dict[str, str] = {}

            for row in islice(csvreader, CSV_ROWS_TO_SKIP, None):
                if len(row) != CSV_COLUMNS:
                    continue
                code = row[0].replace("'", '')
                title = row[2].replace("'", '')
                mappings[code] = title

            return mappings

    @staticmethod
    def _parse_municipality_mappings(filename: str) -> Dict[str, List[str]]:
        path = Path(__file__).parent.parent / filename
        with path.open(encoding='cp1252') as file:
            csvreader = csv.reader(file, delimiter=';')
            mappings: Dict[str, List[str]] = {}

            for row in islice(csvreader, CSV_ROWS_TO_SKIP, None):
                if len(row) != CSV_COLUMNS:
                    continue
                code = row[0].replace("'", '')
                title = row[2].replace("'", '')
                mappings[title] = mappings.get(title, []) + [code]

            return mappings            

wellbeing_service_county_codes  = WellbeingServiceCountyCodes()
