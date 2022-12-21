import json
import requests
from typing import Any, Dict, Generator, List, Optional, Set, Union

from recommender_api.tools.config import config
from recommender_api.tools.logger import log

from recommender_api.mock_session_service import search_mock_service_channel
from .db import get_services_ptv_data, get_service_channels_ptv_data
from werkzeug.exceptions import InternalServerError

# Swagger for PTV https://api.palvelutietovaranto.suomi.fi/swagger/ui/index.html
PTV_SERVICE_LIST_URL = config['ptv_url_prefix'] + \
    config['ptv_service_list_url_suffix']
PTV_SERVICE_CHANNEL_LIST_URL = (
    config['ptv_url_prefix'] + config['ptv_service_channel_list_url_suffix']
)
PTV_SERVICE_COLLECTION_URL = (
    config['ptv_url_prefix'] + config['ptv_service_collection_url_suffix']
)
LIST_JOINER = ', '
INCLUDED_SERVICE_CHANNEL_TYPES = [
    'EChannel',
    'WebPage',
    'Phone',
    'ServiceLocation',
    'PrintableForm',
]


def chunks(lst: List, chunk_size: int) -> Generator:
    """Yield successive n-sized chunks from lst."""
    for index in range(0, len(lst), chunk_size):
        yield lst[index: index + chunk_size]


def _first_item(
    list_values: List[Dict[str, Any]], language: str = 'fi', field_name: str = 'value'
) -> str:
    values_with_language = [
        item[field_name] for item in list_values if item['language'] == language
    ]
    return values_with_language[0] if len(values_with_language) > 0 else ''


def get_str(dictionary: Dict[str, Any], key: str) -> str:
    value = dictionary.get(key, '')
    return '' if value is None else value


def _get_list_helper(
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


def get_format_service_data(service_ids: List[str]) -> List[Dict[str, Any]]:
    service_datas = get_services_ptv_data(service_ids)
    service_channels = get_service_channels_ptv_data(
        _required_service_channel_ids(service_datas)
    )
    return _format_service_outputs(service_datas, service_channels)


def get_service_channel_web_pages(service_channel_id: str):

    mock_channel = search_mock_service_channel(service_channel_id)
    if mock_channel:
        return mock_channel['web_pages']

    service_channel = get_service_channels_ptv_data({service_channel_id})[0]
    return [
        get_str(page, 'url')
        for page in service_channel['webPages']
        if page['language'] == 'fi'
    ]


def _required_service_channel_ids(services_data: List[Dict[str, Any]]) -> Set[str]:
    return {
        channel_data['serviceChannel']['id']
        for service in services_data
        for channel_data in service.get('serviceChannels', [])
    }


def _format_service_outputs(
    service_data: List[Dict[str, Any]], service_channels_data: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:

    formatted_service_channels = {
        channel['id']: _format_service_channel_output(channel)
        for channel in service_channels_data
        if channel.get('serviceChannelType') in INCLUDED_SERVICE_CHANNEL_TYPES
    }

    def _format_responsible_organization(
        service: Dict[str, Any]
    ) -> Optional[Dict[str, str]]:
        organizations = service.get('organizations', [])
        return next(
            (
                organization.get('organization')
                for organization in organizations
                if organization.get("roleType") == "Responsible"
            ),
            None,
        )

    def _format_service_class_uris(service: Dict[str, Any]) -> List[str]:
        return [
            service_class['newUri']
            for service_class in service.get('serviceClasses', [])
            if 'newUri' in service_class
        ]

    def _format_service(service: Dict[str, Any]) -> Dict[str, Any]:
        channel_ids = [
            get_str(ch.get('serviceChannel', {}), 'id')
            for ch in service.get('serviceChannels', [])
        ]
        channels = [
            formatted_service_channels[ch_id]
            for ch_id in channel_ids
            if ch_id in formatted_service_channels
        ]

        return {
            'service_id': service['id'],
            'service_name': _get_list_helper(service, 'serviceNames', 'Name'),
            'service_description': _get_list_helper(
                service, 'serviceDescriptions', 'Description'
            ),
            'service_description_summary': _get_list_helper(
                service, 'serviceDescriptions', 'Summary'
            ),
            'funding_type': service.get('fundingType'),
            'user_instruction': _get_list_helper(service, 'serviceDescriptions', 'UserInstruction'),
            'service_channels': channels,
            'area_type': service.get('areaType'),
            'areas': service.get('areas'),
            'responsible_organization': _format_responsible_organization(service),
            'target_groups': _format_target_groups(service.get('targetGroups', [])),
            'service_collections': _format_service_collections(service.get('serviceCollections', [])),
            'service_class_uris': _format_service_class_uris(service),
            'requirements': [
                i['value']
                for i in service.get('requirements', [])
                if i['language'] == 'fi'
            ],
            'charge_type': get_str(service, 'serviceChargeType'),
            'charge_additional_info': _get_list_helper(
                service, 'serviceDescriptions', 'ChargeTypeAdditionalInfo'
            ),
        }

    return list(map(_format_service, service_data))


def _format_target_groups(target_groups: Dict[str, Any]) -> List[str]:
    return list(map(lambda target_group: target_group['code'], target_groups))  # type: ignore


def _format_service_collections(target_groups: Dict[str, Any]) -> List[str]:
    return list(map(lambda target_group: target_group['id'], target_groups)) # type: ignore


def _format_address(address: Dict[str, Any]) -> Optional[str]:
    street = address.get('streetAddress', {})
    if not street or address.get('type', '') != 'Location':
        return None
    street_name = _first_item(street.get('street', []))
    municipality = _first_item(street.get('municipality', {}).get('name', []))
    return f"{street_name} {get_str(street, 'streetNumber')}, {get_str(street, 'postalCode')}, {municipality}"


def _format_location(address: Dict[str, Any]) -> Union[Dict[str, str], None]:
    street = address.get('streetAddress', {})
    if not street or address.get('type', '') != 'Location':
        return None

    return {
        'latitude': get_str(street, 'latitude'),
        'longitude': get_str(street, 'longitude'),
    }


def _format_phone_number(phone_number: Dict[str, Any]) -> str:
    number = (
        f"{get_str(phone_number, 'additionalInformation')} {get_str(phone_number, 'prefixNumber')} "
        f"{get_str(phone_number, 'number')}"
    )
    return number.strip()


def _format_service_hour(service_hour: Dict[str, Any]) -> str:
    if service_hour.get('isAlwaysOpen'):
        return 'Aina avoinna'

    def format_hour(hour: Dict[str, Any]) -> str:
        from_str = f'{hour.get("dayFrom")} {hour.get("from")}'
        to_str = f'{hour.get("dayTo")} {hour.get("to")}'
        return f'{from_str.strip()} - {to_str.strip()}'

    opening_hours = ', '.join(
        [format_hour(hour) for hour in service_hour.get("openingHour", [])]
    )
    return opening_hours


def _format_service_channel_output(service_channel: Dict[str, Any]) -> Dict[str, Any]:
    web_pages = [
        get_str(page, 'url')
        for page in service_channel['webPages']
        if page['language'] == 'fi'
    ]
    emails = [
        e['value'] for e in service_channel.get('emails', []) if e['language'] == 'fi'
    ]
    addresses = [
        _format_address(a)
        for a in service_channel.get('addresses', [])
        if _format_address(a)
    ]
    # Assumes only one location address per service channel
    address = addresses[0] if len(addresses) > 0 else ''
    service_hours = [
        _format_service_hour(service_hour)
        for service_hour in service_channel.get('serviceHours', [])
        if service_hour.get('serviceHourType') == 'DaysOfTheWeek'
    ]
    # Filter out Fax
    phone_numbers = [
        _format_phone_number(number)
        for number in service_channel.get('phoneNumbers', [])
        if number.get('type') == 'Phone'
    ]
    locations = [
        _format_location(a)
        for a in service_channel.get('addresses', [])
        if _format_location(a)
    ]
    location = locations[0] if len(locations) > 0 else ''

    return {
        'service_channel_id': get_str(service_channel, 'id'),
        'service_channel_name': _get_list_helper(
            service_channel, 'serviceChannelNames', 'Name'
        ),
        'service_channel_type': get_str(service_channel, 'serviceChannelType'),
        'service_channel_description_summary': _get_list_helper(
            service_channel, 'serviceChannelDescriptions', 'Summary'
        ),
        'service_channel_description': _get_list_helper(
            service_channel, 'serviceChannelDescriptions', 'Description'
        ),
        'phone_numbers': phone_numbers,
        'web_pages': web_pages,
        'emails': emails,
        'address': address,
        'location': location,
        'service_hours': service_hours,
    }


def get_service_collections_from_ptv() -> Set[str]:
    try:
        response = requests.get(PTV_SERVICE_COLLECTION_URL).json()
        n_pages = response['pageCount']
        ids: Set[str] = set()
        for page_number in range(1, n_pages + 1):
            response = requests.get(
                PTV_SERVICE_COLLECTION_URL,
                params={'page': page_number, 'archived': 'false'},  # type: ignore
            )
            response.raise_for_status()
            response = response.json()
            # not None for name is to avoid a service which is given in the id list, but while getting its data from PTV
            # a 404 message is given
            if response['itemList'] is not None:
                new_ids = {
                    item['id'] for item in response['itemList'] if item['name'] is not None
                }
                ids |= new_ids
        return ids
    except:
        raise InternalServerError('Failed to fetch PTV service collection data')


if __name__ == '__main__':
    # For testing output formats from PTV data
    test_response = get_format_service_data(
        ['f219abe6-d7fa-4c03-9875-d6a27d56d0a7'])
    log.debug(json.dumps(test_response))
