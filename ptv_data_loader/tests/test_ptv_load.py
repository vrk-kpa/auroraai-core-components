import unittest
import os
from mock import patch

import boto3
import botocore
from moto import mock_s3

from ptv_data_loader.data_loader import load_services_from_s3
from ptv_data_loader.db import load_services_to_db, importable_data
from tools.config import config
from tools.logger import log

TEST_DB_PASSWORD, TEST_HOST = config['db_password'], config['db_host_routing']

BASEDIR = os.path.dirname(os.path.realpath(__file__))
SERVICES_MOCK_PATH = f"{BASEDIR}/test_data/services.json.xz"
SERVICE_VECTOR_MOCK_PATH = f"{BASEDIR}/test_data/services_national_mikkeli_turku_oulu.xlsx"
SERVICE_VECTOR_KEY = f'services_national_mikkeli_turku_oulu.xlsx'

REGION = 'eu-west-1'
BUCKET = f'service-recommender-ci'
KEY = f'services.json.xz'
DB_NAME = 'service_recommender'

EXPECTED_SERVICES = [{'service_id': '6c00d407-d3fd-4c7e-a373-57be9f3b2cff',
                      'service_type': 'Service',
                      'areas_type': 'Municipality',
                      'area_type': 'LimitedType',
                      'service_name': 'Yksilöllistetty oppimäärä',
                      'description_summary': 'Oppimäärää voidaan yksilöllistää, jos opiskelijalla ei ole '
                                             'edellytyksiä suoriutua perusopetuksen jonkin oppiaineen oppimäärästä '
                                             'hyväksytysti.',
                      'description': 'Liperin koulut noudattavat erityisopetuksen suhteen opetussuunnitelmaa. '
                                     'Erityisoppilaat integroidaan mahdollisuuksien mukaan yleisopetuksen ryhmiin. '
                                     'Oppimäärää voidaan yksilöllistää, jos opiskelijalla ei ole edellytyksiä '
                                     'suoriutua perusopetuksen jonkin oppiaineen oppimäärästä hyväksytysti.',
                      'user_instruction': 'Oppimäärän yksilöllistämisestä sovitaan yksilöllisesti omassa koulussa. '
                                          'Koulun rehtori hakee yksilöllistämisen hallintopäätöstä '
                                          'hyvinvointipalveluiden esimieheltä.\n',
                      'service_charge_type': None,
                      'charge_type_additional_info': '',
                      'target_groups': 'Lapset ja lapsiperheet Kansalaiset',
                      'service_class_name': 'Perusopetus',
                      'service_class_description': 'Tähän palvelualaluokkaan kuuluvat sekä varsinainen perusopetus '
                                                   'sisältöineen ja tavoitteineen sekä perusopetuksen yhteydessä '
                                                   'ja sen tukemiseksi välittömästi tarjottavat palvelut, '
                                                   'esimerkiksi koulukuljetukset, kouluruokailu ja '
                                                   'avustajapalvelut. Tähän luokkaan kuuluvat myös Suomen '
                                                   'perusopetuksen mukaisen peruskoulutuksen ulkomailla '
                                                   'suorittamiseen liittyvät asiat.',
                      'ontology_terms': 'peruskoulu perusopetus',
                      'life_events': '',
                      'industrial_classes': '',
                      'service_channels': 'Liperin koulu Viinijärven koulu Salokylän koulu Mattisenlahden koulu '
                                          'Ylämyllyn koulu',
                      'municipality_codes': '426 123',
                      'municipality_names': 'Liperi Tohmajärvi'
                      }]

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


@mock_s3
class TestPTVDataLoad(unittest.TestCase):
    def setUp(self):
        client = boto3.client('s3', region_name=REGION,
                              aws_access_key_id="fake_access_key", aws_secret_access_key="fake_secret_key")

        # Validate that the bucket doesn't exist yet
        try:
            s3_resouce = boto3.resource('s3', region_name=REGION,
                                        aws_access_key_id='fake_access_key', aws_secret_access_key='fake_secret_key')
            s3_resouce.meta.client.head_bucket(Bucket=BUCKET)
        except botocore.exceptions.ClientError:
            pass
        else:
            err = "{bucket} should not exist.".format(bucket=BUCKET)
            raise EnvironmentError(err)

        # Create mock bucket and put test data inside
        client.create_bucket(Bucket=BUCKET, CreateBucketConfiguration={'LocationConstraint': REGION})
        client.upload_file(Filename=SERVICES_MOCK_PATH, Bucket=BUCKET, Key=KEY)
        client.upload_file(Filename=SERVICE_VECTOR_MOCK_PATH, Bucket=BUCKET, Key=SERVICE_VECTOR_KEY)

    def tearDown(self):
        # Remove the s3 mock bucket every time
        s3_resource = boto3.resource('s3', region_name=REGION,
                                     aws_access_key_id='fake_access_key', aws_secret_access_key='fake_secret_key')
        bucket = s3_resource.Bucket(BUCKET)
        for key in bucket.objects.all():
            key.delete()
        bucket.delete()

    def test_load_ptv(self):
        log.debug(f'Testing loading PTV data from mock S3')
        services = load_services_from_s3(f's3://{BUCKET}/{KEY}')
        # drop raw data as its hard to compare
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

   # def test_load_service_vector_excel(self):
   #     log.debug(f'Testing loading  and cleaning excel data from mock S3')
   #     services = load_service_vector_excel(BUCKET, SERVICE_VECTOR_KEY)
   #
   #     # Remove last 2 services from "PTV data" to test cleanup:
   #     ptv_service_ids = set(services.drop(services.tail(2).index).iloc[:, 0])
   #     services = clean_service_vector_excel(services, ptv_service_ids)
   #  
   #     assert set(services.iloc[:, 0]) - ptv_service_ids == set()
   #
   #     print(services.head())
   #
   #     log.debug(f'Test loading service vectors to postgre DB')
   #     with patch('botocore.client.BaseClient._make_api_call', new=mock_rds_describe_db_instances):
   #         with patch('tools.db.auth_token', new=mock_auth_token):
   #             load_service_vectors_to_db(services)
