from typing import List

import boto3
import botocore
from werkzeug.exceptions import InternalServerError
from recommender_api.tools.logger import log


def translate_service_information(service, source_language, target_language):
    description = service.get('service_description', '')
    description_summary = service.get('service_description_summary', '')
    service_name = service.get('service_name', '')

    translated_text = _translate_multiple_strings(
        [description, description_summary, service_name],
        separator='|',
        source_language=source_language,
        target_language=target_language
    )

    service['service_description_orig'] = description
    service['service_description_summary_orig'] = description_summary
    service['service_name_orig'] = service_name
    service['service_description'] = translated_text[0]
    service['service_description_summary'] = translated_text[1]
    service['service_name'] = translated_text[2]

    channels = service.get('service_channels', [])
    for channel in channels:
        description = channel.get('service_channel_description', '')
        description_summary = channel.get('service_channel_description_summary', '')
        channel_name = channel.get('service_channel_name')

        translated_text = _translate_multiple_strings(
            [description, description_summary, channel_name],
            separator='|',
            source_language=source_language,
            target_language=target_language
        )

        channel['service_channel_description_orig'] = description
        channel['service_channel_description_summary_orig'] = description_summary
        channel['service_channel_name_orig'] = channel_name
        channel['service_channel_description'] = translated_text[0]
        channel['service_channel_description_summary'] = translated_text[1]
        channel['service_channel_name'] = translated_text[2]

    return service


def translate_text(text, source_language, target_language):
    translate = boto3.client(service_name='translate', region_name='eu-west-1', use_ssl=True)
    try:
        translation_result = translate.translate_text(
            Text=text,
            SourceLanguageCode=source_language,
            TargetLanguageCode=target_language)
    except botocore.exceptions.ParamValidationError as error:
        raise InternalServerError(f"Translation failed due to parameter error: {error}") from error
    translated_text = translation_result.get('TranslatedText', '')
    log.debug(f'Translated text {text} from {source_language} to {target_language}: {translated_text}')
    return translated_text


def _translate_multiple_strings(
        strings: List[str],
        separator: str = '|',
        source_language: str = 'fi',
        target_language: str = 'en'
):
    """
    This function can be used to translate multiple strings in one call to AWS translation API.
    The strings are combined to one string using the specified separator character and then translated.
    The resulting translation is then split using the same separator.

    Note that the maximum size for the combined string is 5000 bytes.
    """
    if all(len(item) == 0 for item in strings):
        return strings

    if any(separator in item for item in strings):
        raise ValueError('Separator character found in translation input.')

    joined: str = separator.join(strings)

    if len(bytearray(joined, 'utf-8')) > 5000:
        raise ValueError('Translation input too long.')

    translate = boto3.client(service_name='translate', region_name='eu-west-1', use_ssl=True)

    try:
        translation_result = translate.translate_text(
            Text=joined,
            SourceLanguageCode=source_language,
            TargetLanguageCode=target_language
        )
    except botocore.exceptions.ParamValidationError as error:
        raise InternalServerError(f"Translation failed: {error}") from error

    return translation_result.get('TranslatedText', '').split(separator)
