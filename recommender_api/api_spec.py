from uuid import UUID

from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin
from marshmallow import Schema, fields, validate, validates_schema, ValidationError, post_load

from recommender_api.tools.config import config
from recommender_api.tools.logger import log

from .recommender_input import Recommender3x10dParameters, RecommenderTextSearchParameters
from .service_classes import valid_service_classes
from .municipality_data import municipality_data
from .target_groups import valid_target_groups
from .funding_type import valid_funding_types
from .ptv import get_service_collections_from_ptv
from .wellbeing_service_county_codes import wellbeing_service_county_codes

PTV_SERVICE_LIST_URL = config['ptv_url_prefix'] + \
                       config['ptv_service_list_url_suffix']
PTV_SERVICE_CHANNEL_LIST_URL = config['ptv_url_prefix'] + \
                               config['ptv_service_channel_list_url_suffix']

SCALE_DESCRIPTION = 'in scale from 0 to 10'
VALID_FEEDBACK_SCORES = [-1, 1]
VALID_LANGUAGES = ['en', 'de', 'fr', 'et', 'da', 'no', 'uk', 'ru', 'fi', 'sv']

AREA_FILTERS = [
    "include_national_services",
    "municipality_codes",
    "region_codes",
    "hospital_district_codes",
    "wellbeing_service_county_codes"
]

# Create an APISpec
spec = APISpec(
    title="Service Recommender",
    version="0.1.0",
    openapi_version="3.0.2",
    plugins=[FlaskPlugin(), MarshmallowPlugin()],
)

# Define API key security scheme
authorization_scheme = {"type": "http", "scheme": "basic"}
spec.components.security_scheme(
    "basic_client_id_client_secret", authorization_scheme)


class StrictBoolean(fields.Field):
    """
    Field that accepts only True or False. Use instead of fields.Boolean
    which accepts a much broader range of truthy/falsy values.
    """

    @staticmethod
    def _is_true_boolean(value):
        if not isinstance(value, bool):
            raise ValidationError('boolean field must be true or false')
        return value

    def _serialize(self, value, attr, obj, **kwargs):
        return self._is_true_boolean(value)

    def _deserialize(self, value, attr, data, **kwargs):
        return self._is_true_boolean(value)


class Field3X10D(fields.List):
    def __init__(self, description: str, required: bool):
        valid_range = validate.Range(min=0, max=10)
        super().__init__(
            fields.Int(
                validate=valid_range,
                strict=True
            ),
            metadata={'description': description},
            required=required
        )


class LifeSituationMetersSchema(Schema):
    working_studying = Field3X10D(f'Opiskelu tai työ', required=False)
    family = Field3X10D(f'Perhe', required=False)
    friends = Field3X10D(f'Ystävät', required=False)
    health = Field3X10D(f'Terveys', required=False)
    improvement_of_strengths = Field3X10D(
        f'Itsensä kehittäminen', required=False)
    housing = Field3X10D(f'Asuminen', required=False)
    finance = Field3X10D(f'Raha-asiat', required=False)
    self_esteem = Field3X10D(f'Itsetunto', required=False)
    resilience = Field3X10D(f'Vaikeuksien voittaminen', required=False)
    life_satisfaction = Field3X10D(f'Tyytyväisyys elämään', required=False)

    @validates_schema
    def validate_some_field_present(self, data, **_):
        if not any(field in data for field in self.fields):
            raise ValidationError('some field should be present')


class ServiceFiltersSchema(Schema):
    @validates_schema
    # pylint: disable=R0201
    def validate_service_collections(self, data, **_):
        """
        We want to make sure that only valid service collections will be passed. Given service collection IDs
        are validated against PTV API.
        """
        service_collections = data.get('service_collections')
        if service_collections is not None:
            valid_collection_ids = get_service_collections_from_ptv()
            if not all(item in valid_collection_ids for item in service_collections):
                raise ValidationError(
                    "Invalid service collection IDs provided.")

    @validates_schema
    # pylint: disable=R0201
    def validate_no_other_area_filters_with_only_national(self, data, **_):
        if data.get('only_national_services'):
            for area_filter in AREA_FILTERS:
                if data.get(area_filter) is not None:
                    raise ValidationError(f'only_national_services selected. {area_filter} not allowed.')

    include_national_services = StrictBoolean(
        metadata={'description': "Select if national services are included recommendation results. Defaults to 'true'."
                                 "If set to 'false', only services matching the area filters are recommended."},
        required=False,
        dump_default=True
    )

    only_national_services = StrictBoolean(
        metadata={
            'description': "Select if national services only included at recommendation results. Defaults to 'false'."
                           "If set to 'true', only nationwide services recommended."},
        required=False,
        dump_default=False
    )

    municipality_codes = fields.List(
        fields.String(
            metadata={'description': "Municipality as a code defined in koodistot.suomi.fi from where "
                                     "the recommendations are given."},
            validate=validate.OneOf(municipality_data.valid_municipality_codes)
        ),
        required=False,
        validate=validate.Length(
            1, len(municipality_data.valid_municipality_codes))
    )

    region_codes = fields.List(
        fields.String(
            metadata={'description': "Region (maakunta) as a code defined in stat.fi from where "
                                     "the recommendations are given."},
            validate=validate.OneOf(municipality_data.valid_region_codes)
        ),
        required=False,
        validate=validate.Length(1, len(municipality_data.valid_region_codes))
    )

    hospital_district_codes = fields.List(
        fields.String(
            metadata={'description': "Hospital district (sairaanhoitopiiri) as a code defined in stat.fi from where "
                                     "the recommendations are given."},
            validate=validate.OneOf(
                municipality_data.valid_hospital_district_codes)
        ),
        required=False,
        validate=validate.Length(
            1, len(municipality_data.valid_hospital_district_codes))
    )

    service_classes = fields.List(
        fields.String(
            metadata={'description': "Service class URI as defined in koodistot.suomi.fi."},
            validate=validate.OneOf(valid_service_classes)
        ),
        required=False,
        validate=validate.Length(1, len(valid_service_classes))
    )

    target_groups = fields.List(
        fields.String(
            metadata={'description': "Target groups defined using their codes"},
            validate=validate.OneOf(valid_target_groups)
        ),
        required=False,
        validate=validate.Length(1, len(valid_target_groups))
    )

    service_collections = fields.List(
        fields.String(
            metadata={'description': "Service collections defined using their IDs"},
        ),
        required=False,
        validate=validate.Length(min=1)
    )

    rerank = StrictBoolean(
        metadata={'description': "Rerank the recommendations based on feedback from users"},
        required=False,
        dump_default=False
    )

    funding_type = fields.List(
        fields.String(
            metadata={'description': "Funding type of service"},
            validate=validate.OneOf(valid_funding_types)
        ),
        required=False,
        validate=validate.Length(1, len(valid_funding_types))
    )

    wellbeing_service_county_codes = fields.List(
        fields.String(
            metadata={
                'description': "Wellbeing service county (Hyvinvointialue) as a code defined in stat.fi from where "
                               "the recommendations are given."},
            validate=validate.OneOf(wellbeing_service_county_codes.valid_county_codes)
        ),
        required=False,
        validate=validate.Length(1, len(wellbeing_service_county_codes.valid_county_codes))
    )


class LifeSituationMeterInput(Schema):
    session_id = fields.String(metadata={'description': "ID of the session"}, required=False)

    limit = fields.Int(
        metadata={'description': "Number of recommended services to return. Defaults to 5."},
        required=False,
        validate=validate.Range(min=1, max=50),
        strict=True
    )

    rerank = StrictBoolean(
        metadata={'description': "Rerank the recommendations based on feedback from users"},
        required=False,
        dump_default=False
    )

    service_filters = fields.Nested(
        ServiceFiltersSchema,
        metadata={'description': "Filter the services included in recommendations."},
        required=False
    )

    life_situation_meters = fields.Nested(
        LifeSituationMetersSchema,
        metadata={'description': "Life Situation Meters as defined in 3X10D"},
        required=True,
        error_messages={"required": "life_situation_meters is required."}
    )

    @post_load
    # pylint: disable=R0201
    def create_parameters_object(self, data, **_):
        return Recommender3x10dParameters(data)


class RedirectInput(Schema):
    service_id = fields.String(metadata={'description': "PTV service ID"}, required=True)
    service_channel_id = fields.String(metadata={'description': "PTV service channel ID"}, required=True)
    session_id = fields.String(metadata={'description': "Session ID for session transfer"}, required=False)
    recommendation_id = fields.Int(metadata={'description': "ID of the recommendation"}, required=True)
    link_id = fields.Int(
        metadata={'description': "Link ID number"},
        required=True,
        validate=validate.Range(min=0, max=30)
    )
    auroraai_access_token = fields.String(
        metadata={'description': "Access token for session transfer"},
        required=False
    )

    @validates_schema
    # pylint: disable=R0201
    def validate_service_id(self, data, **_):
        validate_uuid_field(data, 'service_id')

    @validates_schema
    # pylint: disable=R0201
    def validate_service_channel_id(self, data, **_):
        try:
            uuid = UUID(str(data['service_channel_id']), version=4)
        except Exception as error:
            raise ValidationError(
                'service_channel_id must be a valid UUIDv4 identifier') from error
        if not str(uuid) == data['service_channel_id']:
            raise ValidationError(
                'service_channel_id must be a valid UUIDv4 identifier')


class TextSearchInput(Schema):
    search_text = fields.String(
        validate=validate.Length(min=1, max=1024),
        required=True
    )

    service_filters = fields.Nested(
        ServiceFiltersSchema,
        metadata={'description': "Filter the services included in recommendations."},
        required=False
    )

    limit = fields.Int(
        metadata={'description': "Limit the number of returned results"},
        required=False,
        validate=validate.Range(min=1, max=50),
        strict=True
    )

    rerank = StrictBoolean(
        metadata={'description': "Rerank the recommendations based on feedback from users"},
        required=False,
        dump_default=False
    )

    language = fields.String(
        validate=validate.OneOf(VALID_LANGUAGES),
        required=False
    )

    @post_load
    # pylint: disable=R0201
    def create_parameters_object(self, data, **_):
        return RecommenderTextSearchParameters(data)


class ServiceChannel(Schema):
    service_channel_id = fields.String(metadata={'description': "ID of the service channel in PTV."}, required=True)
    service_name = fields.String(metadata={'description': 'Name of the serivce channel.'}, required=True)
    service_channel_description_summary = fields.String(metadata={'description': 'Service channel description summary'})


class RecommendedService(Schema):
    service_id = fields.String(metadata={'description': "ID of the service in PTV."}, required=True)
    service_name = fields.String(metadata={'description': 'Name of the serivce.'}, required=True)
    service_channels = fields.List(
        fields.Nested(ServiceChannel),
        metadata={'description': 'Information about service channels for the service'}
    )


class SearchResultService(Schema):
    service_id = fields.String(metadata={'description': "ID of the service in PTV."}, required=True)
    service_name = fields.String(metadata={'description': 'Name of the service.'}, required=True)
    similarity_score = fields.Float(
        metadata={'description': 'Similarity score describing how well this service matches given text input'}
    )
    service_channels = fields.List(
        fields.Nested(ServiceChannel),
        metadata={'description': 'Information about service channels for the service'}
    )


class AuroraApiOutput(Schema):
    recommended_services = fields.List(
        fields.Nested(RecommendedService),
        metadata={'description': 'List of recommended services.'},
        required=True
    )

    auroraai_recommendation_id = fields.Int(
        metadata={'description': f'Id to identify individual recommendation given by Aurora AI. '
                                 f'This should be used when giving feedback on recommendations '
                                 f'on service feedback endpoint.'},
        required=True
    )


class ServiceFeedback(Schema):
    service_id = fields.String(
        metadata={'description': "ID of the service in PTV as UUIDv4 identifier."},
        required=True
    )
    feedback_score = fields.Int(
        metadata={'description': f'Feedback from this specific service as a recommendation. '
                                 f'+1 for positive feedback, -1 for negative feedback'},
        required=True,
        validate=validate.OneOf(VALID_FEEDBACK_SCORES)
    )

    @validates_schema
    # pylint: disable=R0201
    def validate_service_id(self, data, **_):
        validate_uuid_field(data, 'service_id')


class RecommendationFeedback(Schema):
    auroraai_recommendation_id = fields.Int(
        metadata={'description': f'Id to identify individual recommendation given by Aurora AI'},
        required=True,
        strict=True
    )
    feedback_score = fields.Int(
        metadata={'description': f'Overall feedback from given recommendations. +1 for positive feedback, '
                                 f'-1 for negative feedback'},
        required=False,
        validate=validate.OneOf(VALID_FEEDBACK_SCORES)
    )
    service_feedbacks = fields.List(
        fields.Nested(ServiceFeedback),
        metadata={'description': f'Feedbacks from individual services as recommendation'},
        required=False
    )


class UserAttributeValues(Schema):
    age = fields.Int(
        metadata={'description': "Age"},
        required=False,
        validate=validate.Range(min=0, max=200),
        strict=True
    )

    life_situation_meters = fields.Nested(
        LifeSituationMetersSchema,
        metadata={'description': "Life Situation Meters as defined in 3X10D"},
        required=False
    )

    municipality_code = fields.String(
        metadata={'description': "Municipality as a code defined in koodistot.suomi.fi"},
        required=False,
        validate=validate.OneOf(municipality_data.valid_municipality_codes
                                ))

    @validates_schema
    def validate_some_field_present(self, data, **_):
        if not any(field in data for field in self.fields):
            raise ValidationError('some field should be present')


class PostSessionAttributesInput(Schema):
    service_channel_id = fields.String(
        metadata={'description': "Service channel id from PTV to which service send the attributes"},
        required=True
    )

    service_id = fields.String(
        metadata={'description': "Service id from PTV to which service send the attributes"},
        required=False
    )

    auroraai_recommendation_id = fields.Int(
        metadata={'description': "Recommendation id related to this session transfer."},
        required=False,
        strict=True,
        validate=validate.Range(min=0)
    )

    session_attributes = fields.Nested(
        UserAttributeValues,
        metadata={'description': "Attributes to send"},
        required=True
    )

    @validates_schema
    # pylint: disable=R0201
    def validate_service_id_is_given_with_recommendation_id(self, data, **_):
        if data.get('auroraai_recommendation_id') is not None and data.get('service_id') is None:
            raise ValidationError('service_id not provided with recommendation_id')

    @validates_schema
    # pylint: disable=R0201
    def validate_uuids(self, data, **_):
        validate_uuid_field(data, 'service_channel_id')
        if data.get('service_id') is not None:
            validate_uuid_field(data, 'service_id')


class SearchTextTranslation(Schema):
    source_language = fields.String(
        validate=validate.OneOf(VALID_LANGUAGES),
        required=True
    )

    search_text = fields.String(
        validate=validate.Length(min=1, max=1024),
        required=True
    )


class PtvServiceTranslation(Schema):
    target_language = fields.String(
        validate=validate.OneOf(VALID_LANGUAGES),
        required=True
    )

    service_id = fields.String(
        validate=validate.Length(min=1, max=1024),
        required=True
    )


def validate_uuid_field(data, field_name: str):
    try:
        uuid = UUID(str(data.get(field_name)), version=4)
    except Exception as error:
        raise ValidationError(
            f'{field_name} must be a valid UUIDv4 identifier') from error
    if str(uuid) != str(data.get(field_name)):
        raise ValidationError(f'{field_name} must be a valid UUIDv4 identifier')


example_input = {'municipality': 'Helsinki', "limit": 5, "session_id": "xyz-123",
                 "life_situation_meters": {
                     "working_studying": [0],
                     "family": [5],
                     "friends": [5],
                     "health": [7],
                     "improvement_of_strengths": [5],
                     "housing": [5],
                     "finance": [9],
                     "self_esteem": [5],
                     "resilience": [5],
                     "life_satisfaction": [5]
                 }}

# register schemas with spec
spec.components.schema(
    "Input",
    schema=LifeSituationMeterInput,
    description='Information of the subject who is given the recommendations',
    example=example_input
)

spec.components.schema(
    "Output",
    schema=AuroraApiOutput,
    description='Recommended services'
)

spec.components.schema(
    'UserAttributeValues',
    schema=UserAttributeValues,
    description='User attribute values'
)

spec.components.schema(
    'PostSessionAttributesInput',
    schema=PostSessionAttributesInput
)

# add swagger tags that are used for endpoint annotation
tags = [{
    'name': 'Service recommendation',
    'description': 'For recommending services from PTV'
}]

for tag in tags:
    log.debug(f"Adding tag: {tag['name']}")
    spec.tag(tag)
