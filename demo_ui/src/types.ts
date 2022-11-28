import { ServiceChannelType } from './dto/RecommendServiceResponseDto'
const ptvServiceClassesResource = require('./resources/ptv_classes.json')
const regionResource = require('./resources/region_codes.json')
const hospitalDistrictsResource = require('./resources/codelist_hospital_districts.json')
const targetGroupsResource = require('./resources/codelist_target_groups.json')
export const municipalityCodes: { [key: string]: string } = require('./resources/municipality_codes.json')
const wellbeingCountiesResource = require('./resources/codelist_wellbeing_counties.json')

export const serviceChannelTypeToText = (serviceChannelType: ServiceChannelType): string => {
  const channelDescriptions: Partial<{ [type in ServiceChannelType]: string }> = {
    Phone: 'Puhelinasiointi',
    ServiceLocation: 'Palvelupaikka',
    WebPage: 'Linkit',
  }

  return channelDescriptions[serviceChannelType] ?? ''
}

export type PTVServiceClass = {
  id: string
  codeValue: string
  uri: string
  url: string
  status: string
  order: number
  hierarchyLevel: number
  created: string
  modified: string
  prefLabel: Record<string, string>
  description: Record<string, string>
  broaderCode?: PTVServiceClass
  membersUrl: string
}

export type Region = {
  id: string
  codeValue: string
  uri: string
  order: string
  hierarchyLevel: number
  prefLabel: Record<string, string>
}

export type HospitalDistrict = {
  id: string
  codeValue: string
  uri: string
  order: string
  hierarchyLevel: number
  prefLabel: Record<string, string>
}

export type WellbeingCounty = {
    id: string
    codeValue: string
    uri: string
    order: string
    hierarchyLevel: number
    prefLabel: Record<string, string>
}

export type PTVEntity = {
    id: string
    codeValue: string
    uri: string
    url: string
    status: string
    order: number
    hierarchyLevel: number
    created: string
    modified: string
    prefLabel: Record<Language, string>
    description?: Record<Language, string>
    broaderCode?: PTVEntity
    membersUrl: string
}

export const ptvServiceClasses: PTVServiceClass[] = Object.values(ptvServiceClassesResource['codes'])

export const regions: Region[] = Object.values(regionResource['codes'])

export const hospitalDistricts: HospitalDistrict[] = Object.values(hospitalDistrictsResource['codes'])

export const wellbeingCounties: WellbeingCounty[] = Object.values(wellbeingCountiesResource['codes'])

municipalityCodes['000'] = 'Testikunta'

export const targetGroups: PTVEntity[] = Object.values(targetGroupsResource['codes'])

export type LocationFilterVariant = 'region' | 'hospitalDistrict' | 'wellbeingCounty' | 'municipalities'

export type LocationFilterType = {
  type: LocationFilterVariant
  name: string
}

export type FundingType = 'PubliclyFunded' | 'MarketFunded'
export type FundingTypeFilter = {
    type: FundingType
    name: string
}


export type Language = 'fi' | 'sv' | 'en'
export type RecommendationFilter = 'location' | 'service_class' | 'target_group' | 'other'
export type Step = 'questionnaire' | 'recommendations'
export type Config = {
    environment: string
    featureFlags: string[]
}

export const municipalitiesFilter: LocationFilterType = { type: 'municipalities', name: 'Kunta' }
export const regionFilter: LocationFilterType = { type: 'region', name: 'Maakunta' }
export const hospitalDistrictFilter: LocationFilterType = { type: 'hospitalDistrict', name: 'Sairaanhoitopiiri' }
export const wellbeingCountyFilter: LocationFilterType = { type: 'wellbeingCounty', name: 'Hyvinvointialue' }

export const citizensTargetGroup = 'KR1'
export const defaultTargetGroups = [citizensTargetGroup]

export const publicFunding: FundingTypeFilter = { type: 'PubliclyFunded', name: 'Julkinen rahoitus' }
export const privateFunding: FundingTypeFilter = { type: 'MarketFunded', name: 'Yksityinen palvelu' }
export const fundingTypeFilters = [publicFunding, privateFunding]