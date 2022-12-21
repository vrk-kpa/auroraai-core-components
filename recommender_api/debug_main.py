from os.path import dirname, join, realpath

from recommender_api.tools.config import config
from recommender_api.tools.logger import log
from recommender_api import main


DB_HOST_ROUTING, DB_PORT, DB_USER, DB_NAME, REGION = config['db_host_routing'], config['db_port'], \
    config['db_api_user'], \
    config['db_name'], config['region']
MOCK_APIKEY = 'abcd'
LOCAL_FASTTEXT_PATH = join(dirname(realpath(__file__)), 'fasttext')


def run(gunicorn=False):
    port = config['service_recommender_api_port']
    app = main.create_app(LOCAL_FASTTEXT_PATH)
    if gunicorn:
        log.debug("hand over to gunicorn")
        return app
    app.run(host='0.0.0.0', port=port, debug=True)
    return None


if __name__ == "__main__":
    run()
