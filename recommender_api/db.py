import re
from typing import List, Set, Dict, Optional, Any, Union
from contextlib import contextmanager

import flask
from psycopg2 import sql  # type: ignore
from psycopg2.extras import execute_values, Json, DictCursor  # type: ignore
from psycopg2.errors import ForeignKeyViolation, OperationalError  # pylint: disable=E0611
from psycopg2.pool import SimpleConnectionPool

import pandas as pd

from recommender_api.tools.config import config, env
from recommender_api.tools.db import db_connection_pool_aws, db_connection_pool_classic
from recommender_api.tools.logger import log

from recommender_api.search_text_filter import filter_social_security_numbers

DB_HOST_ROUTING, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REGION = \
    config['db_host_routing'], config['db_port'], config['db_api_user'], \
    config.get('db_password'), config['db_name'], config['region']

CONN_POOL: Optional[SimpleConnectionPool] = None


class InvalidRecommendationIdException(Exception):
    pass


class InvalidServiceIdException(Exception):
    pass


class InvalidRedirectException(Exception):
    pass


class LoggingDictCursor(DictCursor):
    def execute(self, query, _vars=None):
        if env != 'prod':
            log.audit.sql_query(query)
        return super().execute(query, _vars)


@contextmanager
def database(cursor_factory=LoggingDictCursor):
    global CONN_POOL  # pylint: disable=W0603

    def create_pool():
        use_local_db = DB_HOST_ROUTING and DB_PASSWORD

        pool, hostname = db_connection_pool_aws(DB_NAME, DB_PORT, DB_USER, REGION) if not use_local_db \
            else db_connection_pool_classic(DB_HOST_ROUTING, DB_NAME, DB_PORT, DB_USER, DB_PASSWORD)

        log.technical.database(hostname, DB_PORT, DB_NAME)
        return pool

    # Initialize connection pool on first db connection
    if CONN_POOL is None:
        CONN_POOL = create_pool()

    try:
        con = CONN_POOL.getconn()
        cur = con.cursor(cursor_factory=cursor_factory)
    except OperationalError as err:
        # Retry creating connection pool in case access token is not valid anymore
        log.technical.error(f'Error connecting to db: {err}')

        CONN_POOL = create_pool()
        con = CONN_POOL.getconn()
        cur = con.cursor(cursor_factory=cursor_factory)

    try:
        yield con, cur
    finally:
        cur.close()
        CONN_POOL.putconn(con)


def reset_db_connection_pool():
    """
    Close all database connections and clear the connection pool.
    This must be done before forking Gunicorn workers.
    """
    global CONN_POOL  # pylint: disable=W0603
    if CONN_POOL:
        CONN_POOL.closeall()
        CONN_POOL = None


def get_random_services(municipality: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
    if municipality:
        db_query = sql.SQL("""
                   SELECT * FROM service_recommender.service 
                   WHERE LOWER(municipality_codes) LIKE LOWER(%(municipality)s)
                   ORDER BY RANDOM() LIMIT %(limit)s;
                   """)
        with database(cursor_factory=LoggingDictCursor) as (_, cur):
            cur.execute(db_query,
                        {
                            'municipality': municipality,
                            'limit': limit
                        })
            result = cur.fetchall()
    else:
        db_query = sql.SQL("""
                   SELECT * FROM service_recommender.service 
                   WHERE area_type in ('Nationwide', 'NationwideExceptAlandIslands')
                   ORDER BY RANDOM () LIMIT %(limit)s
                   """)
        with database(cursor_factory=LoggingDictCursor) as (_, cur):
            cur.execute(db_query,
                        {
                            'limit': limit
                        })
            result = cur.fetchall()
    return result


def _build_service_classes_filter_sql(skip: bool):
    return sql.SQL("") if skip else sql.SQL(
        """
        INNER JOIN jsonb_array_elements(service_data->'serviceClasses') AS serviceClass ON (
          serviceClass->>'newUri' IN %(service_classes)s
          OR serviceClass->>'newParentUri' IN %(service_classes)s
        )
        """
    )


def _build_target_group_filter_sql(skip: bool):
    return sql.SQL("") if skip else sql.SQL(
        """
        INNER JOIN jsonb_array_elements(service_data->'targetGroups') AS targetGroup ON (
          targetGroup->>'code' IN %(target_groups)s
        )
        """
    )


def _build_funding_type_filter(skip: bool):
    if skip:
        return sql.SQL("TRUE")

    return sql.SQL(
        "(service_data->>'fundingType' IN %(funding_type)s)"
    )


def _build_service_collection_filter(skip: bool):
    return sql.SQL("") if skip else sql.SQL(
        """
        INNER JOIN jsonb_array_elements(service_data->'serviceCollections') AS serviceCollection ON (
          serviceCollection->>'id' IN %(service_collections)s
        )
        """
    )


def _build_municipality_filter_sql(municipality_codes: List[str], include_national: bool, only_national: bool):
    if only_national:
        return sql.SQL("(area_type LIKE 'Nationwide%%')")

    if not municipality_codes and not include_national:
        return sql.SQL("(area_type NOT LIKE 'Nationwide%%')")

    if not municipality_codes and include_national:
        return sql.SQL("TRUE")

    return sql.SQL("""(
        (%(include_national)s AND area_type LIKE 'Nationwide%%') OR
        (string_to_array(municipality_codes, ' ') && %(municipality_codes)s)
    )""")


def build_sql_filter_queries(
        municipality_codes: List[str],
        include_national: bool,
        only_national: bool,
        service_classes: List[str],
        target_groups: List[str],
        service_collections: List[str],
        funding_type: List[str],
) -> Dict[str, str]:
    return {
        'municipality_filter': _build_municipality_filter_sql(municipality_codes, include_national, only_national),
        'service_class_filter': _build_service_classes_filter_sql(skip=(service_classes == [])),
        'target_group_filter': _build_target_group_filter_sql(skip=(target_groups == [])),
        'service_collection_filter': _build_service_collection_filter(skip=(service_collections == [])),
        'funding_type_filter': _build_funding_type_filter(skip=(funding_type == [] or not funding_type)),
    }


def get_filtered_service_ids(
        municipality_codes: List[str],
        include_national: bool,
        only_national: bool,
        service_classes: List[str],
        target_groups: List[str],
        service_collections: List[str],
        funding_type: List[str],
) -> List[str]:
    db_query = sql.SQL("""
        SELECT DISTINCT service_id
        FROM service_recommender.service
        {service_class_filter} {target_group_filter} {service_collection_filter} 
        WHERE {municipality_filter} AND {funding_type_filter};
    """).format(
        **build_sql_filter_queries(
            municipality_codes,
            include_national,
            only_national,
            service_classes,
            target_groups,
            service_collections,
            funding_type
        )
    )

    with database(cursor_factory=LoggingDictCursor) as (_, cur):
        cur.execute(
            db_query,
            {
                'service_classes': tuple(service_classes),
                'municipality_codes': municipality_codes,
                'include_national': include_national,
                'only_national': only_national,
                'target_groups': tuple(target_groups),
                'service_collections': tuple(service_collections),
                'funding_type': tuple(funding_type)
            }
        )
        service_ids = [data[0] for data in cur.fetchall()]

    return service_ids


def get_service_vectors(
        municipality_codes: List[str],
        include_national: bool,
        only_national: bool,
        service_classes: List[str],
        target_groups: List[str],
        service_collections: List[str],
        funding_type: List[str],
) -> pd.DataFrame:
    db_query = sql.SQL("""
        SELECT DISTINCT vector.*
        FROM service_recommender.service_vectors vector
        INNER JOIN service_recommender.service service
        ON service.service_id = vector.service_id AND {municipality_filter} AND {funding_type_filter}
        {service_class_filter} {target_group_filter} {service_collection_filter} 
    """).format(
        **build_sql_filter_queries(
            municipality_codes,
            include_national,
            only_national,
            service_classes,
            target_groups,
            service_collections,
            funding_type
        )
    )

    with database(cursor_factory=LoggingDictCursor) as (_, cur):
        cur.execute(
            db_query,
            {
                'service_classes': tuple(service_classes),
                'municipality_codes': municipality_codes,
                'include_national': include_national,
                'only_national': only_national,
                'target_groups': tuple(target_groups),
                'service_collections': tuple(service_collections),
                'funding_type': tuple(funding_type)
            }
        )
        data = cur.fetchall()

        # Extract the column names
        col_names = []
        for elt in cur.description:
            col_names.append(elt[0])

        data_frame = pd.DataFrame(data, columns=col_names)
        data_frame.set_index('service_id', inplace=True)
        # Remove area_type as it's not used after this
        data_frame.drop('municipality_code', inplace=True, axis=1)
        log.debug(f'Results ready {data_frame}')
        return data_frame


def _select_jsonb_where_id_in_list(
        table: str,
        data_column: str,
        id_column: str,
        id_list: Union[List[str], Set[str]]
) -> List[Dict[str, Any]]:
    if not id_list:
        return []

    db_query = sql.SQL("SELECT {data_column} FROM service_recommender.{table} WHERE {id_column} IN %(id_list)s").format(
        data_column=sql.Identifier(data_column),
        table=sql.Identifier(table),
        id_column=sql.Identifier(id_column)
    )

    with database(cursor_factory=LoggingDictCursor) as (_, cur):
        cur.execute(db_query, {'id_list': tuple(id_list)})
        return [item for row in cur for item in row if item is not None]


def get_services_ptv_data(id_list: List[str]) -> List[Dict[str, Any]]:
    return _select_jsonb_where_id_in_list('service', 'service_data', 'service_id', id_list)


def get_service_channels_ptv_data(id_list: Set[str]) -> List[Dict[str, Any]]:
    return _select_jsonb_where_id_in_list('service_channel', 'service_channel_data', 'service_channel_id', id_list)


def format_multiword_search(search: str) -> str:
    return search.replace(' ', '|')


def _store_recommendation_base(cursor, request):
    recommendation_query = \
        'insert into service_recommender.recommendation ' \
        '(session_id, calling_organisation, calling_service, request_path, request_attributes)' \
        'values (%s, %s, %s, %s, %s) ' \
        'returning recommendation_id'

    request_body = request.get_json()
    if 'search_text' in request_body:
        request_body['search_text'] = filter_social_security_numbers(
            request_body['search_text'])

    cursor.execute(
        recommendation_query,
        (
            request_body.get('session_id'),
            request.calling_organisation,
            request.calling_service,
            request.path,
            Json(request_body)
        )
    )
    result = cursor.fetchone()
    recommendation_id = result[0]
    return recommendation_id


def _store_recommendation_services(cursor, recommendation_id, services):
    recommended_services_query = 'insert into service_recommender.recommendation_service ' \
                                 '(recommendation_id, service_id) values %s'

    services_data = [(recommendation_id, service_id)
                     for service_id in services]
    execute_values(cursor, recommended_services_query,
                   services_data, template=None, page_size=100)


def store_recommendations_db(
        services: List[str],
        request: flask.Request
) -> int:
    with database() as (conn, cur):
        recommendation_id = _store_recommendation_base(cur, request)
        _store_recommendation_services(cur, recommendation_id, services)
        conn.commit()

    return recommendation_id


def store_redirect(recommendation_id, service_id, service_channel_id, auroraai_access_token):
    with database() as (conn, cur):
        try:
            query = f'insert into service_recommender.recommendation_redirect ' \
                    f'(recommendation_id, service_id, service_channel_id, auroraai_access_token) ' \
                    f'values (%s, %s, %s, %s)'
            cur.execute(query, (recommendation_id, service_id, service_channel_id, auroraai_access_token))
            conn.commit()
        except ForeignKeyViolation as ex:
            log.technical.error(f'Exception when writing redirect to DB: {ex}')
            raise InvalidRedirectException() from ex


def store_feedback(recommendation_id: int, feedback_score: Optional[int] = None,
                   service_feedbacks: Optional[List[Dict[str, Union[str, int]]]] = None):
    with database() as (conn, cur):
        if feedback_score:
            try:
                feedback_query = f'insert into service_recommender.recommendation_feedback ' \
                                 f'(recommendation_id, feedback_score) values (%s, %s)'
                cur.execute(feedback_query,
                            (recommendation_id, feedback_score))
            except ForeignKeyViolation as ex:
                log.technical.error(
                    f'Exception when writing feedback to DB: {ex}')
                conn.rollback()
                raise InvalidRecommendationIdException(
                    f'Invalid recommendation_id: {recommendation_id}') from ex

        if service_feedbacks:
            try:
                service_feedbacks_query = f'insert into service_recommender.recommendation_service_feedback ' \
                                          f'(recommendation_id, service_id, feedback_score) values %s'
                service_feedbacks_data = [(recommendation_id, f['service_id'], f['feedback_score'])
                                          for f in service_feedbacks]
                execute_values(cur, service_feedbacks_query,
                               service_feedbacks_data, template=None, page_size=100)
            except ForeignKeyViolation as ex:
                # pylint: disable=C0301
                regexp_pattern = r'(?!DETAIL:  Key \(recommendation_id, service_id\)=\([0-9]*,)\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b(?=\) is not present in table \"recommendation_service\".)'
                regexp_result = re.search(regexp_pattern, str(ex))
                service_id = regexp_result.group(
                    0) if regexp_result else 'unknown'
                log.technical.error(
                    f'Exception when writing service feedback to DB: {ex}')
                conn.rollback()
                raise InvalidServiceIdException(
                    f'Invalid service id: {service_id}') from ex

        conn.commit()


def get_service_class_names(service_ids: List[str]) -> Dict[str, str]:
    db_query = sql.SQL("""
        SELECT DISTINCT service_id, service_class_name
        FROM service_recommender.service
        WHERE service_id IN %(service_ids)s;
    """)

    with database(cursor_factory=LoggingDictCursor) as (_, cur):
        cur.execute(
            db_query,
            {
                'service_ids': tuple(service_ids),
            }
        )
        service_class_names = {item[0]: item[1] for item in cur.fetchall()}

    return service_class_names


def get_service_descriptions(service_ids: List[str]) -> Dict[str, Dict[str, str]]:
    db_query = sql.SQL("""
        SELECT DISTINCT service_id, description, description_summary, user_instruction
        FROM service_recommender.service
        WHERE service_id IN %(service_ids)s;
    """)

    with database(cursor_factory=LoggingDictCursor) as (_, cur):
        cur.execute(
            db_query,
            {
                'service_ids': tuple(service_ids),
            }
        )
        service_descriptions = {
            item[0]: {
                'service_description': item[1],
                'description_summary': item[2],
                'user_instruction': item[3]
            } for item in cur.fetchall()
        }

    return service_descriptions


def get_redirects_and_feedback(service_ids: List[str], calling_service: str) -> pd.DataFrame:
    db_query = sql.SQL("""
        SELECT a.recommendation_id
            , a.service_id
            , b.feedback_score
            , c.calling_service
            , d.redirect_time
            FROM service_recommender.recommendation_service AS a
            LEFT JOIN service_recommender.recommendation_service_feedback AS b
                ON a.recommendation_id = b.recommendation_id AND a.service_id = b.service_id
            INNER JOIN service_recommender.recommendation as c
                ON a.recommendation_id = c.recommendation_id
            LEFT JOIN service_recommender.recommendation_redirect as d
                ON  a.recommendation_id = d.recommendation_id AND a.service_id = d.service_id
        WHERE a.service_id IN %(service_ids)s AND c.calling_service = %(calling_service)s
        ORDER BY a.recommendation_id, a.service_id;
            """)

    with database(cursor_factory=LoggingDictCursor) as (_, cur):
        cur.execute(
            db_query,
            {
                'service_ids': tuple(service_ids),
                'calling_service': calling_service
            }
        )
        feedback_data = cur.fetchall()

    feedback_data = pd.DataFrame(feedback_data,
                                 columns=['recommendation_id', 'service_id', 'feedback_score',
                                          'calling_service', 'redirect_time'])

    return feedback_data
