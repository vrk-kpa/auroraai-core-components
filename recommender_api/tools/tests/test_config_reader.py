import os
from unittest import mock

from recommender_api.tools.config import _current_env_config_with_defaults

mock_envs = {"AAI_RECOMMENDER_CONFIG_FILE": 'recommender_api/tools/tests/test_data/config.yml'}


@mock.patch.dict(os.environ, mock_envs)
def test_get_param():
    cfg, global_defaults, __ = _current_env_config_with_defaults('dev')
    assert cfg['param1'] == 'param1_dev_value'
    assert cfg['param2'] == 'param2_default'
    assert global_defaults['param2'] == cfg['param2']


@mock.patch.dict(os.environ, mock_envs)
def test_override_different_env():
    cfg, _, __ = _current_env_config_with_defaults('prod')
    assert cfg['param1'] == 'param1_prod_value'
    assert cfg['param2'] == 'param2_default'


@mock.patch.dict(os.environ, mock_envs)
def test_safe_getter():
    cfg, _, __ = _current_env_config_with_defaults('prod')
    assert cfg.get('doesnotexist', 'stillgetsadefaultvalue') == 'stillgetsadefaultvalue'
    assert cfg.get('doesnotexist2') is None
