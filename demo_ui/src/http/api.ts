import { mapObjIndexed } from 'ramda'
import { RecommendServiceRequestDto } from '../dto/RecommendServiceRequestDto'
import { RecommendationFeedbackRequestDto } from '../dto/RecommendationFeedbackRequestDto'
import { SessionAttributesRequestDto } from '../dto/SessionAttributesRequestDto'
import { TextSearchServiceRequestDto } from '../dto/TextSearchServiceRequestDto'
import { RecommendedService, RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'

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

export type Meter = (typeof meters)[number]
export type Meters = { [meter in Meter]: number }

export const constructRecommendationPayload = (
  session_id: string,
  meters: Meters,
  include_national_services?: boolean,
  only_national_services?: boolean,
  municipality_codes?: string[],
  region_codes?: string[],
  hospital_district_codes?: string[],
  wellbeing_service_county_codes?: string[],
  service_classes?: string[],
  target_groups?: string[],
  funding_type?: string[],
  rerank?: boolean,
  limit = 10,
) => {
  return {
    session_id,
    life_situation_meters: mapObjIndexed((v) => [v], meters),
    service_filters: {
      include_national_services,
      only_national_services,
      municipality_codes,
      region_codes,
      hospital_district_codes,
      wellbeing_service_county_codes,
      service_classes,
      target_groups,
      funding_type,
    },

    limit,
    rerank,
  } as RecommendServiceRequestDto
}

export const fetchRecommendations = (
  session_id: string,
  meters: Meters,
  include_national_services?: boolean,
  only_national_services?: boolean,
  municipality_codes?: string[],
  region_codes?: string[],
  hospital_district_codes?: string[],
  wellbeing_service_county_codes?: string[],
  service_classes?: string[],
  target_groups?: string[],
  funding_type?: string[],
  rerank?: boolean,
  limit = 10,
) => {
  const payload = constructRecommendationPayload(
    session_id,
    meters,
    include_national_services,
    only_national_services,
    municipality_codes,
    region_codes,
    hospital_district_codes,
    wellbeing_service_county_codes,
    service_classes,
    target_groups,
    funding_type,
    rerank,
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
  only_national_services?: boolean,
  municipality_codes?: string[],
  region_codes?: string[],
  hospital_district_codes?: string[],
  wellbeing_service_county_codes?: string[],
  service_classes?: string[],
  target_groups?: string[],
  funding_type?: string[],
  rerank?: boolean,
  limit?: number,
) => {
  // Area filters are excluded if only_national_services flag is set
  const areaFilters = Object.fromEntries(
    Object.entries({
      include_national_services,
      municipality_codes,
      region_codes,
      hospital_district_codes,
      wellbeing_service_county_codes,
    }).map(([key, value]) => [key, only_national_services ? undefined : value]),
  )

  const payload: TextSearchServiceRequestDto = {
    search_text: searchQuery.trim(),
    service_filters: {
      only_national_services,
      ...areaFilters,
      service_classes,
      target_groups,
      funding_type,
    },
    rerank: rerank,
    limit: limit,
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

export const translateSearchText = async (searchTerm: string, language: string): Promise<string> => {
  const response = await fetchSearchTextTranslation(searchTerm, language)
  if (response.ok) {
    const body = await response.json()
    return body.search_text as string
  } else {
    console.error('failed to translate')
    return ''
  }
}

export const translateServiceData = async (serviceId: string, language: string): Promise<RecommendedService | undefined> => {
  const response = await fetchServiceTranslation(serviceId, language)
  if (response.ok) {
    const body = await response.json()
    return body.service as RecommendedService
  } else {
    return undefined
  }
}

export const translateRecommendationResults = async (searchResults: RecommendServiceResponseDto, language: string) => {
  return language === 'fi'
    ? searchResults.recommended_services
    : await Promise.all(
        searchResults.recommended_services.map(async (service) => (await translateServiceData(service.service_id, language)) || service),
      )
}
