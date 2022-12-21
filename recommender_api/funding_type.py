import json
from recommender_api.tools.config import config
from pathlib import Path


def load_funding_types():
    path = Path(__file__).parent.parent / config['funding_type_file']
    with path.open() as file:
        return json.load(file)


valid_funding_types = load_funding_types()
