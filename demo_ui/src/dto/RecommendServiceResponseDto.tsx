import { Language } from '../types'

export type RecommendServiceResponseDto = {
  auroraai_recommendation_id: number
  recommended_services: RecommendedService[]
}

export type RecommendedService = {
  charge_additional_info: string
  charge_type: string
  requirements: string[]
  service_channels: ServiceChannel[]
  service_description: string
  service_id: string
  service_name: string
  responsible_organization: { id: string; name: string }
  area_type: AreaType
  areas: Area[]
  similarity_score?: number
  service_description_summary: string
  funding_type?: string
  machine_translated?: boolean
}

export type AreaType = 'Nationwide' | 'NationwideExceptAlandIslands' | 'LimitedType'
export type AreaSubType = 'Municipality' | 'Region' | 'HospitalDistrict'
export type Area = {
  code: string
  name: AreaName[]
  type: AreaSubType
  municipalities: Municipality[]
}

export type Municipality = {
  code: string
  name: AreaName[]
}

export type AreaName = {
  value: string
  language: Language
}

export type ServiceChannel = {
  address: string
  emails: string[]
  phone_numbers: string[]
  service_channel_description_summary: string
  service_channel_id: string
  service_channel_name: string
  service_channel_type: ServiceChannelType
  service_hours: string[]
  session_transfer: boolean
  web_pages: string[]
}

export enum ServiceChannelType {
  EChannel = 'EChannel',
  Phone = 'Phone',
  ServiceLocation = 'ServiceLocation',
  WebPage = 'WebPage',
}

export type LocalisedTextSearchResultState = {
  services: RecommendedService[] | undefined
  loadingRecommendations: boolean
  loadingTranslations: boolean
}
