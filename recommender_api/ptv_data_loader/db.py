import json

from typing import Any, Dict, List, Optional, Union

from psycopg2.extras import execute_values, Json, DictCursor
import pandas as pd

from recommender_api.ptv_data_loader.constants import PTVPublishState
from recommender_api.tools.db import db_connection, db_endpoint
from recommender_api.tools.config import config
from recommender_api.tools.logger import log


(
    DB_HOST_ROUTING,
    DB_PORT,
    DB_USER,
    DB_NAME,
    REGION,
    SERVICES_DB_TABLE,
    SERVICE_CHANNELS_DB_TABLE,
) = (
    config['db_host_routing'],
    config['db_port'],
    config['db_loader_user'],
    config['db_name'],
    config['region'],
    config['services_db_table'],
    config['service_channels_db_table'],
)

SERVICE_VECTORS_DB_TABLE = config['service_vectors_db_table']
LIST_JOINER = ' '


class LoggingDictCursor(DictCursor):
    def execute(self, query, _vars=None):
        query_to_log = query if len(query) < 200 else query[:200]
        log.audit.sql_query(query_to_log)
        return super().execute(query, _vars)


def importable_data(
    services: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Union[str, Json]]]:
    def get_list_helper(
        service: Dict[str, Any], list_field: str, type_val: Optional[str] = None
    ):
        if type_val:
            list_values = [
                item.get('value', '')
                for item in service.get(list_field, [])
                if item.get('language') == 'fi' and item.get('type') == type_val
            ]
        else:
            list_values = [
                item.get('value', '')
                for item in service.get(list_field, [])
                if item.get('language') == 'fi'
            ]
        # Remove possible Nones
        list_values = [x for x in list_values if x is not None]
        return LIST_JOINER.join(list_values)

    def get_nested_helper(
        service: Dict[str, Any],
        main_list: str,
        sub_list: str,
        type_val: Optional[str] = None,
    ):
        list_values = []
        for nested_list in service.get(main_list, []):
            for item in nested_list.get(sub_list, []):
                if item.get('language') == 'fi' and item.get('type') == type_val:
                    list_values.append(item.get('value'))
        # Remove possible Nones
        list_values = [x for x in list_values if x is not None]
        return LIST_JOINER.join(list_values)

    def get_areas_type(service: Dict[str, Any]) -> str:
        area_type = [area.get('type') for area in service.get('areas', [])]
        return area_type[0] if area_type else ''

    def get_service_channels(service: Dict[str, Any]) -> str:
        channel_list = [
            channel.get('serviceChannel', {}).get('name')
            for channel in service.get('serviceChannels', [])
        ]
        # Remove possible Nones
        channel_list = [x for x in channel_list if x is not None]
        return LIST_JOINER.join(channel_list)

    def get_municipality_list(service: Dict[str, Any]) -> List[Dict[str, Any]]:
        municipality_list = [
            area.get('municipalities') for area in service.get('areas', [])
        ]
        return [item for sublist in municipality_list for item in sublist]

    def get_municipality_codes(service: Dict[str, Any]) -> str:
        municipality_list = get_municipality_list(service)
        return LIST_JOINER.join([m.get('code', '') for m in municipality_list])

    def get_municipality_names(service: Dict[str, Any]) -> str:
        municipality_list = get_municipality_list(service)
        municipality_name_list = [
            name.get('value', '')
            for mun_data in municipality_list
            for name in mun_data.get('name', [])
            if name.get('language') == 'fi'
        ]
        return LIST_JOINER.join(municipality_name_list)

    log.debug(f'Prepare data for import')
    prepared_data = [
        {
            'service_id': id_,
            'service_type': service.get('type'),
            'areas_type': get_areas_type(service),
            'area_type': service.get('areaType', ''),
            'service_name': get_list_helper(service, 'serviceNames', 'Name'),
            'description_summary': get_list_helper(service, 'serviceDescriptions', 'Summary'),
            'description': get_list_helper(service, 'serviceDescriptions', 'Description'),
            'user_instruction': get_list_helper(service, 'serviceDescriptions', 'UserInstruction'),
            'service_charge_type': service.get('serviceChargeType'),
            'charge_type_additional_info': get_list_helper(service, 'serviceDescriptions', 'ChargeTypeAdditionalInfo'),
            'target_groups': get_nested_helper(service, 'targetGroups', 'name'),
            'service_class_name': get_nested_helper(service, 'serviceClasses', 'name'),
            'service_class_description': get_nested_helper(service, 'serviceClasses', 'description'),
            'ontology_terms': get_nested_helper(service, 'ontologyTerms', 'name'),
            'life_events': get_nested_helper(service, 'lifeEvents', 'name'),
            'industrial_classes': get_nested_helper(service, 'industrialClasses', 'name'),
            'service_channels': get_service_channels(service),
            'municipality_codes': get_municipality_codes(service),
            'municipality_names': get_municipality_names(service),
            'archived': service.get('publishingStatus') != PTVPublishState.PUBLISHED.value,
            'service_data': Json(service),
        }
        for id_, service in services.items()
    ]

    return prepared_data


def build_conflict_statement(columns):
    column_map = map(lambda column: f'{column} = excluded.{column}', columns)
    return ', '.join(list(column_map))


def load_services_to_db(services: Dict[str, Dict[str, Any]]):
    log.debug('Loading service information to database')
    if services:
        # TODO: separate auth endpoint from db endpoint to allow local debugging to AWS RDS
        db_endpoint_address = (
            DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
        )

        with db_connection(
            db_endpoint_address=db_endpoint_address,
            db_auth_endpoint=db_endpoint_address,
            db_name=DB_NAME,
            port=DB_PORT,
            user=DB_USER,
            region=REGION,
        ) as conn:

            log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)
            data_to_import = importable_data(services)
            with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
                columns = list(data_to_import[0].keys())
                query = (
                    f'INSERT INTO {SERVICES_DB_TABLE}'
                    + ' ({}) VALUES %s'.format(','.join(columns))
                    + f' ON CONFLICT (service_id) DO UPDATE SET {build_conflict_statement(columns)}'
                )
                values = [list(service.values()) for service in data_to_import]
                execute_values(cur, query, values)

            conn.commit()


def load_service_vectors_to_db(dataframe: pd.DataFrame):
    log.debug('Loading service vectors to database')
    db_endpoint_address = (
        DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
    )
    with db_connection(
        db_endpoint_address=db_endpoint_address,
        db_auth_endpoint=db_endpoint_address,
        db_name=DB_NAME,
        port=DB_PORT,
        user=DB_USER,
        region=REGION,
    ) as conn:

        log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)
        with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
            cur.execute(f'truncate table {SERVICE_VECTORS_DB_TABLE}')
            tuples = [tuple(x) for x in dataframe.to_numpy()]
            columns = ','.join(list(dataframe.columns))
            query = f'INSERT INTO {SERVICE_VECTORS_DB_TABLE} VALUES %s'.format(columns)
            execute_values(cur, query, tuples)

        conn.commit()


def load_service_channels_to_db(service_channels: List[Dict[str, Any]]):
    log.debug('Loading service channel information to database')
    if service_channels:
        db_endpoint_address = (
            DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
        )

        with db_connection(
            db_endpoint_address=db_endpoint_address,
            db_auth_endpoint=db_endpoint_address,
            db_name=DB_NAME,
            port=DB_PORT,
            user=DB_USER,
            region=REGION,
        ) as conn:

            log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)

            values = [
                (
                    service_channel['id'],
                    service_channel.get('publishingStatus') != PTVPublishState.PUBLISHED.value,
                    json.dumps(service_channel)
                ) for service_channel in service_channels
            ]

            query = """
                INSERT INTO  service_recommender.service_channel
                    (service_channel_id, archived, service_channel_data)
                VALUES %s
                ON CONFLICT (service_channel_id) 
                    DO UPDATE SET 
                        (archived, service_channel_data) = 
                        (excluded.archived, excluded.service_channel_data);
            """

            with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
                execute_values(cur, query, values)

            conn.commit()


def add_ptv_fetch_timestamp_to_db():
    log.debug('Writing fetch timestamp to database')
    db_endpoint_address = (
        DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
    )
    with db_connection(
        db_endpoint_address=db_endpoint_address,
        db_auth_endpoint=db_endpoint_address,
        db_name=DB_NAME,
        port=DB_PORT,
        user=DB_USER,
        region=REGION,
    ) as conn:

        log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)

        with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
            cur.execute(
                'INSERT into service_recommender.ptv_fetch_timestamp DEFAULT VALUES'
            )
        conn.commit()


def get_latest_ptv_fetch_timestamp():
    log.debug('Fetching latest PTV load date')
    db_endpoint_address = (
        DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
    )
    with db_connection(
        db_endpoint_address=db_endpoint_address,
        db_auth_endpoint=db_endpoint_address,
        db_name=DB_NAME,
        port=DB_PORT,
        user=DB_USER,
        region=REGION,
    ) as conn:

        log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)

        with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
            cur.execute(
                'SELECT time FROM service_recommender.ptv_fetch_timestamp ORDER by time DESC LIMIT 1;'
            )
            data = [data[0] for data in cur.fetchall()]
            if data == []:
                return None
            timestamp = data[0].strftime('%Y-%m-%dT%H:%M:%S')
        return timestamp


def get_service_data_from_db():
    db_endpoint_address = (
        DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
    )
    with db_connection(
        db_endpoint_address=db_endpoint_address,
        db_auth_endpoint=db_endpoint_address,
        db_name=DB_NAME,
        port=DB_PORT,
        user=DB_USER,
        region=REGION,
    ) as conn:

        log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)

        with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
            cur.execute('SELECT service_data FROM service_recommender.service WHERE NOT archived')
            data = [data[0] for data in cur.fetchall()]
            services = {service['id']: service for service in data}
        return services


def get_service_channel_data_from_db():
    db_endpoint_address = (
        DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
    )
    with db_connection(
        db_endpoint_address=db_endpoint_address,
        db_auth_endpoint=db_endpoint_address,
        db_name=DB_NAME,
        port=DB_PORT,
        user=DB_USER,
        region=REGION,
    ) as conn:

        log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)

        with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
            cur.execute(
                'SELECT service_channel_data FROM service_recommender.service_channel WHERE NOT archived'
            )
            data = [data[0] for data in cur.fetchall()]
            service_channels = {
                service_channel['id']: service_channel for service_channel in data
            }
        return service_channels


def flag_archived_services_in_db(service_ids: List[str], service_channel_ids: List[str]):
    if service_ids:
        db_endpoint_address = (
            DB_HOST_ROUTING if DB_HOST_ROUTING != '' else db_endpoint(DB_NAME, REGION)
        )
        with db_connection(
            db_endpoint_address=db_endpoint_address,
            db_auth_endpoint=db_endpoint_address,
            db_name=DB_NAME,
            port=DB_PORT,
            user=DB_USER,
            region=REGION,
        ) as conn:

            log.technical.database(db_endpoint_address, DB_PORT, DB_NAME)

            with conn.cursor(cursor_factory=LoggingDictCursor) as cur:
                query = 'UPDATE service_recommender.service SET archived = true WHERE service_id IN %(services)s'
                cur.execute(query, {'services': tuple(service_ids)})

                query = """
                    UPDATE service_recommender.service_channel 
                    SET archived = true 
                    WHERE service_channel_id IN %(service_channels)s
                """
                cur.execute(query, {'service_channels': tuple(service_channel_ids)})

            conn.commit()
