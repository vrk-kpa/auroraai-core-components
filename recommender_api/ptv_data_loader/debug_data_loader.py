import json
import lzma
import os

from unittest.mock import patch

import boto3
from recommender_api.tools.config import config
from recommender_api.tools.logger import log

from . import data_loader


def mock_auth_token(_, __, ___, ____):
    log.debug(f'Mocking auth token')
    return config['db_password']


def mock_import_services():
    service_bucket = data_loader.SERVICES_BUCKET
    services_key = data_loader.SERVICES_KEY

    log.debug(f'Loading ptv service data from s3: {service_bucket}, key: {services_key}')

    s3_client = boto3.client('s3')
    response = s3_client.get_object(Bucket=service_bucket, Key=services_key)

    data = response['Body'].read()
    services = json.loads(lzma.decompress(data).decode())

    log.debug(f'Loaded {len(services)} services')

    return services


def mock_import_channels():
    service_channel_bucket = data_loader.SERVICES_BUCKET
    service_channel_key = data_loader.SERVICE_CHANNELS_KEY

    log.debug(f'Loading ptv service channel data from s3: {service_channel_bucket}, key: {service_channel_key}')

    s3_client = boto3.client('s3')
    response = s3_client.get_object(Bucket=service_channel_bucket, Key=service_channel_key)

    data = response['Body'].read()
    service_channels = json.loads(lzma.decompress(data).decode())
    service_channels = [service_channels[key] for key in service_channels.keys()]

    log.debug(f'Loaded {len(service_channels)} service channels')

    return service_channels


def run():
    print(os.getenv('ENVIRONMENT', 'dev'))
    print(config)
    with patch('recommender_api.tools.db.auth_token', new=mock_auth_token):
        with patch('recommender_api.ptv_data_loader.data_loader.fetch_ptv_services', return_value=mock_import_services()):
            with patch('recommender_api.ptv_data_loader.data_loader.fetch_ptv_service_channels', return_value=mock_import_channels()):
                with patch('recommender_api.ptv_data_loader.data_loader.export_data_to_s3', return_value={}):
                    with patch('recommender_api.ptv_data_loader.data_loader.remove_archived_service_data', return_value={}):
                            data_loader.main()


if __name__ == "__main__":
    run()
