from typing import Dict, Any
import json
import os

import boto3
from botocore.client import BaseClient
from botocore.exceptions import ClientError


def env() -> str:
    return os.environ['ENVIRONMENT']


def get_secret(secret_name: str, secrets_manager_client: BaseClient = None) -> Dict[str, Any]:
    if not secrets_manager_client:
        secrets_manager_client = boto3.client('secretsmanager')

    try:
        get_secret_value_response = secrets_manager_client.get_secret_value(SecretId=secret_name)
    except ClientError as err:
        if err.response['Error']['Code'] == 'ResourceNotFoundException':
            raise Exception(f'Secret {secret_name} not found') from err
        raise ClientError from err

    secret = get_secret_value_response['SecretString']

    try:
        return json.loads(secret)
    except ValueError:
        return {'value': secret}
