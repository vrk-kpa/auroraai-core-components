import unittest
from recommender_api.tools import config


class TestConfigReader(unittest.TestCase):
    def test_get_param(self):
        cfg, global_defaults, env = config._current_env_config_with_defaults(
            'recommender_api/tools/tests/test_data', 'dev'
        )
        self.assertEqual(cfg['param1'], 'param1_dev_value')
        self.assertEqual(cfg['param2'], 'param2_default')
        self.assertEqual(global_defaults['param2'], cfg['param2'])

    def test_override_different_env(self):
        cfg, global_defaults, env = config._current_env_config_with_defaults(
            'recommender_api/tools/tests/test_data', 'prod'
        )
        self.assertEqual(cfg['param1'], 'param1_prod_value')
        self.assertEqual(cfg['param2'], 'param2_default')

    def test_safe_getter(self):
        self.assertEqual(config.get('doesnotexist', 'stillgetsadefaultvalue'), 'stillgetsadefaultvalue')
        self.assertIsNone(config.get('doesnotexist2'))
