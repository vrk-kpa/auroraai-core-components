import json
from tools.config import config


def load_service_classes():
    with open(config['service_class_file']) as file:
        return [
            f'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/{code}'
            for code in json.load(file)
        ]


valid_service_classes = load_service_classes()
