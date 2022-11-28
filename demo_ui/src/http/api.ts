import { mapObjIndexed } from 'ramda'
import { RecommendServiceRequestDto } from '../dto/RecommendServiceRequestDto'
import { RecommendationFeedbackRequestDto } from '../dto/RecommendationFeedbackRequestDto'
import { SessionAttributesRequestDto } from '../dto/SessionAttributesRequestDto'
import { TextSearchServiceRequestDto } from '../dto/TextSearchServiceRequestDto'

const BASE_URL = '/ui/api'
const UI_BASE_URL = '/ui'

export const meters = [
  'health',
  'resilience',
  'housing',
  'working_studying',
  'family',
  'friends',
  'finance',
  'improvement_of_strengths',
  'self_esteem',
  'life_satisfaction',
] as const

export type Meter = typeof meters[number]
export type Meters = { [meter in Meter]: number }

export const constructRecommendationPayload = (
  session_id: string,
  meters: Meters,
  include_national_services?: boolean,
  municipality_codes?: string[],
  region_codes?: string[],
  hospital_district_codes?: string[],
  wellbeing_county_codes?: string[],
  service_classes?: string[],
  target_groups?: string[],
  funding_type?: string[],
  limit: number = 10,
) => {
  return {
    session_id,
    life_situation_meters: mapObjIndexed((v) => [v], meters),
    service_filters: {
      include_national_services,
      municipality_codes,
      region_codes,
      hospital_district_codes,
      wellbeing_county_codes,
      service_classes,
      target_groups,
      funding_type,
    },
    limit,
  } as RecommendServiceRequestDto
}

export const fetchRecommendations = (
  session_id: string,
  meters: Meters,
  include_national_services?: boolean,
  municipality_codes?: string[],
  region_codes?: string[],
  hospital_district_codes?: string[],
  wellbeing_county_codes?: string[],
  service_classes?: string[],
  target_groups?: string[],
  funding_type?: string[],
  limit: number = 10,
) => {
  const payload = constructRecommendationPayload(
    session_id,
    meters,
    include_national_services,
    municipality_codes,
    region_codes,
    hospital_district_codes,
    wellbeing_county_codes,
    service_classes,
    target_groups,
    funding_type,
    limit,
  )
  return fetch(`${BASE_URL}/service-recommender/v1/recommend_service`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const sendFeedback = (recommendationID: number, serviceID: string, score?: number, extendedFeedback?: string[]) => {
  const payload: RecommendationFeedbackRequestDto = {
    auroraai_recommendation_id: recommendationID,
    service_feedbacks: [{ service_id: serviceID, feedback_score: score ?? 1, extended_feedback: extendedFeedback }],
  }
  return fetch(`${BASE_URL}/service-recommender/v1/recommendation_feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const fetchTextSearch = (
  session_id: string,
  searchQuery: string,
  include_national_services?: boolean,
  municipality_codes?: string[],
  region_codes?: string[],
  hospital_district_codes?: string[],
  wellbeing_county_codes?: string[],
  service_classes?: string[],
  target_groups?: string[],
  funding_type?: string[],
) => {
  const payload: TextSearchServiceRequestDto = {
    search_text: searchQuery.trim(),
    service_filters: {
      include_national_services,
      municipality_codes,
      region_codes,
      hospital_district_codes,
      wellbeing_county_codes,
      service_classes,
      target_groups,
      funding_type,
    },
  }
  return fetch(`${BASE_URL}/service-recommender/v1/text_search`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const fetchSearchTextTranslation = (searchQuery: string, language: string) => {
  const payload = {
    search_text: searchQuery.trim(),
    source_language: language,
  }
  return fetch(`${BASE_URL}/service-recommender/v1/translation/search_text`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const fetchServiceTranslation = (serviceId: string, language: string) => {
  const payload = {
    service_id: serviceId,
    target_language: language,
  }
  return fetch(`${BASE_URL}/service-recommender/v1/translation/ptv_service`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const fetchFeatureFlags = () => {
  const featureFlagPromise = fetch(`${UI_BASE_URL}/config`, {
    method: 'GET',
  })
  return featureFlagPromise.then((response) => response.json()).then((json) => json.featureFlags.split(' '))
}

export const fetchConfig = async () => {
  const configPromise = await fetch(`${UI_BASE_URL}/config`)
  const config = await configPromise.json()
  return { environment: config.environment, featureFlags: config.featureFlags.split(' ') }
}

export const createSessionAttributes = (serviceChannelID: string, sessionAttributes: Record<string, unknown>) => {
  const payload: SessionAttributesRequestDto = {
    service_channel_id: serviceChannelID,
    session_attributes: sessionAttributes,
  }
  return fetch(`${BASE_URL}/service-recommender/v1/session_attributes`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}
