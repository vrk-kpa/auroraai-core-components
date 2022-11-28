import json
from tools.config import config


def load_funding_types():
    with open(config['funding_type_file']) as file:
        return json.load(file)


valid_funding_types = load_funding_types()
