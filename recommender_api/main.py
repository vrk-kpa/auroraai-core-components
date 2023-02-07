import os
import pickle
from pathlib import Path

import boto3

from flask import Flask

from recommender_api import ft
from recommender_api.blueprints.blueprints import recommendation_blueprint
from recommender_api.db import reset_db_connection_pool

from recommender_api.tools.config import config, env
from recommender_api.tools.logger import log, LogOperationName


def create_app(fasttext_path=''):
    with log.open():
        log.technical.info('operationName', LogOperationName.SERVER_START)
        log.technical.info('environment', env)
        log.technical.info('host', config['service_host'])
        log.technical.info('port', config['service_recommender_api_port'])

        app = Flask(__name__)

        download_fasttext_from_s3()
        init_fasttext(app, fasttext_path)

        app.register_blueprint(recommendation_blueprint, url_prefix="/service-recommender/v1")
        create_utility_endpoints(app)

        # Database connection pool needs to be removed before Gunicorn forks workers
        reset_db_connection_pool()
        return app


def create_utility_endpoints(app):
    @app.route("/service-recommender/healthcheck/")
    def healthcheck():
        return "Healthcheck OK"


def load_fasttext_embeddings(path):
    with open(
            f'{path}/{config["fasttext_embeddings_file"]}', 'rb'
        ) as embeddings_file:
        return pickle.load(embeddings_file)


def init_fasttext(app, path):
    if config['load_fasttext_from_s3'] == 'true' or not path:
        path = config['fasttext_download_dir']

    log.technical.info('fasttextPath', path)

    app.fasttext_embeddings = load_fasttext_embeddings(path)
    app.fasttext_model = ft.load_model(f'{path}/{config["fasttext_model_file"]}')

    app.xgboost_model = None  # this is loaded separately by each worker after forking


def download_fasttext_from_s3():
    if config['load_fasttext_from_s3'] == 'true':
        Path(config['fasttext_download_dir']).mkdir(parents=True, exist_ok=True)

        s3_client = boto3.client('s3')
        results = s3_client.list_objects_v2(Bucket=config['services_bucket'], Prefix=config['fasttext_s3_directory'])
        file_list = [i['Key'] for i in results['Contents'] if i['Key'][-1] != '/']

        for file in file_list:
            file_name = file.split('/')[-1]
            dest_file = os.path.join(config['fasttext_download_dir'], file_name)
            log.debug(f'Copying file {file} to {dest_file}')
            s3_client.download_file(config['services_bucket'], file, dest_file)
        log.debug('Fasttext model download done.')
    else:
        log.debug('No need to download Fasttext model')


def run():
    # FOR DEVELOPMENT
    app = create_app()
    app.run(host='0.0.0.0', debug=True)


if __name__ == "__main__":
    # FOR DEVELOPMENT
    run()
