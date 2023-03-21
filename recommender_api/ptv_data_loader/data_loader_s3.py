import json
import lzma

from unittest.mock import patch

import boto3

from recommender_api.ptv_data_loader.data_loader import store_ptv_data
from recommender_api.tools.config import config
from recommender_api.tools.logger import log

from . import data_loader


def mock_auth_token(_, __, ___, ____):
    log.debug(f'Mocking auth token')
    return config['db_password']


def load_s3_dump(bucket, key):
    log.debug(f'Loading ptv data dump from s3: {bucket}, key: {key}')

    s3_client = boto3.client('s3')
    response = s3_client.get_object(Bucket=bucket, Key=key)

    data = response['Body'].read()
    items = json.loads(lzma.decompress(data).decode())

    log.debug(f'Loaded {len(items)} items')

    return items


def load_services_s3():
    log.debug("Loading services.")
    return load_s3_dump(data_loader.SERVICES_BUCKET, data_loader.SERVICES_KEY)


def load_channels_s3():
    log.debug("Loading service channels.")
    items = load_s3_dump(data_loader.SERVICES_BUCKET, data_loader.SERVICE_CHANNELS_KEY)
    return [items[key] for key in items.keys()]


def run():
    with patch('recommender_api.tools.db.auth_token', new=mock_auth_token):
        services = load_services_s3()
        service_channels = load_channels_s3()

        store_ptv_data(services, service_channels, None, store_to_s3=False)

        log.debug('Finished')


if __name__ == "__main__":
    run()
