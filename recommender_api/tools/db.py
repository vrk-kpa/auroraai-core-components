from typing import Tuple
import os
import boto3
from botocore.config import Config
from psycopg2 import connect
from psycopg2.extensions import connection
from psycopg2.pool import SimpleConnectionPool
from .config import config


def db_endpoint(db_name: str, region: str) -> str:
    client = boto3.client('rds', config=Config(region_name=region))
    response = client.describe_db_instances()
    matched_instances = [instance for instance in response['DBInstances'] if is_valid_instance(instance, db_name)]
    if len(matched_instances) == 0:
        raise Exception(f'No DB instances found with DB name {db_name}')
    if len(matched_instances) > 1:
        raise Exception(f'More than one DB instances found with DB name {db_name}')
    endpoint = matched_instances[0]['Endpoint']['Address']
    return endpoint


def is_valid_instance(instance, db_name: str):
    return instance['DBName'] == db_name and instance.get('ReadReplicaSourceDBInstanceIdentifier') is None


def auth_token(db_auth_endpoint: str, port: str, user: str, region: str) -> str:
    client = boto3.client('rds', config=Config(region_name=region))
    token = client.generate_db_auth_token(DBHostname=db_auth_endpoint,
                                          Port=port, DBUsername=user, Region=region)
    return token


def db_connection(db_endpoint_address: str, db_auth_endpoint: str, db_name: str, port: str, user: str, region: str,
                  auth_token_port: str = None) -> connection:
    if not auth_token_port:
        auth_token_port = port

    environment = os.getenv('ENVIRONMENT')
    if environment in ('local', 'localcluster', 'localunittest', 'ci'):
        pwd = config['db_password']
    else:
        pwd = auth_token(db_auth_endpoint, auth_token_port, user, region)
    conn = connect(
        database=db_name,
        host=db_endpoint_address,
        port=port,
        user=user,
        password=pwd,
        connect_timeout=10)

    return conn


def db_connection_pool_aws(
        db_name: str,
        port: str,
        user: str,
        region: str,
        min_conn: int = 1,
        max_conn: int = 10,
        auth_token_port: str = None
) -> Tuple[SimpleConnectionPool, str]:
    """
    Create a connection pool to Postgres instance in AWS RDS using auth tokens
    """

    endpoint = db_endpoint(db_name, region)
    auth_token_port = auth_token_port or port

    token = auth_token(endpoint, auth_token_port, user, region)
    conn_pool = SimpleConnectionPool(
        min_conn,
        max_conn,
        host=endpoint,
        database=db_name,
        user=user,
        password=token,
        port=port
    )

    return conn_pool, endpoint


def db_connection_pool_classic(
        host: str,
        db_name: str,
        port: str,
        user: str,
        password: str,
        min_conn: int = 1,
        max_conn: int = 10
) -> Tuple[SimpleConnectionPool, str]:
    """
    Create a connection pool to Postgres using classic credentials
    """

    conn_pool = SimpleConnectionPool(
        min_conn,
        max_conn,
        host=host,
        database=db_name,
        user=user,
        password=password,
        port=port
    )

    return conn_pool, host


def test_connection(db_conn: connection):
    with db_conn.cursor() as cur:
        cur.execute('select 1')
