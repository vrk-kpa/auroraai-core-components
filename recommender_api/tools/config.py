#!python

import os
from typing import Tuple, Dict, Any

import yaml


DEFAULT_YAML_ROOT = 'default'

"""
Usage: Import the global config dictionary and read the values!

from config import config
db_name = config.get('db_name', 'my-default-db')
"""


def _current_env_config_with_defaults(env_override: str = None) -> Tuple[Dict[str, Any], Dict[str, Any], str]:
    default_config_path = os.path.join(os.getcwd(), 'recommender_api', 'config.yml')

    config_path = os.getenv('AAI_RECOMMENDER_CONFIG_FILE', default_config_path)
    _env = os.getenv('ENVIRONMENT', 'dev') if env_override is None else env_override

    with open(config_path, encoding='utf-8') as file:
        config_all_envs = yaml.load(file, Loader=yaml.FullLoader)

    _defaults = config_all_envs[DEFAULT_YAML_ROOT]  # type: Dict[str, Any]
    _config = _defaults | config_all_envs[_env]  # type: Dict[str, Any]

    return _config, _defaults, _env


config, global_defaults, env = _current_env_config_with_defaults()
