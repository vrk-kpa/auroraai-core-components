# pylint: skip-file
# From https://github.com/tiangolo/meinheld-gunicorn-docker/blob/master/docker-images/gunicorn_conf.py
import gunicorn.workers.base
import tools

from gunicorn import glogging
from tools.logger import AuroraAiJsonFormatter

from recommender_api.tools.logger import log


class AaiGunicornLogger(glogging.Logger):
    def setup(self, cfg):
        super().setup(cfg)
        self._set_handler(self.error_log, cfg.errorlog, AuroraAiJsonFormatter())


# Gunicorn config variables
worker_class = tools.config.config['service_recommender_api_worker_class']
workers = tools.config.config['service_recommender_api_workers']
worker_connections = tools.config.config['service_recommender_api_worker_connections']

loglevel = 'warning'
bind = f"{tools.config.config['service_recommender_api_host']}:{tools.config.config['service_recommender_api_port']}"
keepalive = 95  # This must be bigger than the ALB idle_timeout
errorlog = "-"
timeout = tools.config.config['service_recommender_api_timeout']
worker_tmp_dir = tools.config.config['service_recommender_api_worker_tmp_dir']
logger_class = AaiGunicornLogger

# Preload the app before forking workers.
# This way the big Fast-text model is loaded only once to memory and workers share a single instance of the model.
preload_app = True


def post_worker_init(worker: gunicorn.workers.base.Worker):
    log.debug("forked worker")
    log.debug(f'{worker.wsgi.fasttext_model}')
