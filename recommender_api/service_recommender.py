import re
from statistics import geometric_mean
from typing import Dict, Any, List, Union

import pandas as pd
import numpy as np
import numpy.typing as npt
import torch
from numpy import dot
from numpy.linalg import norm

from rank_bm25 import BM25Okapi

from tools.logger import log
from tools.config import config

from recommender_api.db import get_service_vectors, get_filtered_service_ids, \
    get_service_class_names, get_service_descriptions, \
    get_redirects_and_feedback
from recommender_api.municipality_data import MOCK_SERVICE_MUNICIPALITY
from recommender_api.ptv import get_format_service_data
from recommender_api.mock_session_service import mock_service_results
from recommender_api.recommender_input import Recommender3x10dParameters, RecommenderTextSearchParameters

MIN_SIMILARITY = 1e-4  # geometric mean is defined for positive numbers

LIFE_SITUATION_METERS = ['working_studying',  # opiskelu tai työ
                         'family',  # perhe
                         'friends',  # ystävät
                         'health',  # terveys
                         'improvement_of_strengths',  # itsensä kehittäminen
                         'housing',  # asuminen
                         'finance',  # raha-asiat
                         'self_esteem',  # itsetunto
                         'resilience',  # vaikeuksien voittaminen
                         'life_satisfaction'  # tyytyväisyys elämään
                         ]

LS_METER_SEARCH = {'working_studying': 'koulu tukiopetus preppauskurssit arvosana mentorointi opintoneuvonta '
                                       'koulunkäyntiavustaja oppilaanohjaus erityisopetus ammatinvalinta '
                                       'tulevaisuudensuunnitelma',
                   'family': 'perhe perhesuhteet perheneuvonta perheterapia isä äiti vanhemmat sisarukset',
                   'friends': 'yksinäisyys ystävät kaverit kaveripiiri vertaistuki',
                   'health': 'sairaanhoito terveydenhuolto hammashoito taudit terveys terveystieto yleiskunto '
                             'liikunta ruokavalio lihominen ylipaino',
                   'improvement_of_strengths': 'kehittäminen harrastukset harrastustoiminta harrastusmahdollisuus '
                                               'taide taideopetus kuvataide musiikki yhdistykset urheilu liikunta '
                                               'työnhakutaito päätöksenteko',
                   'housing': 'asuminen asunto asuinpaikka asunto asuntola takuuvuokra',
                   'finance': 'raha velkaneuvonta köyhyys rahapula toimeentulotuki maksuhäiriö, '
                              'elämänhallinta vähävarainen',
                   'self_esteem': 'itsetunto harrastukset koulupsykologi tukihenkilö',
                   'resilience': 'vaikeus voittaminen psykologi motivaatio valmennus',
                   'life_satisfaction': 'tyytyväisyys elämä mielenterveys masennus ahdistus'}

CHANNEL_TYPE_FOR_SESSION_ID = 'EChannel'
ERROR_NO_VECTORS = 'No service vectors found with given input.'

RERANKER_FEATURES = [
    'bm25_score',
    'calling_service',
    'prev_neg_feedback_service',
    'prev_pos_feedback_service',
    'prev_redirects_service',
    'request_path',
    'service_class_name',
    'similarity'
]

RERANKER_DTYPE = {
    'bm25_score':                'float32',
    'calling_service':           'category',
    'prev_neg_feedback_service': 'int32',
    'prev_pos_feedback_service': 'int32',
    'prev_redirects_service':    'int32',
    'request_path':              'category',
    'service_class_name':        'category',
    'similarity':                'float32'
}


def find_similar_services(similarity_df: pd.DataFrame, weight: float = 1.0) -> pd.Series:
    document_mean = similarity_df.groupby(level='id').mean()
    document_mean.columns = ['doc']
    best_sent_doc = similarity_df.groupby(level='id').max()
    best_sent_doc.columns = ['max']
    weighted = document_mean.join(best_sent_doc)
    weighted['weighted'] = weighted['doc'] * \
        (1 - weight) + weighted['max'] * weight
    weighted = weighted.sort_values(
        by='weighted', ascending=False, kind='mergesort')
    return weighted['weighted']


def _filter_fast_text_embeddings(
        embeddings: Dict[str,  Union[List, np.ndarray]],
        municipality_codes: List[str],
        include_national: bool,
        service_classes: List[str],
        target_groups: List[str],
        service_collections: List[str],
        funding_type: List[str]
):
    service_ids_from_db = set(get_filtered_service_ids(  # type: ignore
        municipality_codes,
        include_national,
        service_classes,
        target_groups,
        service_collections,
        funding_type
    ))

    # When filtering the service-ids and embedding-values in the input dict, the order of items must not change.
    zipped_embeddings = [
        (service_id, value) for service_id, value in zip(embeddings['ids'], embeddings['values'])
        if service_id in service_ids_from_db
    ]

    if not zipped_embeddings:
        return None, None

    filtered_service_ids, filtered_embeddings = zip(*zipped_embeddings)

    return list(filtered_service_ids), np.stack(filtered_embeddings)


def compute_redirect_data(service_id_list: List[str], feedback_data: pd.DataFrame) -> pd.DataFrame:
    redirects = feedback_data[['recommendation_id', 'service_id',
                               'redirect_time']].dropna().copy()
    redirects = redirects[['recommendation_id', 'service_id']].drop_duplicates()\
                .groupby(['service_id']).count()\
                .rename(columns={"recommendation_id": "prev_redirects_service"}).reset_index()

    # join with service ids and fillna with 0
    redirects = pd.DataFrame(service_id_list, columns=['service_id'])\
                .merge(redirects, how="left").fillna(0)
    return redirects

def compute_feedback_data(service_id_list: List[str],
                          score: int,
                          feedback_data: pd.DataFrame) -> pd.DataFrame:

    feedback_data = feedback_data[feedback_data.redirect_time.isnull()]\
                   [['recommendation_id', 'service_id', 'feedback_score']]\
                   .dropna().copy()
    feedback_data = feedback_data.drop_duplicates(subset=['recommendation_id', 'service_id'],
                                                  keep="last")\
                   .query("feedback_score == @score")

    if score == 1:
        feedback_data = feedback_data.groupby(['service_id'])['feedback_score'].sum().reset_index()
        feedback_data.rename(columns={'feedback_score': 'prev_pos_feedback_service'}, inplace=True)
    elif score == -1:
        feedback_data['feedback_score'] = feedback_data['feedback_score'].replace(-1, 1)
        feedback_data = feedback_data.groupby(['service_id'])['feedback_score'].sum().reset_index()
        feedback_data.rename(columns={'feedback_score': 'prev_neg_feedback_service'}, inplace=True)

    # join with service ids and fillna with 0
    feedback_data = pd.DataFrame(service_id_list, columns=['service_id'])\
                    .merge(feedback_data, how="left").fillna(0)

    return feedback_data


def reranked(
    result: List[Dict[str, Any]],
    reranker: Any
) -> List[Dict[str, Any]]:
    data = pd.DataFrame.from_records(result, columns=RERANKER_FEATURES)
    data = data.astype(dtype=RERANKER_DTYPE)  # convert to types that model requires
    pred = reranker.predict(data)
    for i, item in enumerate(result):
        item['pred'] = pred[i]
        item['similarity'] = np.max([item['similarity'], MIN_SIMILARITY])
        item['pred'] = np.max([item['pred'], MIN_SIMILARITY])
        item['geomean'] = geometric_mean([item['similarity'], item['pred']])
    sorted_result = sorted(result, key=lambda x: x['geomean'], reverse=True)
    # add rank and delete temporary data
    for i, res in enumerate(sorted_result):
        res['rank'] = i + 1
        res.pop('pred')
        res.pop('geomean')
        for feature in RERANKER_FEATURES:
            res.pop(feature)
    return sorted_result


def bm25_score(tokenized_descriptions: List[List[str]], tokenized_query: List[str]) -> npt.NDArray:
    n_desc = len(tokenized_descriptions)
    bm25_scores = np.zeros(n_desc)
    nothing_missing = all(map(lambda x: x != '', tokenized_descriptions))
    if tokenized_descriptions and nothing_missing:
        bm25 = BM25Okapi(tokenized_descriptions)
        bm25_scores = bm25.get_scores(tokenized_query)
    return bm25_scores


def process(text:str) -> List[str]:
    text = text.replace('\n', '').replace('\r', '').strip().lower()
    text = re.sub(r'(?=[-,.:;/\)*\?])(?=[^\s])', r' ', text)
    text = re.sub(r'(?<=[-.\(/])(?=[^\s])', r' ', text)
    return text.split(' ')


def join_service_descriptions(meta_data: List[Dict[str, Any]]) -> List[str]:
    result = [
        f'{item["service_description"]} {item["description_summary"]} {item["user_instruction"]}'
        for item in meta_data
    ]
    return result


def text_search_in_ptv(
        params: RecommenderTextSearchParameters,
        ptv_embeddings: Dict[str,  Union[List, np.ndarray]],
        model: Any,
        reranker: Any,
        calling_service: str,
        request_path: str
) -> List[Dict[str, Any]]:

    service_ids, embeddings = _filter_fast_text_embeddings(  # type: ignore
        ptv_embeddings,
        params.municipality_codes,
        params.include_national_services,
        params.service_classes,
        params.target_groups,
        params.service_collections,
        params.funding_type
    )

    if embeddings is None:
        return []  # no services found

    search_text = params.search_text

    embedded_query = model.get_sentence_vector(search_text)
    embedded_query_tensor = torch.tensor(embedded_query)
    ptv_embeddings_tensor = torch.tensor(embeddings)
    similarities = torch.cosine_similarity(
        embedded_query_tensor, ptv_embeddings_tensor)

    top_count = min(params.limit, len(similarities))
    torch_top = torch.topk(similarities, k=top_count)
    top_ids = [service_ids[i] for i in torch_top[1]]
    similarity_scores = torch_top[0]
    log.debug(f'recommending service ids: {top_ids}')
    log.debug(f'and their scores: {similarity_scores.tolist()}')
    service_meta_data = get_format_service_data(top_ids)

    # put items back to original order of decreasing similarity
    result = sorted(service_meta_data, key=lambda x: top_ids.index(
        x['service_id']), reverse=False)
    # and augment each item by adding the score
    for i, service in enumerate(result):
        service['similarity_score'] = similarity_scores[i].item()
    # compute new order when requested by the user
    if params.rerank:
        result = add_reranker_features_for_text_search(
            result,
            calling_service,
            request_path,
            service_meta_data,
            params
        )
        return reranked(result, reranker)
    for i, res in enumerate(result):
        res['rank'] = i + 1
    return result


def add_reranker_features_for_text_search(
        result: List[Dict[str, Any]],
        calling_service: str,
        request_path: str,
        service_meta_data: List[Dict[str, Any]],
        params: RecommenderTextSearchParameters
) -> List[Dict[str, Any]]:

    service_id_list: List[str] = [value for res in result if (value := res.get('service_id')) is not None]
    service_descriptions: Dict[str, Dict[str, str]] = get_service_descriptions(service_id_list)
    for item in service_meta_data:
        service_id = service_descriptions.get(item['service_id'], None)
        if service_id:
            service_description: str = service_id.get('service_description', '')
            service_summary: str = service_id.get('description_summary', '')
            service_instruction: str = service_id.get('user_instruction', '')
            item['service_description'] = service_description
            item['description_summary'] = service_summary
            item['user_instruction'] = service_instruction

    service_class_names = get_service_class_names(service_id_list)

    tokenized_query = process(params.search_text)
    descriptions = join_service_descriptions(service_meta_data)
    tokenized_descriptions = [process(desc) for desc in descriptions]
    bm25_scores = bm25_score(tokenized_descriptions, tokenized_query)

    feedback_data = get_redirects_and_feedback(service_id_list, calling_service)
    redirects = compute_redirect_data(service_id_list, feedback_data)
    neg_feedback = compute_feedback_data(service_id_list, -1, feedback_data)
    pos_feedback = compute_feedback_data(service_id_list, 1, feedback_data)

    for i, item in enumerate(result):
        item['calling_service'] = calling_service
        item['bm25_score'] = bm25_scores[i]
        item['prev_neg_feedback_service'] = neg_feedback['prev_neg_feedback_service'][i]
        item['prev_pos_feedback_service'] = pos_feedback['prev_pos_feedback_service'][i]
        item['prev_redirects_service'] = redirects['prev_redirects_service'][i]
        item['request_path'] = request_path
        item['service_class_name'] = service_class_names.get(item['service_id'])
        item['similarity'] = item.get('similarity_score')

    return result

def recommend(params: Recommender3x10dParameters,
              reranker: Any,
              calling_service: str,
              request_path: str
) -> List[Dict[str, Any]]:

    log.debug(f'Recommending {params.limit} service with ls meters: {params.life_situation_meters}, '
              f'municipalities {params.municipality_codes}')

    if params.municipality_codes == [MOCK_SERVICE_MUNICIPALITY]:
        log.debug(f'Giving mock service')
        recommended_services_ids, formatted_results = mock_service_results()
    else:
        service_vectors = get_service_vectors(
            params.municipality_codes,
            params.include_national_services,
            params.service_classes,
            params.target_groups,
            params.service_collections,
            params.funding_type
        )

        if len(service_vectors) == 0:
            log.technical.error(
                f'No service vectors! Municipalities: {params.municipality_codes}, '
                f'service-classes: {params.service_classes}!'
            )
            formatted_results = []

        else:
            similarities = calculate_similarities(service_vectors, params.life_situation_meters)
            recommended_services_ids = similarities.index[0:params.limit]

            formatted_results = get_format_service_data(
                list(recommended_services_ids))

            for service_item in formatted_results:
                service_item['similarity_score'] = similarities.loc[service_item.get(
                    'service_id')]

            formatted_results = sorted(formatted_results,
                                       key=lambda service_item: similarities.index.get_loc(
                                           service_item.get('service_id')
                                       ),
                                       reverse=False)

    if params.rerank:
        formatted_results = add_reranker_features_for_recommend(
            formatted_results,
            calling_service,
            request_path
        )
        return reranked(formatted_results, reranker)
    for i, res in enumerate(formatted_results):
        res['rank'] = i + 1
    return formatted_results


def add_reranker_features_for_recommend(
        formatted_results: List[Dict[str, Any]],
        calling_service: str,
        request_path: str
) -> List[Dict[str, Any]]:

    service_id_list: List[str] = [value for res in formatted_results
                                  if (value := res.get('service_id')) is not None]
    # get historical redirects and feedback, filtered by service_ids and calling_service
    feedback_data = get_redirects_and_feedback(service_id_list, calling_service)

    # compute redirect and feedback features
    redirects = compute_redirect_data(service_id_list, feedback_data)
    pos_feedback = compute_feedback_data(service_id_list, 1, feedback_data)
    neg_feedback = compute_feedback_data(service_id_list, -1, feedback_data)

    service_class_names = get_service_class_names(service_id_list)

    # append to results
    for i, res in enumerate(formatted_results):
        res['calling_service'] = calling_service
        res['bm25_score'] = np.nan
        res['prev_neg_feedback_service'] = neg_feedback['prev_neg_feedback_service'][i]
        res['prev_pos_feedback_service'] = pos_feedback['prev_pos_feedback_service'][i]
        res['prev_redirects_service'] = redirects['prev_redirects_service'][i]
        res['request_path'] = request_path
        res['service_class_name'] = service_class_names.get(res['service_id'])
        res['similarity'] = res.get('similarity_score')

    return formatted_results

def calculate_similarities(
        service_vectors: pd.DataFrame,
        life_situation_meters: Dict[str, List[int]]
):
    log.debug(f'Service vectors: {service_vectors}')
    transformed_meters = transform_ls_meters(life_situation_meters, service_vectors.columns.values)
    log.debug(f'Transformed meters: {transformed_meters}')

    relevant_service_vectors = remove_irrelevant_service_vector_elements(service_vectors, transformed_meters.columns)

    # cosine similarity calculation in form dot(A, b)/(norm(A)*norm(b)),
    # where A is the service vector matrix, and b is the query vector
    A = relevant_service_vectors.values
    b = transformed_meters.iloc[0]
    similarities = dot(A, b) / (norm(A, axis=1) * norm(b))
    similarities = pd.Series(similarities, index=relevant_service_vectors.index)
    similarities.sort_values(ascending=False, inplace=True)
    return similarities


def remove_irrelevant_service_vector_elements(service_vectors: pd.DataFrame, input_columns):
    """
    Remove service vector columns that are not found in user input and then rows that are all zeros.
    Raise ValueError if no service vectors are left.
    """
    relevant_service_vectors = service_vectors[input_columns]
    relevant_service_vectors = relevant_service_vectors.loc[~(relevant_service_vectors == 0).all(axis=1)]

    if len(relevant_service_vectors) == 0:
        raise ValueError(ERROR_NO_VECTORS)

    return relevant_service_vectors


def transform_ls_meters(ls_meters: Dict[str, List[int]], _columns: np.ndarray) -> pd.DataFrame:
    # calculate mean (if more than one value per meter),
    # rescale ls_meters between 0..1 and reverse scale
    # divide by the number 10.1 to avoid zero vectors in
    # the case of a vector with all 10
    transformed_meters = dict()
    for (key, values) in ls_meters.items():
        transformed_meters[key] = 1 - np.mean(values) / 10.1
    # if meter is not given - drop column
    transformed_meters = pd.DataFrame(
        [transformed_meters]).dropna(axis=1, how='all')
    return transformed_meters


def set_redirect_urls(recommendation_id,
                      session_id,
                      formatted_output: List[Dict[str, Any]]
                      ) -> List[Dict[str, Any]]:
    for service_item in formatted_output:
        service_id = service_item.get('service_id')
        for service_channel in service_item.get('service_channels', []):
            service_channel_id = service_channel.get('service_channel_id')
            new_urls = []
            for index, url in enumerate(service_channel.get('web_pages', [])):
                if url != '':
                    link = create_redirect_link(
                        recommendation_id,
                        service_id,
                        service_channel_id,
                        index,
                        session_id=session_id,
                        channel_type=service_channel.get('service_channel_type')
                    )
                    new_urls.append(link)
            service_channel['web_pages'] = new_urls
    return formatted_output


def create_redirect_link(recommendation_id, service_id, service_channel_id,
                         url_index, session_id=None, channel_type=None, auroraai_access_token=None):
    link = f'{config["service_host"]}/service-recommender/v1/redirect' \
           f'?service_id={service_id}' \
           f'&service_channel_id={service_channel_id}' \
           f'&link_id={str(url_index)}' \
           f'&recommendation_id={str(recommendation_id)}'
    # add session id to URL for EChannels
    if session_id and channel_type == CHANNEL_TYPE_FOR_SESSION_ID:
        link = f'{link}&session_id={session_id}'

    if auroraai_access_token is not None:
        link = f'{link}&auroraai_access_token={auroraai_access_token}'

    return link
