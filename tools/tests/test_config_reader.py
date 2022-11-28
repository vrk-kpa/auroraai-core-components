import unittest
from tools import config


class TestConfigReader(unittest.TestCase):
    def test_get_param(self):
        cfg, global_defaults, env = config._current_env_config_with_defaults('tests/test_data/dummy_config.yml', 'dev')
        self.assertEqual(cfg['param1'], 'param1_dev_value')
        self.assertEqual(cfg['param2'], 'param2_default')
        self.assertEqual(global_defaults['param2'], cfg['param2'])

    def test_override_different_env(self):
        cfg, global_defaults, env = config._current_env_config_with_defaults('tests/test_data/dummy_config.yml', 'prod')
        self.assertEqual(cfg['param1'], 'param1_prod_value')
        self.assertEqual(cfg['param2'], 'param2_default')

    def test_safe_getter(self):
        self.assertEqual(config.get('doesnotexist', 'stillgetsadefaultvalue'), 'stillgetsadefaultvalue')
        self.assertIsNone(config.get('doesnotexist2'))
