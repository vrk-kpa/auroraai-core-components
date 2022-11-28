import { ServiceChannelType } from './dto/RecommendServiceResponseDto'
import { FiltersState } from './state/global'
import { fundingTypeFilters, LocationFilterType, LocationFilterVariant, wellbeingCountyFilter} from './types'

export const serviceChannelTypeToText = (serviceChannelType: ServiceChannelType): string => {
  const channelDescriptions: Partial<{ [type in ServiceChannelType]: string }> = {
    Phone: 'Puhelinasiointi',
    ServiceLocation: 'Palvelupaikka',
      WebPage: 'Linkit',
      EChannel: 'Sähköiset palvelut'
  }

  return channelDescriptions[serviceChannelType] ?? ''
}

const isLocationFilterSelected = (filter: LocationFilterVariant, filtersState: FiltersState) => {
    return filtersState.locationFiltersSelected.includes(filter)
}

export const getSelectedFilters = (filtersState: FiltersState, filter: LocationFilterVariant) => {
    const selectedFilters = filtersState.locationFilters[filter]
    return isLocationFilterSelected(filter, filtersState) && selectedFilters.length > 0
        ? selectedFilters
        : undefined
}

export const getSelectedServiceClasses = (filtersState: FiltersState) => {
    const selectedFilters = filtersState.serviceClassFilters
    return selectedFilters.length > 0
        ? selectedFilters.map(item => item.uri)
        : undefined
}


export const getSelectedTargetGroups = (filtersState: FiltersState) => {
    const selectedFilters = filtersState.targetGroupFilters
    return selectedFilters.length > 0
        ? selectedFilters
        : undefined
}

export const getSelectedFundingType = (filtersState: FiltersState) => {
    const selectedFilters = filtersState.fundingType
    return selectedFilters.length > 0 && selectedFilters.length !== fundingTypeFilters.length
        ? selectedFilters
        : undefined
}

export const showEnvAlert = (env: string) => {
    return ["dev", "astest", "qa"].includes(env)
}

export const getVisibleFilters = (initialFilters: LocationFilterType[], featureFlags: string[]) => {
    const filters = featureFlags.includes("hide_hospital_districts") ? initialFilters.filter(f => f.type !== 'hospitalDistrict') : initialFilters
    return featureFlags.includes("wellbeing_county") ? filters.concat(wellbeingCountyFilter) : filters
}

