# Utility functions for reading emails from S3 bucket in Robot tests
# Caution: functions assume that the given bucket does not have huge amount of objects
import email
import email.policy
from time import sleep, time

import boto3

s3_resource = boto3.resource('s3')


def empty_bucket(bucket_name):
    bucket = s3_resource.Bucket(bucket_name)
    response = bucket.objects.delete()
    if response and response[0].get('Errors'):
        raise Exception(response[0]['Errors'])


def read_email(bucket_name, timeout_secs):
    bucket = s3_resource.Bucket(bucket_name)
    start = time()
    while time() - start < timeout_secs:
        objects = list(bucket.objects.all())
        if len(objects) == 0:
            sleep(1)
        elif len(objects) == 1:
            return _read_email_from_object(objects[0])
        else:
            raise Exception(f'bucket has over one object for reading email: {len(objects)}')
    raise Exception(f'no objects in bucket "{bucket_name}" after polling {timeout_secs} seconds')


def _read_email_from_object(obj):
    return email.message_from_bytes(obj.get()['Body'].read(), policy=email.policy.default)
