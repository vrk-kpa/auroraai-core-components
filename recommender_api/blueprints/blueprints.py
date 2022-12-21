import urllib.parse as urlparse
from urllib.parse import urlencode

import base64
import requests
from flask import Blueprint, current_app, jsonify, make_response, request, redirect
from marshmallow import ValidationError
from werkzeug.exceptions import Unauthorized, InternalServerError

from xgboost.sklearn import XGBRanker

from recommender_api import db
from recommender_api import profile_management, service_recommender
from recommender_api.api_spec import \
    AuroraApiOutput, LifeSituationMeterInput, PostSessionAttributesInput, \
    RecommendationFeedback, TextSearchInput, RedirectInput, SearchTextTranslation, PtvServiceTranslation
from recommender_api.profile_management import ProfileManagementApiError
from recommender_api.ptv import get_service_channel_web_pages, get_format_service_data
from recommender_api.service_recommender import text_search_in_ptv, set_redirect_urls, create_redirect_link
from recommender_api.translation import translate_service_information, translate_text

from recommender_api.tools.config import config
from recommender_api.tools.logger import log


recommendation_blueprint = Blueprint(
    name="recommendation_blueprint", import_name=__name__)

profile_management_url = config['profile_management_api_url']

no_authorization_endpoints = [
    "recommendation_blueprint.get_session_attributes",
    "recommendation_blueprint.service_redirect"
]


@recommendation_blueprint.after_request
def finalise_logs(response):
    log.technical.response(response)
    log.flush()
    return response


@recommendation_blueprint.before_request
def prepare_request():
    try:
        _authorize()
        log.technical.request(request)
        log.audit.request(request)

        _init_xgboost(current_app)

    except UnicodeDecodeError as error:
        log.technical.error(str(error))
        return "Invalid encoding in request. Only UTF-8 is supported.", 400
    except Unauthorized as error:
        log.technical.error(error.description)
        return "Unauthorized", 401, {"WWW-Authenticate": 'Authorization realm="Service recommender API"'}
    except InternalServerError as error:
        log.technical.error(error.description)
        return "InternalServerError", 500


def _authorize():
    if config['require_api_auth'] == 'false':
        request.calling_organisation = ''
        request.calling_service = ''
        return

    # do not require api key for defined routes
    if request.endpoint in no_authorization_endpoints:
        return

    try:
        authorization_header = request.headers.get('Authorization')
        client_id = _parse_client_id(authorization_header)
        client_info = profile_management.get_client_info(authorization_header)
    except (requests.exceptions.ConnectionError, requests.exceptions.ConnectTimeout) as err:
        raise InternalServerError('Internal server error') from err
    except (requests.exceptions.RequestException, ValidationError) as err:
        raise Unauthorized('Not authorized') from err

    log.audit.info('client_id', client_id)
    request.calling_organisation = client_info['provider']['fi']
    request.calling_service = client_info['name']['fi']


def _parse_client_id(authorization_header):
    try:
        return base64.b64decode(authorization_header.split(' ')[1]).decode('utf-8')
    except (ValueError, AttributeError, IndexError) as error:
        raise ValidationError('Invalid Base64 string') from error


def _init_xgboost(app):
    if not hasattr(current_app, 'xgboost_model') or current_app.xgboost_model is None:
        try:
            log.debug("Init XGBoost model.")
            booster = XGBRanker()
            booster.load_model(f'recommender_api/xgboost/{config["xgboost_model_file"]}')
            app.xgboost_model = booster
        except (ValueError, FileNotFoundError, TypeError) as e:
            raise InternalServerError("Failed to load XGBoost model.") from e


@recommendation_blueprint.route("/random_service")
def db_rand():
    return jsonify({
        "service": db.get_random_services()
    })


@recommendation_blueprint.route("/recommend_service", methods=['POST'])
def recommend_service():
    req_data = request.get_json()
    try:
        body_object = LifeSituationMeterInput().load(req_data)
    except ValidationError as err:
        error_message = f'Validation error in request data: {err}'
        log.technical.error(error_message)
        return error_message, 400
    except InternalServerError as err:
        error_message = f'Error in request: {err}'
        log.technical.error(error_message)
        return error_message, 500

    recommended_services = service_recommender.recommend(
        body_object,
        current_app.xgboost_model,
        request.calling_service,
        request.path
    )
    session_id = body_object.session_id

    recommendation_id = db.store_recommendations_db(
        [service['service_id'] for service in recommended_services],
        request
    )

    recommended_services = set_redirect_urls(
        recommendation_id, session_id, recommended_services)

    try:
        profile_management.add_session_transfer_indicator(recommended_services)
    except requests.exceptions.RequestException as err:
        error_message = f'Error in session transfer support: {err}'
        log.technical.error(error_message)
        return error_message, 500

    resp = {"recommended_services": recommended_services,
            "auroraai_recommendation_id": recommendation_id}
    AuroraApiOutput().validate(resp)
    return jsonify(resp)


@recommendation_blueprint.route("/redirect")
def service_redirect():
    req_query = request.values
    try:
        query_params = RedirectInput().load(req_query)
    except ValidationError as err:
        error_message = f'Validation error in request query params: {err}'
        log.technical.error(error_message)
        return error_message, 400

    service_id = query_params.get('service_id')
    service_channel_id = query_params.get('service_channel_id')
    link_id = query_params.get('link_id')
    recommendation_id = query_params.get('recommendation_id')
    session_id = query_params.get('session_id')
    auroraai_access_token = query_params.get('auroraai_access_token')

    try:
        web_pages = get_service_channel_web_pages(service_channel_id)
    except IndexError:
        return "Invalid redirect link", 404
    if link_id >= len(web_pages):
        return "Invalid redirect link", 404

    # store in db
    try:
        db.store_redirect(recommendation_id, service_id, service_channel_id, auroraai_access_token)
    except db.InvalidRedirectException:
        return "Invalid redirect link", 404

    params = {
        'session_id': session_id,
        'auroraai_access_token': auroraai_access_token
    }
    # Remove params with empty value and encode the rest
    params = urlencode({k: params[k] for k in params if params[k]})

    link = f'{web_pages[link_id]}?{params}' if params else web_pages[link_id]
    return redirect(link)


@recommendation_blueprint.route("/text_search", methods=['POST'])
def text_search():
    req_data = request.get_json()
    try:
        body_object = TextSearchInput().load(req_data)
    except ValidationError as err:
        error_message = f'Validation error in request data: {err}'
        log.technical.error(error_message)
        return error_message, 400
    except InternalServerError as err:
        error_message = f'Error in request: {err}'
        log.technical.error(error_message)
        return error_message, 500

    recommended_services = text_search_in_ptv(
        body_object,
        current_app.fasttext_embeddings,
        current_app.fasttext_model,
        current_app.xgboost_model,
        request.calling_service,
        request.path
    )

    recommendation_id = db.store_recommendations_db(
        [service['service_id'] for service in recommended_services],
        request
    )

    recommended_services = set_redirect_urls(
        recommendation_id, None, recommended_services)

    try:
        profile_management.add_session_transfer_indicator(recommended_services)
    except requests.exceptions.RequestException as err:
        error_message = f'Error in session transfer support: {err}'
        log.technical.error(error_message)
        return error_message, 500

    return jsonify({
        "recommended_services": recommended_services,
        "auroraai_recommendation_id": recommendation_id
    })


@recommendation_blueprint.route("/translation/search_text", methods=['POST'])
def translate_search_text():
    if 'translate_api' not in config['feature_flags']:
        return 'Not found.', 404

    req_data = request.get_json()
    try:
        SearchTextTranslation().load(req_data)
    except ValidationError as err:
        error_message = f'Validation error in request data: {err}'
        log.technical.error(error_message)
        return error_message, 400

    search_text: str = req_data['search_text']
    source_language: str = req_data['source_language']
    translated_search_text = translate_text(search_text, source_language, 'fi')

    return jsonify({
        "target_language": "fi",
        "search_text": translated_search_text
    })


@recommendation_blueprint.route("/translation/ptv_service", methods=['POST'])
def translate_ptv_service():
    if 'translate_api' not in config['feature_flags']:
        return 'Not found.', 404

    req_data = request.get_json()
    try:
        PtvServiceTranslation().load(req_data)
    except ValidationError as err:
        error_message = f'Validation error in request data: {err}'
        log.technical.error(error_message)
        return error_message, 400

    service_id: str = req_data['service_id']
    target_language: str = req_data['target_language']
    try:
        service_data = get_format_service_data([service_id])[0]
    except IndexError:
        return 'Service not found', 404

    translated_service = translate_service_information(service_data, 'fi', target_language)

    return jsonify({
        "target_language": target_language,
        "service": translated_service
    })


@recommendation_blueprint.route("/recommendation_feedback", methods=['POST'])
def recommendation_feedback():
    req_data = request.get_json()
    try:
        RecommendationFeedback().load(req_data)
    except ValidationError as err:
        error_message = f'Validation error in request data: {err}'
        log.technical.error(error_message)
        return error_message, 400

    recommendation_id = req_data['auroraai_recommendation_id']
    feedback_score = req_data.get('feedback_score')
    service_feedbacks = req_data.get('service_feedbacks')
    try:
        db.store_feedback(recommendation_id, feedback_score, service_feedbacks)
    except db.InvalidRecommendationIdException as ex:
        return str(ex), 404
    except db.InvalidServiceIdException as ex:
        return str(ex), 404
    return "OK"


def _cross_origin(*response_content):
    response = make_response(*response_content)
    response.access_control_allow_origin = '*'
    response.access_control_allow_headers = ['Content-Type']
    return response


def _data_validation_error(*response_content):
    response = make_response(*response_content)
    response.headers['Content-Type'] = 'text/plain'
    return response


@recommendation_blueprint.route("/session_attributes", methods=['OPTIONS'])
def return_attributes_options():
    return _cross_origin('OK')


@recommendation_blueprint.route("/session_attributes", methods=['GET'])
def get_session_attributes():
    access_token = request.args.get('access_token')
    if not access_token:
        error_message = f'access_token is a required parameter'
        return _cross_origin(error_message, 400)
    url = f'{profile_management_url}/v1/session_attributes?access_token={access_token}'
    headers = {
        'authorization': f'Key {profile_management.get_profile_management_api_key()}'}
    try:
        response = requests.get(url, headers=headers)
    except IOError as error:
        log.audit.error(f'{error}')
        return _cross_origin("Server side error", 500)

    try:
        response.raise_for_status()
        return _cross_origin(response.json())
    except requests.exceptions.HTTPError as error:
        log.audit.error(f'{error}')
        if response.status_code == 400:
            return _cross_origin("Invalid access token format", response.status_code)
        if response.status_code == 404:
            return _cross_origin("Access token does not exist", response.status_code)
        return _cross_origin("Error", response.status_code)


@recommendation_blueprint.route("/session_attributes", methods=['POST'])
def add_session_attributes():
    try:
        req_data = request.get_json()
        recommendation_id = req_data.get('auroraai_recommendation_id')
        service_id = req_data.get('service_id')
        service_channel_id = req_data.get('service_channel_id')

        PostSessionAttributesInput().load(req_data)

        response = profile_management.post_session_attributes(req_data['session_attributes'], service_channel_id)
        access_token = response.get('accessToken')

        if None in [recommendation_id, service_id]:
            return _add_access_token_to_url(get_service_channel_web_pages(service_channel_id)[0], access_token)

        return create_redirect_link(
            recommendation_id,
            service_id,
            service_channel_id,
            0,
            auroraai_access_token=access_token
        )

    except ValidationError as err:
        error_message = f'Validation error in request data: {err}'
        log.technical.error(error_message)
        return _data_validation_error(error_message, 400)

    except IOError as error:
        log.audit.error(f'{error}')
        return _cross_origin("Server side error", 500)

    except ProfileManagementApiError as error:
        log.audit.error(f'{error}')
        return _cross_origin(error.message, error.http_status)

    except IndexError as error:
        log.audit.error(f'{error}')
        return _cross_origin("No web page found for channel.", 404)


def _add_access_token_to_url(url: str, access_token: str):
    if not access_token:
        return url

    url_parts = list(urlparse.urlparse(url))
    query = dict(urlparse.parse_qsl(url_parts[4]))
    query.update({'auroraai_access_token': access_token})

    url_parts[4] = urlencode(query)
    return urlparse.urlunparse(url_parts)
