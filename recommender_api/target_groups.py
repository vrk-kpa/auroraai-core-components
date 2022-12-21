import json
from pathlib import Path
from recommender_api.tools.config import config


def load_target_groups():
    path = Path(__file__).parent.parent / config['target_group_file']
    with path.open() as file:
        return json.load(file)


valid_target_groups = load_target_groups()
