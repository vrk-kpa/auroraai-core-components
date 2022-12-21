import os
import urllib.parse
import io
import json
from typing import Dict, Any, Set, List
import lzma
import math
from enum import Enum
import pandas as pd
import requests
import more_itertools
import boto3


from recommender_api.tools.config import config
from recommender_api.tools.logger import log, LogOperationName

from .db import (
    delete_service_channel_data_from_db,
    delete_service_data_from_db,
    load_services_to_db,
    load_service_vectors_to_db,
    load_service_channels_to_db,
    add_ptv_fetch_timestamp_to_db,
    get_latest_ptv_fetch_timestamp,
    get_service_data_from_db,
    get_service_channel_data_from_db,
)

PTV_SERVICE_URL = config['ptv_url_prefix'] + config['ptv_service_url_suffix']
PTV_SERVICE_LIST_URL = config['ptv_url_prefix'] + \
    config['ptv_service_list_url_suffix']
PTV_SERVICE_CHANNEL_URL = (
    config['ptv_url_prefix'] + config['ptv_service_channel_url_suffix']
)
PTV_SERVICE_CHANNEL_LIST_URL = (
    config['ptv_url_prefix'] + config['ptv_service_channel_list_url_suffix']
)

SERVICES_BUCKET = config['services_bucket']
SERVICES_KEY = config['services_key']
SERVICE_CHANNELS_KEY = config['service_channels_key']
SERVICE_VECTOR_KEY = config['service_vector_key']


class PTVPublishState(Enum):
    PUBLISHED = 'Published'
    ARCHIVED = 'Archived'
    WITHDRAWN = 'Withdrawn'


class PTVServiceIDMismatch(Exception):
    pass


class ServiceProfileDataException(Exception):
    pass


class PTVAPIException(Exception):
    pass


class ServicesMismatch(Exception):
    pass


def load_s3_file(path: str) -> bytes:
    parsed_path = urllib.parse.urlparse(path)
    bucket, key = parsed_path.netloc, parsed_path.path[1:]
    s3_client = boto3.client('s3')
    if not s3_client:
        s3_client = boto3.client('s3')
    return s3_client.get_object(Bucket=bucket, Key=key)['Body'].read()


def load_services_from_s3(path: str) -> Dict[str, Dict[str, Any]]:
    bytes_data = lzma.decompress(load_s3_file(path))
    services = json.loads(bytes_data.decode())
    return services


def export_data_to_s3(services: Dict[str, Any], service_channels: Dict[str, Any]):
    log.debug('Exporting data to S3')
    put_services_s3(services, SERVICES_BUCKET, SERVICES_KEY)
    put_service_channels_s3(
        service_channels, SERVICES_BUCKET, SERVICE_CHANNELS_KEY)


def ptv_paginate(n_pages: int, url: str, start_date: str, status: PTVPublishState):
    ids: Set[str] = set()
    for page_number in range(1, n_pages + 1):
        response = requests.get(
            url,
            params={'page': page_number, 'date': start_date,  # type: ignore
                    'status': status.value},
            timeout=120
        ).json()
        # not None for name is to avoid a service which is given in the id list, but while getting its datta from PTV
        # a 404 message is given
        if response['itemList'] is not None:
            new_ids = {
                item['id'] for item in response['itemList'] if item['name'] is not None
            }

            try:
                assert len(new_ids & ids) == 0
            except AssertionError as ex:
                raise ServicesMismatch("Mismatch in IDs") from ex
            ids |= new_ids
    return ids


def fetch_ptv_services(start_date: str) -> Dict[str, Dict[str, Any]]:
    log.debug('Fetching service information')
    service_ids = fetch_service_ids(start_date)
    return fetch_service_infos(service_ids)


def fetch_ptv_service_channels(start_date: str) -> List[dict]:
    log.debug('Fetching service channel information')
    service_channel_ids = fetch_ptv_service_channel_ids(start_date)
    return fetch_service_channel_datas(service_channel_ids)


def fetch_ptv_service_channel_ids(start_date: str, status: PTVPublishState = PTVPublishState.PUBLISHED) -> Set[str]:
    response = requests.get(PTV_SERVICE_CHANNEL_URL).json()
    n_pages = response['pageCount']
    return ptv_paginate(n_pages, PTV_SERVICE_CHANNEL_URL, start_date, status)


def fetch_service_ids(start_date: str, status: PTVPublishState = PTVPublishState.PUBLISHED) -> Set[str]:
    response = requests.get(PTV_SERVICE_URL).json()
    n_pages = response['pageCount']
    return ptv_paginate(n_pages, PTV_SERVICE_URL, start_date, status)


def fetch_service_channel_datas(service_channel_ids: Set[str]) -> List[dict]:
    service_channel_datas = []
    max_supported_request_id_count = 99

    for idx, item_ids in enumerate(more_itertools.chunked(service_channel_ids, max_supported_request_id_count)):
        log.debug(f'Fetching service channel data from PTV ' \
            f'(set {idx + 1} / {math.ceil(len(service_channel_ids) / max_supported_request_id_count)})')
        resp = requests.get(PTV_SERVICE_CHANNEL_LIST_URL, params={
                            'guids': ','.join(item_ids)}, timeout=120)
        if resp.status_code != 200:
            log.technical.error(
                f'Error reading Service channels from PTV. '
                f'Status code: {resp.status_code}, error reason: {resp.reason}, payload: {item_ids}'
            )
            raise PTVAPIException()

        data = resp.json()
        for item in data:
            if isinstance(item, str):
                log.debug(item)

            service_channel_datas.append(item)

    return remove_duplicates(service_channel_datas, 'id')


def fetch_service_infos(service_ids: Set[str]) -> Dict[str, Dict[str, Any]]:
    # This is slow
    service_infos: Dict[str, Dict[str, Any]] = {}
    max_supported_request_id_count = 99
    for idx, item_ids in enumerate(more_itertools.chunked(service_ids, max_supported_request_id_count)):
        log.debug(f'Fetching service data from PTV ' \
            f'(set {idx + 1} / {math.ceil(len(service_ids) / max_supported_request_id_count)})')
        resp = requests.get(PTV_SERVICE_LIST_URL, params={
                            'guids': ','.join(item_ids)}, timeout=120)
        if resp.status_code != 200:
            log.technical.error(
                f'Error reading Services from PTV. '
                f'Status code: {resp.status_code}, error reason: {resp.reason}, payload: {item_ids}'
            )
            raise PTVAPIException()

        data = resp.json()
        for item in data:
            if isinstance(item, str):
                log.debug(item)

            service_infos[item['id']] = item

    service_info_ids = set(service_infos.keys())
    if service_info_ids != set(service_ids):
        log.technical.error(
            f'Service info was not found for all id:s. '
            f'Found {len(service_info_ids)}/{len(service_ids)} id:s in PTV data.'
        )
        raise PTVServiceIDMismatch

    return service_infos


def put_services_s3(services: Dict[str, Dict[str, Any]], bucket: str, key: str):
    compressed_services = lzma.compress(json.dumps(services).encode())
    s3_client = boto3.client('s3')
    log.debug(f'Uploading services to bucket: {bucket}, key: {key}')
    return s3_client.put_object(Bucket=bucket, Key=key, Body=compressed_services)


def put_service_channels_s3(service_channels: Dict[str, Dict[str, Any]], bucket: str, key: str):
    compressed_service_channels = lzma.compress(
        json.dumps(service_channels).encode())
    s3_client = boto3.client('s3')
    log.debug(f'Uploading service channels to bucket: {bucket}, key: {key}')
    return s3_client.put_object(
        Bucket=bucket, Key=key, Body=compressed_service_channels
    )


def load_service_vector_csv(bucket, file_path):
    s3_client = boto3.client('s3')
    obj = s3_client.get_object(Bucket=bucket, Key=file_path)
    return pd.read_csv(io.BytesIO(obj['Body'].read()))


def clean_service_vector_csv(
    service_vectors: pd.DataFrame, service_ids: Set[str]
) -> pd.DataFrame:
    log.debug('Generating service vectors')
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
        raise ServiceProfileDataException(
            'Incorrect values in service vector excel')

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

    # remove vectors that don't have their service id in current ptv service list
    missing_ids = set(service_vectors['service_id']) - service_ids
    if missing_ids:
        service_vectors = service_vectors[
            ~service_vectors['service_id'].isin(missing_ids)
        ]
        log.technical.message(
            f'Discarded service vectors for services not included in PTV service list. IDs: {missing_ids}'
        )

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


def remove_archived_service_data(start_date: str):
    log.debug('Removing services in archived/withdrawn state from database')

    services: List = []
    services.extend(fetch_service_ids(start_date, PTVPublishState.ARCHIVED))
    services.extend(fetch_service_ids(start_date, PTVPublishState.WITHDRAWN))
    log.debug(f'No. of archived/withdrawn services: {len(services)}')
    delete_service_data_from_db(services)

    service_channels: List = []
    service_channels.extend(fetch_ptv_service_channel_ids(
        start_date, PTVPublishState.ARCHIVED))
    service_channels.extend(fetch_ptv_service_channel_ids(
        start_date, PTVPublishState.WITHDRAWN))
    log.debug(
        f'No. of archived/withdrawn service channels: {len(service_channels)}')
    delete_service_channel_data_from_db(service_channels)


def main():
    with log.open():
        try:
            log.technical.info(
                'operationName', LogOperationName.PTV_DATA_LOADER)
            log.technical.info('branch', os.getenv('BUILD_BRANCH'))
            log.technical.info('build', os.getenv('BUILD_NUMBER'))
            log.technical.info('commitSha', os.getenv('BUILD_COMMIT_SHA'))

            mode = os.getenv('DATA_LOADER_MODE')
            if mode == 'full-run':
                last_ptv_fetch = None
                log.debug('Doing full fetch')
            else:
                last_ptv_fetch = get_latest_ptv_fetch_timestamp()
                log.debug(f'Previous fetch from PTV: {last_ptv_fetch}')

            services = fetch_ptv_services(last_ptv_fetch)
            log.debug(f'{len(services)} services fetched from PTV')
            load_services_to_db(services)

            service_channels = fetch_ptv_service_channels(last_ptv_fetch)
            log.debug(
                f'{len(service_channels)} service channels fetched from PTV')
            load_service_channels_to_db(service_channels)

            remove_archived_service_data(last_ptv_fetch)

            all_services = get_service_data_from_db()
            all_service_channels = get_service_channel_data_from_db()

            service_vectors = clean_service_vector_csv(
                load_service_vector_csv(SERVICES_BUCKET, SERVICE_VECTOR_KEY),
                set(all_services.keys()),
            )
            load_service_vectors_to_db(service_vectors)

            export_data_to_s3(all_services, all_service_channels)
            add_ptv_fetch_timestamp_to_db()

            log.debug('Finished')
        except Exception as error:
            log.technical.error(str(error))


if __name__ == '__main__':
    main()
