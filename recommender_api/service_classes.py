import json
from pathlib import Path
from recommender_api.tools.config import config


def load_service_classes():
    path = Path(__file__).parent.parent / config['service_class_file']
    with path.open() as file:
        return [
            f'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/{code}'
            for code in json.load(file)
        ]


valid_service_classes = load_service_classes()
