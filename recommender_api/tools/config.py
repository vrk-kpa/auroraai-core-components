#!python

import os
from typing import Tuple, Dict, Any

import yaml


DEFAULT_YAML_ROOT = 'default'
CONFIG_FILE_NAME = 'config.yml'

"""
Usage in code, e.g.

from config import config

db_name = config['db_name']


OR e.g.

import config # notice difference in import

db_name = config.get('db_name', 'last_fallback_db_name')
db_name = config.config['db_name']

"""


def _current_env_config_with_defaults(config_path: str = None, env: str = None) \
        -> Tuple[Dict[str, Any], Dict[str, Any], str]:

    if not config_path:
        config_path = os.path.join(os.getcwd(), 'recommender_api')

    with open(os.path.join(config_path, CONFIG_FILE_NAME)) as f:
        config_all_envs = yaml.load(f, Loader=yaml.FullLoader)

    global_defaults = config_all_envs[DEFAULT_YAML_ROOT]  # type: Dict[str, Any]

    used_env = os.getenv('ENVIRONMENT', 'dev') if env is None else env

    config = global_defaults.copy()  # type: Dict[str, Any]

    if used_env in config_all_envs and config_all_envs[used_env] is not None:
        for key, value in config_all_envs[used_env].items():
            config[key] = value

    return config, global_defaults, used_env


def get(key, default=None)-> Any:
    ret_value = config.get('key', default)
    if ret_value is None:
        return default
    return ret_value


config, global_defaults, env = _current_env_config_with_defaults()
