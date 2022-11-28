import json
from tools.config import config


def load_target_groups():
    with open(config['target_group_file']) as file:
        return json.load(file)


valid_target_groups = load_target_groups()
