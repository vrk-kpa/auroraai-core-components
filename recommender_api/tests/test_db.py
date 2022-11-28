import pytest
from unittest.mock import patch
import botocore

from recommender_api.db import get_services_ptv_data, get_service_channels_ptv_data, get_service_vectors, \
    get_filtered_service_ids
from tools.config import config
from tools.logger import log

DB_HOST_ROUTING, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REGION = config['db_host_routing'], config['db_port'], \
    config['db_api_user'], config['db_password'], \
    config['db_name'], config['region']

# pylint: disable=W0212
# Store reference to original api call so that mock function can call it
original_make_api_call = botocore.client.BaseClient._make_api_call


def mock_auth_token(_, __, ___, ____):
    log.debug(f'Mocking auth token')
    return DB_PASSWORD


def mock_rds_describe_db_instances(self, operation_name, kwarg):
    # Mock only describeDBInstances
    log.debug(f'operation_name: {operation_name}')
    if operation_name == 'DescribeDBInstances':
        log.debug(f'Mocking describe db instances')
        response = {'DBInstances': [{'DBName': DB_NAME,
                                     'Endpoint':
                                         {'Address': DB_HOST_ROUTING}}]}
        return response

    return original_make_api_call(self, operation_name, kwarg)


@pytest.fixture(name="mock_db_connection", autouse=True)
def fixture_mock_get_apikeys():
    with patch('botocore.client.BaseClient._make_api_call', new=mock_rds_describe_db_instances):
        with patch('tools.db.auth_token', new=mock_auth_token):
            yield


def test_get_service_ptv_data_with_invalid_ids():
    assert get_services_ptv_data(['1234', '4567']) == []


def test_get_service_ptv_data_with_empty_list():
    assert get_services_ptv_data([]) == []


def test_get_service_ptv_data_with_none():
    assert get_services_ptv_data(None) == []


def test_get_service_ptv_data_with_valid_ids():
    assert get_services_ptv_data([
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        'e7df7411-64ef-48ef-ad5f-eebacde480e2'
    ]) == [
        {
            'id': 'd64476db-f2df-4699-bb6a-1bfae007577a',
            'serviceChannels': [
                {'serviceChannel': {'id': '8e41462f-87e8-41d5-a14a-727b680f781c'}},
                {'serviceChannel': {'id': 'f283c2dc-8223-408a-8a73-1d62489e1f58'}},
                {'serviceChannel': {'id': 'fadd4cc4-4a00-4002-afb1-bbcfacdde5c1'}},
                {'serviceChannel': {'id': 'd589d34d-7dc1-4e25-af7b-dfd2ee9bf062'}}
            ],
            'serviceNames': [
                {
                    'language': 'fi',
                    'type': 'Name',
                    'value': 'Taideopetus kulttuurikeskuksissa'
                }
            ],
            "targetGroups": [{'code': 'KR1'}],
            "serviceCollections": [{"id": "744c4b61-fde5-4d23-a844-cee5728b9119", "name": [{"value": "Kaavoitus ja maankäyttö", "language": "fi"}]}]
        },
        {
            'id': 'e7df7411-64ef-48ef-ad5f-eebacde480e2',
            'serviceChannels': [],
            'serviceNames': [{
                'language': 'fi',
                'type': 'Name',
                'value': 'Harrastustoiminta'
            }]
        }
    ]


def test_get_service_channel_ptv_data_with_invalid_ids():
    assert get_service_channels_ptv_data(['1234', '4567']) == []


def test_get_service_channel_ptv_data_with_empty_list():
    assert get_service_channels_ptv_data([]) == []


def test_get_service_channel_ptv_data_with_none():
    assert get_service_channels_ptv_data(None) == []


def test_get_service_channel_ptv_data_with_valid_ids():
    assert get_service_channels_ptv_data({
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        'f283c2dc-8223-408a-8a73-1d62489e1f58'
    }) == [
        {
            'id': '8e41462f-87e8-41d5-a14a-727b680f781c',
            'serviceChannelDescriptions': [
                {'language': 'fi', 'type': 'Summary',
                 'value': 'channel 1 description summary'},
                {'language': 'fi', 'type': 'Description',
                 'value': 'channel 1 description'}
            ],
            'serviceChannelNames': [{'language': 'fi', 'type': 'Name', 'value': 'channel_name1'}],
            'webPages': []
        },
        {
            'id': 'f283c2dc-8223-408a-8a73-1d62489e1f58',
            'serviceChannelDescriptions': [
                {'language': 'fi', 'type': 'Summary',
                 'value': 'channel 2 description summary'},
                {'language': 'fi', 'type': 'Description',
                 'value': 'channel 2 description'}
            ],
            'serviceChannelNames': [{'language': 'fi', 'type': 'Name', 'value': 'channel_name2'}],
            'serviceChannelType': 'EChannel',
            'webPages': [{'language': 'fi', 'url': 'url2', 'value': None}]
        }
    ]


def test_get_service_vectors_single_service_class():
    result = get_service_vectors(
        ['091'],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.3'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert list(result.index) == ['b9e2ff7d-3d18-476d-94e0-4a818f1136d6']


def test_get_service_vectors_multiple_service_classes():
    result = get_service_vectors(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.3',
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P4.1'
        ],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert list(result.index) == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6'
    ]


def test_get_service_vectors_multiple_service_classes_in_one_service():
    result = get_service_vectors(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.1'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert '909e5065-ad9d-40f5-a54d-58c88b2f6bfc' in list(result.index)

    result = get_service_vectors(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert '909e5065-ad9d-40f5-a54d-58c88b2f6bfc' in list(result.index)

    result = get_service_vectors(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.1',
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2'
        ],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert '909e5065-ad9d-40f5-a54d-58c88b2f6bfc' in list(result.index)


def test_get_service_vectors_no_services_in_service_class():
    result = get_service_vectors(
        ['091'],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P1.1'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert list(result.index) == []


def test_get_service_vectors_for_single_municipality_empty_service_class_list():
    result = get_service_vectors(['091'], False, [], [], [], [])

    # This is treated same as None
    assert list(result.index) == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        'e7df7411-64ef-48ef-ad5f-eebacde480e2'
    ]


def test_get_service_vectors_national_service_in_class():
    result = get_service_vectors(
        [],
        include_national=True,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert list(result.index) == [
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
        '811c88b7-74db-414c-bbce-9735c9feb14a',
    ]


def test_get_service_vectors_by_top_level_service_class():
    result = get_service_vectors(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert list(result.index) == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
    ]


def test_get_service_vectors_no_services_in_top_level_service_class():
    result = get_service_vectors(
        ['091'],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P4'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert list(result.index) == []


def test_get_service_vectors_malformed_service_class_uri():
    result = get_service_vectors(['091'], False, ['foobar'], [], [], [])
    assert list(result.index) == []


def test_get_service_vectors_only_non_national():
    result = get_service_vectors(
        [],
        include_national=False,
        service_classes=[],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert list(result.index) == [
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
        'e7df7411-64ef-48ef-ad5f-eebacde480e2',
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        'd64476db-f2df-4699-bb6a-1bfae007577a'
    ]


def test_get_service_vectors_multiple_municipalities():
    result = get_service_vectors(['091', '638'], False, [], [], [], [])
    assert list(result.index) == [
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        'e7df7411-64ef-48ef-ad5f-eebacde480e2'
    ]


def test_get_service_vectors_municipal_and_national():
    result = get_service_vectors(
        ['638'],
        include_national=True,
        service_classes=[],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert list(result.index) == [
        '07058248-f002-4897-b1d5-7df9aa734c55',
        '6c415cf0-827d-47d0-86e4-866100bc86a8',
        '811c88b7-74db-414c-bbce-9735c9feb14a',
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
    ]


def test_get_service_vectors_with_target_group():
    result = get_service_vectors(
        ["091"],
        include_national=False,
        service_classes=[],
        target_groups=["KR1"],
        service_collections=[],
        funding_type=[]
    )
    assert list(result.index) == ['d64476db-f2df-4699-bb6a-1bfae007577a']


def test_get_service_vectors_unexistent_target_group():
    result = get_service_vectors(
        ['638'],
        include_national=True,
        service_classes=[],
        target_groups=["ABCD"],
        service_collections=[],
        funding_type=[]
    )
    assert list(result.index) == []


def test_get_service_vectors_with_service_collection():
    result = get_service_vectors(
        ["091"],
        include_national=False,
        service_classes=[],
        target_groups=[],
        service_collections=["744c4b61-fde5-4d23-a844-cee5728b9119"],
        funding_type=[]
    )
    assert list(result.index) == ['d64476db-f2df-4699-bb6a-1bfae007577a']


def test_get_service_vectors_unexistent_service_collection():
    result = get_service_vectors(
        ['638'],
        include_national=True,
        service_classes=[],
        target_groups=[],
        service_collections=["ABCD"],
        funding_type=[]
    )
    assert list(result.index) == []


def test_get_filtered_service_ids_single_service_class():
    result = get_filtered_service_ids(
        ['091'],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.3'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert result == ['b9e2ff7d-3d18-476d-94e0-4a818f1136d6']


def test_get_filtered_service_ids_multiple_service_classes():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.3',
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.1'
        ],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert result == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
    ]


def test_get_filtered_service_ids_with_target_group():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[],
        target_groups=["KR1"],
        service_collections=[],
        funding_type=[]
    )

    assert result == [
        'd64476db-f2df-4699-bb6a-1bfae007577a'
    ]


def test_get_filtered_service_ids_with_invalid_target_group():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[],
        target_groups=["ABCD"],
        service_collections=[],
        funding_type=[]
    )

    assert result == []


def test_get_filtered_service_ids_with_service_collection():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[],
        target_groups=[],
        service_collections=["744c4b61-fde5-4d23-a844-cee5728b9119"],
        funding_type=[]
    )

    assert result == [
        'd64476db-f2df-4699-bb6a-1bfae007577a'
    ]


def test_get_filtered_service_ids_with_invalid_service_collection():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[],
        target_groups=[],
        service_collections=["ABCD"],
        funding_type=[]
    )

    assert result == []


def test_get_filtered_service_ids_multiple_service_classes_in_one_service():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.1'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert '909e5065-ad9d-40f5-a54d-58c88b2f6bfc' in result

    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert '909e5065-ad9d-40f5-a54d-58c88b2f6bfc' in result

    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.1',
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2'
        ],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert '909e5065-ad9d-40f5-a54d-58c88b2f6bfc' in result


def test_get_filtered_service_ids_no_services_in_service_class():
    result = get_filtered_service_ids(
        ['091'],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P1.1'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert result == []


def test_get_filtered_service_ids_for_single_municipality_empty_service_class_list():
    result = get_filtered_service_ids(['091'], False, [], [], [], [])

    # This is treated same as None
    assert result == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        'e7df7411-64ef-48ef-ad5f-eebacde480e2'
    ]


def test_get_filtered_service_ids_national_service_in_class():
    result = get_filtered_service_ids(
        [],
        include_national=True,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert result == [
        '811c88b7-74db-414c-bbce-9735c9feb14a',
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
    ]


def test_get_filtered_service_ids_by_top_level_service_class():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert result == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
    ]


def test_get_filtered_service_ids_no_services_in_top_level_service_class():
    result = get_filtered_service_ids(
        ['091'],
        include_national=False,
        service_classes=[
            'http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P4'],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )

    assert result == []


def test_get_filtered_service_ids_malformed_service_class_uri():
    result = get_filtered_service_ids(['091'], False, ['foobar'], [], [], [])
    assert result == []


def test_get_filtered_service_ids_include_national():
    result = get_filtered_service_ids(
        [],
        include_national=True,
        service_classes=[],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert result == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        '07058248-f002-4897-b1d5-7df9aa734c55',
        '811c88b7-74db-414c-bbce-9735c9feb14a',
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        '6c415cf0-827d-47d0-86e4-866100bc86a8',
        'e7df7411-64ef-48ef-ad5f-eebacde480e2',
    ]


def test_get_filtered_service_ids_multiple_municipalities():
    result = get_filtered_service_ids(['091', '638'], False, [], [], [], [])
    assert result == [
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        'e7df7411-64ef-48ef-ad5f-eebacde480e2'
    ]


def test_get_filtered_service_ids_municipal_and_national():
    result = get_filtered_service_ids(
        ['638'],
        include_national=True,
        service_classes=[],
        target_groups=[],
        service_collections=[],
        funding_type=[]
    )
    assert result == [
        '07058248-f002-4897-b1d5-7df9aa734c55',
        '6c415cf0-827d-47d0-86e4-866100bc86a8',
        '811c88b7-74db-414c-bbce-9735c9feb14a',
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc'
    ]


def test_get_filtered_service_ids_with__public_funding_type():
    result = get_filtered_service_ids(
        [],
        include_national=True,
        service_classes=[],
        target_groups=[],
        service_collections=[],
        funding_type=['PubliclyFunded']
    )

    assert result == [
        '811c88b7-74db-414c-bbce-9735c9feb14a'
    ]

def test_get_filtered_service_ids_with__market_funding_type():
    result = get_filtered_service_ids(
        [],
        include_national=False,
        service_classes=[],
        target_groups=[],
        service_collections=[],
        funding_type=['MarketFunded']
    )

    assert result == [
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6'
    ]