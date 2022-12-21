import { atom } from 'recoil'
import { RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { meters, Meters } from '../http/api'
import { defaultTargetGroups, Language, LocationFilterVariant, PTVServiceClass } from '../types'

export type MetersState = Partial<Meters>
export const hasOneMeter = (state: MetersState): state is Meters => meters.length >= 1

export const metersState = atom<MetersState>({
  key: 'meters',
  default: {},
})

export const isFetchingRecommendationsState = atom({
  key: 'isFetchingRecommendations',
  default: false,
})

export const isFetchingSearchState = atom({
  key: 'isFetchingSearch',
  default: false,
})

export const recommendedServicesState = atom<RecommendServiceResponseDto['recommended_services'] | undefined>({
  key: 'recommendedServices',
  default: undefined,
})

export const termSearchResultsState = atom<RecommendServiceResponseDto['recommended_services'] | undefined>({
  key: 'termSearchResults',
  default: undefined,
})

export const recommendationIDState = atom<number | undefined>({
  key: 'recommendationID',
  default: undefined,
})

export const translationLanguageState = atom<string>({
  key: 'translationLanguage',
  default: 'fi',
})

export const sessionIDState = atom<string>({
  key: 'sessionID',
  default: '',
})

export const attributesState = atom<Record<string, unknown>>({
  key: 'attributes',
  default: {},
})

export type FiltersState = {
  locationFilters: Record<LocationFilterVariant, string[]>
  locationFiltersSelected: LocationFilterVariant[]
  includeNationalServices: boolean
  onlyNationalServices: boolean
  serviceClassFilters: PTVServiceClass[]
  targetGroupFilters: string[]
  fundingType: string[]
  rerank: boolean
}

export const demoFiltersState = atom<FiltersState>({
  key: 'questionaireFilters',
  default: {
    locationFilters: {
      municipalities: [],
      region: [],
      hospitalDistrict: [],
      wellbeingCounty: [],
    },
    locationFiltersSelected: [],
    includeNationalServices: false,
    onlyNationalServices: false,
    serviceClassFilters: [],
    targetGroupFilters: defaultTargetGroups,
    fundingType: [],
    rerank: false,
  },
})

export const learningFiltersState = atom<FiltersState>({
  key: 'learningFilters',
  default: {
    locationFilters: {
      municipalities: [],
      region: [],
      hospitalDistrict: [],
      wellbeingCounty: [],
    },
    locationFiltersSelected: [],
    includeNationalServices: false,
    onlyNationalServices: false,
    serviceClassFilters: [],
    targetGroupFilters: defaultTargetGroups,
    fundingType: [],
    rerank: false,
  },
})

export const demoRecommendedServicesState = atom<RecommendServiceResponseDto['recommended_services'] | undefined>({
  key: 'demoRecommendedServices',
  default: undefined,
})

export const termSearchFiltersState = atom<FiltersState>({
  key: 'termSearchFilters',
  default: {
    locationFilters: {
      municipalities: [],
      region: [],
      hospitalDistrict: [],
      wellbeingCounty: [],
    },
    locationFiltersSelected: [],
    includeNationalServices: false,
    onlyNationalServices: false,
    serviceClassFilters: [],
    targetGroupFilters: defaultTargetGroups,
    fundingType: [],
    rerank: false,
  },
})

export const localeState = atom<Language>({
  key: 'locale',
  default: 'fi',
})
