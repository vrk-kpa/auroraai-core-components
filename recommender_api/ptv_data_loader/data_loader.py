import os
import sys
import io
import json
from typing import Dict, Any, Set, List, Optional
import lzma
import math
import pandas as pd
import requests
import more_itertools
import boto3

from recommender_api.ptv_data_loader.constants import PTVPublishState
from recommender_api.tools.config import config
from recommender_api.tools.logger import log, LogOperationName

from recommender_api.ptv_data_loader.db import (
    load_services_to_db,
    load_service_vectors_to_db,
    load_service_channels_to_db,
    add_ptv_fetch_timestamp_to_db,
    get_latest_ptv_fetch_timestamp,
    get_service_data_from_db,
    get_service_channel_data_from_db,
    flag_archived_services_in_db
)

PTV_SERVICE_URL = config['ptv_url_prefix'] + config['ptv_service_url_suffix']
PTV_SERVICE_LIST_URL = config['ptv_url_prefix'] + config['ptv_service_list_url_suffix']
PTV_SERVICE_CHANNEL_URL = config['ptv_url_prefix'] + config['ptv_service_channel_url_suffix']
PTV_SERVICE_CHANNEL_LIST_URL = config['ptv_url_prefix'] + config['ptv_service_channel_list_url_suffix']

SERVICES_BUCKET = config['services_bucket']
SERVICES_KEY = config['services_key']
SERVICE_CHANNELS_KEY = config['service_channels_key']
SERVICE_VECTOR_KEY = config['service_vector_key']


class PTVServiceIDMismatch(Exception):
    pass


class ServiceProfileDataException(Exception):
    pass


class PTVAPIException(Exception):
    pass


class ServicesMismatch(Exception):
    pass


def export_data_to_s3(services: Dict[str, Any], service_channels: Dict[str, Any]):
    put_services_s3(services, SERVICES_BUCKET, SERVICES_KEY)
    put_service_channels_s3(
        service_channels, SERVICES_BUCKET, SERVICE_CHANNELS_KEY)


def get_paginated_ptv_ids(n_pages: int, url: str, start_date: str, status: PTVPublishState):
    ids: Set[str] = set()
    for page_number in range(1, n_pages + 1):
        response = requests.get(
            url,
            params={
                'page': page_number,
                'date': start_date,  # type: ignore
                'status': status.value
            },
            timeout=120
        ).json()

        # not None for name is to avoid a service which is given in the id list,
        # but while getting its datta from PTV a 404 message is given
        if response['itemList'] is not None:
            new_ids = {item['id'] for item in response['itemList'] if item['name'] is not None}

            try:
                assert len(new_ids & ids) == 0
            except AssertionError as ex:
                raise ServicesMismatch("Mismatch in IDs") from ex
            ids |= new_ids


    return ids


def fetch_ptv_services(
        start_date: str,
        publish_state: PTVPublishState = PTVPublishState.PUBLISHED
) -> Dict[str, Dict[str, Any]]:
    service_ids = fetch_service_ids(start_date, publish_state)
    return fetch_service_infos(service_ids)


def fetch_ptv_service_channels(
        start_date: str,
        publish_state: PTVPublishState = PTVPublishState.PUBLISHED
) -> List[dict]:
    service_channel_ids = fetch_ptv_service_channel_ids(start_date, publish_state)
    return fetch_service_channel_datas(service_channel_ids)


def fetch_ptv_service_channel_ids(start_date: str, status: PTVPublishState = PTVPublishState.PUBLISHED) -> Set[str]:
    with log.open():
        response = requests.get(PTV_SERVICE_CHANNEL_URL).json()
        n_pages = response['pageCount']
        ids = get_paginated_ptv_ids(n_pages, PTV_SERVICE_CHANNEL_URL, start_date, status)
        log.technical.message(f'Got {len(ids)} service channel ids from PTV')

    return ids


def fetch_service_ids(start_date: str, status: PTVPublishState = PTVPublishState.PUBLISHED) -> Set[str]:
    with log.open():
        response = requests.get(PTV_SERVICE_URL).json()
        n_pages = response['pageCount']
        ids = get_paginated_ptv_ids(n_pages, PTV_SERVICE_URL, start_date, status)
        log.technical.message(f'Got {len(ids)} service channel ids from PTV')

    return ids


def fetch_item_list_by_id_from_ptv(url: str, ids: Set[str]):
    max_supported_request_id_count = 99
    results = []

    for idx, chunk_ids in enumerate(more_itertools.chunked(ids, max_supported_request_id_count)):
        with log.open():
            log.technical.message(f'Loading chunk {idx} from {url}.')
            response = requests.get(url, params={'guids': ','.join(chunk_ids)}, timeout=120)

            if response.status_code != 200:
                log.technical.error(
                    f'Error reading Service channels from PTV. '
                    f'Status code: {response.status_code}, error reason: {response.reason}'
                )
                raise PTVAPIException()

            for item in response.json():
                results.append(item)

    return results


def fetch_service_channel_datas(ids: Set[str]) -> List[dict]:
    service_channel_datas = fetch_item_list_by_id_from_ptv(PTV_SERVICE_CHANNEL_LIST_URL, ids)

    with log.open():
        log.technical.message('Done loading service channels.')

    return remove_duplicates(service_channel_datas, 'id')


def fetch_service_infos(ids: Set[str]) -> Dict[str, Dict[str, Any]]:
    # This is slow
    service_infos: Dict[str, Dict[str, Any]] = {}

    service_infos_list = fetch_item_list_by_id_from_ptv(PTV_SERVICE_LIST_URL, ids)
    for service in service_infos_list:
        service_infos[service['id']] = service

    with log.open():
        log.technical.message('Done loading services.')

        service_info_ids = set(service_infos.keys())
        if service_info_ids != set(ids):
            log.technical.error(
                f'Service info was not found for all id:s. '
                f'Found {len(service_info_ids)}/{len(ids)} id:s in PTV data.'
            )
            raise PTVServiceIDMismatch

    return service_infos


def put_services_s3(services: Dict[str, Dict[str, Any]], bucket: str, key: str):
    compressed_services = lzma.compress(json.dumps(services).encode())
    s3_client = boto3.client('s3')

    key = s3_client.put_object(Bucket=bucket, Key=key, Body=compressed_services)

    with log.open():
        log.technical.message('Service data uploaded to S3.')

    return key


def put_service_channels_s3(service_channels: Dict[str, Dict[str, Any]], bucket: str, key: str):
    compressed_service_channels = lzma.compress(
        json.dumps(service_channels).encode())
    s3_client = boto3.client('s3')
    key = s3_client.put_object(Bucket=bucket, Key=key, Body=compressed_service_channels)

    with log.open():
        log.technical.message('Service channel data uploaded to S3.')

    return key


def load_service_vector_csv(bucket, file_path):
    s3_client = boto3.client('s3')
    obj = s3_client.get_object(Bucket=bucket, Key=file_path)
    vector_data = pd.read_csv(io.BytesIO(obj['Body'].read()))

    with log.open():
        log.technical.message('Service vector CSV data loaded from S3')

    return vector_data


def clean_service_vector_csv(
        service_vectors: pd.DataFrame, service_ids: Set[str]
) -> pd.DataFrame:
    service_vectors = service_vectors[service_vectors['id'].notna()]
    service_vectors = service_vectors.set_index(['id', 'municipalityCode'])
    service_vectors = service_vectors[service_vectors['EI MUKAAN'].isna()]
    service_vectors = service_vectors[
        [
            'terveys',
            'vaikeuksien voittaminen',
            'asuminen',
            'opiskelu tai työ',
            'perhe',
            'ystävät',
            'raha-asiat',
            'itsensä kehittäminen',
            'itsetunto',
            'tyytyväisyys elämään',
        ]
    ]
    service_vectors = service_vectors.fillna(0)

    # check columns and their order
    if service_vectors.columns.tolist() != [
        'terveys',
        'vaikeuksien voittaminen',
        'asuminen',
        'opiskelu tai työ',
        'perhe',
        'ystävät',
        'raha-asiat',
        'itsensä kehittäminen',
        'itsetunto',
        'tyytyväisyys elämään',
    ]:
        raise ServiceProfileDataException('Incorrect values in service vector excel')

    # reset index
    service_vectors.reset_index(inplace=True)

    # rename columns to match those in db
    service_vectors.columns = [
        'service_id',
        'municipality_code',
        'health',
        'resilience',
        'housing',
        'working_studying',
        'family',
        'friends',
        'finance',
        'improvement_of_strengths',
        'self_esteem',
        'life_satisfaction',
    ]

    with log.open():
        log.technical.message(f'Service vector CSV data cleaned.')

        # remove vectors that don't have their service id in current ptv service list
        missing_ids = set(service_vectors['service_id']) - service_ids
        if missing_ids:
            service_vectors = service_vectors[~service_vectors['service_id'].isin(missing_ids)]
            log.technical.message(f'Discarded {len(missing_ids)} service vectors as their ids are not found in PTV data.')

    return service_vectors


def remove_duplicates(items: List[dict], key: str):
    seen = set()
    result = []

    for item in items:
        value = item[key]
        if value in seen:
            continue

        result.append(item)
        seen.add(value)
    return result


def flag_archived_service_data(start_date: str):
    with log.open():
        services: List = []
        services.extend(fetch_service_ids(start_date, PTVPublishState.ARCHIVED))
        services.extend(fetch_service_ids(start_date, PTVPublishState.WITHDRAWN))
        log.technical.message(f'PTV data contains {len(services)} services marked as ARCHIVED or WITHDRAWN')

        service_channels: List = []
        service_channels.extend(fetch_ptv_service_channel_ids(start_date, PTVPublishState.ARCHIVED))
        service_channels.extend(fetch_ptv_service_channel_ids(start_date, PTVPublishState.WITHDRAWN))
        log.technical.message(
            f'PTV data contains {len(service_channels)} service channels marked as ARCHIVED or WITHDRAWN')

        flag_archived_services_in_db(services, service_channels)


def get_last_fetch_timestamp(mode: str):
    if mode == 'full-run':
        return None
    else:
        last_ptv_fetch = get_latest_ptv_fetch_timestamp()
        log.debug(f'Previous fetch from PTV: {last_ptv_fetch}')
        return last_ptv_fetch


def read_ptv_data(last_ptv_fetch: str):
    services = fetch_ptv_services(last_ptv_fetch, PTVPublishState.PUBLISHED)
    service_channels = fetch_ptv_service_channels(last_ptv_fetch, PTVPublishState.PUBLISHED)

    return services, service_channels


def store_ptv_data(services: List[Dict], service_channels: List[Dict], last_ptv_fetch: Optional[str], store_to_s3=True):
    with log.open():
        load_services_to_db(services)
        load_service_channels_to_db(service_channels)

    flag_archived_service_data(last_ptv_fetch)

    with log.open():
        published_services = get_service_data_from_db()
        published_service_channels = get_service_channel_data_from_db()

    service_vectors = clean_service_vector_csv(
        load_service_vector_csv(SERVICES_BUCKET, SERVICE_VECTOR_KEY),
        set(published_services.keys()),
    )

    with log.open():
        load_service_vectors_to_db(service_vectors)

    if store_to_s3:
        export_data_to_s3(published_services, published_service_channels)

    with log.open():
        add_ptv_fetch_timestamp_to_db()


def main():
    exit_code = 0

    try:
        log.technical.info('operationName', LogOperationName.PTV_DATA_LOADER)
        log.technical.info('branch', os.getenv('BUILD_BRANCH'))
        log.technical.info('build', os.getenv('BUILD_NUMBER'))
        log.technical.info('commitSha', os.getenv('BUILD_COMMIT_SHA'))

        mode = os.getenv('DATA_LOADER_MODE')
        last_ptv_fetch = get_last_fetch_timestamp(mode)

        services, service_channels = read_ptv_data(last_ptv_fetch)
        store_ptv_data(services, service_channels, last_ptv_fetch, store_to_s3=True)

    except Exception as error:
        with log.open():
            log.technical.error(f'Failed: {str(error)}')
        exit_code = 1

    if exit_code == 0:
        with log.open():
            log.technical.message(f'Success: ptv-data-loader done.')

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
