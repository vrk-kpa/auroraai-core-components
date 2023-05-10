import json
import unittest
import os
from mock import patch

import boto3
import botocore
from moto import mock_s3

from recommender_api.ptv_data_loader.db import load_services_to_db, importable_data
from recommender_api.ptv_data_loader.tests.test_data.expected_services import EXPECTED_SERVICES
from recommender_api.tools.config import config
from recommender_api.tools.logger import log

TEST_DB_PASSWORD, TEST_HOST = config['db_password'], config['db_host_routing']

BASEDIR = os.path.dirname(os.path.realpath(__file__))
SERVICES_MOCK_PATH = f"{BASEDIR}/test_data/services.json"

SERVICE_VECTOR_MOCK_PATH = f"{BASEDIR}/test_data/services_national_mikkeli_turku_oulu.xlsx"
SERVICE_VECTOR_KEY = f'services_national_mikkeli_turku_oulu.xlsx'

REGION = 'eu-west-1'
BUCKET = f'service-recommender-ci'
KEY = f'services.json.xz'
DB_NAME = 'service_recommender'

# pylint: disable=W0212
# Store reference to original api call so that mock function can call it
original_make_api_call = botocore.client.BaseClient._make_api_call

def mock_rds_describe_db_instances(self, operation_name, kwarg):
    # Mock only describeDBInstances
    log.debug(f'operation_name: {operation_name}')
    if operation_name == 'DescribeDBInstances':
        log.debug(f'Mocking describe db instances')
        response = {'DBInstances': [{'DBName': DB_NAME,
                                     'Endpoint':
                                         {'Address': TEST_HOST}}]}
        return response

    return original_make_api_call(self, operation_name, kwarg)


def mock_auth_token(_, __, ___, ____):
    log.debug(f'Mocking auth token')
    return TEST_DB_PASSWORD


def load_test_data():
    with open(SERVICES_MOCK_PATH, 'r', encoding="utf-8") as in_file:
        return json.loads(in_file.read())


@mock_s3
class TestPTVDataLoad(unittest.TestCase):
    def setUp(self):
        client = boto3.client(
            's3',
            region_name=REGION,
            aws_access_key_id="fake_access_key",
            aws_secret_access_key="fake_secret_key"
        )

        # Validate that the bucket doesn't exist yet
        try:
            s3_resouce = boto3.resource(
                's3',
                region_name=REGION,
                aws_access_key_id='fake_access_key',
                aws_secret_access_key='fake_secret_key'
            )
            s3_resouce.meta.client.head_bucket(Bucket=BUCKET)
        except botocore.exceptions.ClientError:
            pass
        else:
            err = f"{BUCKET} should not exist."
            raise EnvironmentError(err)

        # Create mock bucket and put test data inside
        client.create_bucket(Bucket=BUCKET, CreateBucketConfiguration={'LocationConstraint': REGION})
        client.upload_file(Filename=SERVICE_VECTOR_MOCK_PATH, Bucket=BUCKET, Key=SERVICE_VECTOR_KEY)

    def tearDown(self):
        # Remove the s3 mock bucket every time
        s3_resource = boto3.resource('s3', region_name=REGION,
                                     aws_access_key_id='fake_access_key', aws_secret_access_key='fake_secret_key')
        bucket = s3_resource.Bucket(BUCKET)
        for key in bucket.objects.all():
            key.delete()
        bucket.delete()

    def test_data_loader_config_file_is_used(self):
        self.assertIsNone(config.get('db_api_user'))
        self.assertIsNotNone(config.get('db_loader_user', None))

    def test_load_ptv(self):
        log.debug(f'Testing loading PTV data from mock S3')
        services = load_test_data()
        # drop raw data as it's hard to compare
        services = {id_: {k: v for k, v in service.items() if k != 'service_data'}
                    for id_, service in services.items()}
        log.debug('Services:')
        log.debug(f'f{services}')
        formatted_services = importable_data(services)
        formatted_services = [{k: v for k, v in service.items() if k != 'service_data'}
                              for service in formatted_services]
        for service in formatted_services:
            matching_correct = [s for s in EXPECTED_SERVICES if s['service_id'] == service['service_id']][0]
            self.assertDictEqual(matching_correct, service)

        log.debug(f'Test loading services to postgre DB')
        with patch('botocore.client.BaseClient._make_api_call', new=mock_rds_describe_db_instances):
            with patch('tools.db.auth_token', new=mock_auth_token):
                load_services_to_db(services)
