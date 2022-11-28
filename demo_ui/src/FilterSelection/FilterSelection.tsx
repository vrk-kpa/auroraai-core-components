import { SetterOrUpdater } from 'recoil'
import { suomifiDesignTokens } from 'suomifi-ui-components'
import { FiltersState } from '../state/global'
import styled from 'styled-components'
import LocationFilter from '../LocationFilter/LocationFilter'
import {
  hospitalDistrictFilter,
  LocationFilterVariant,
  municipalitiesFilter,
  PTVServiceClass,
  RecommendationFilter,
  regionFilter,
} from '../types'
import { useState } from 'react'
import { FiltersSelectionContainer } from './FiltersSelectionContainer'
import PTVClassFilter from '../PTVClassFilter/PTVClassFilter'
import TargetGroupFilter from '../TargetGroupFilter/TargetGroupFilter'
import { getVisibleFilters } from '../utils'
import OtherFilters from '../OtherFilters/OtherFilters'

const Container = styled.div`
  margin-top: ${suomifiDesignTokens.spacing.m};
  margin-bottom: ${suomifiDesignTokens.spacing.m};
`

export const FilterSelection = ({
  filters,
  setFilters,
  featureFlags,
}: {
  filters: FiltersState
  setFilters: SetterOrUpdater<FiltersState>
  featureFlags: string[]
}) => {
  const [activeFilter, setActiveFilter] = useState<RecommendationFilter>('location')

  const initialFilters = [municipalitiesFilter, regionFilter, hospitalDistrictFilter]

  const visibleLocationFilters = getVisibleFilters(initialFilters, featureFlags)

  const {
    locationFiltersSelected,
    includeNationalServices,
    locationFilters,
    targetGroupFilters,
    serviceClassFilters,
    fundingType,
  } = filters

  const setLocationFiltersSelected = (selectedFilters: LocationFilterVariant[]) => {
    setFilters({ ...filters, ...{ locationFiltersSelected: selectedFilters } })
  }

  const setIncludeNationalServices = (include: boolean) => {
    setFilters({ ...filters, ...{ includeNationalServices: include } })
  }

  const activeLocationFilters = (type: LocationFilterVariant) => {
    return locationFilters[type]
  }

  const setLocationFilter = (type: LocationFilterVariant, items: string[]) => {
    setFilters({ ...filters, locationFilters: { ...locationFilters, [type]: items } })
  }

  const setTargetGroupsFilter = (items: string[]) => {
    setFilters({ ...filters, targetGroupFilters: items })
  }

  const setServicecClasses = (items: PTVServiceClass[]) => {
    setFilters({ ...filters, serviceClassFilters: items })
  }

  const setFundingType = (items: string[]) => {
    setFilters({ ...filters, fundingType: items })
  }

  return (
    <FiltersSelectionContainer active={activeFilter} setActive={setActiveFilter}>
      <Container>
        {activeFilter === 'location' && (
          <>
            <p>
              Aluetietojen avulla voimme tarjota tarkempia palvelusuosituksia. Voit valita haluatko suosituksien
              sisältävän haluamillasi alueilla toimivia palveluita, valtakunnallisia palveluita tai molempia.
            </p>
            <LocationFilter
              filters={visibleLocationFilters}
              filtersSelected={locationFiltersSelected}
              selectFilters={(items: LocationFilterVariant[]) => setLocationFiltersSelected(items)}
              includeNationalServices={includeNationalServices}
              setIncludeNationalServices={(value: boolean) => setIncludeNationalServices(value)}
              locationFilters={(type: LocationFilterVariant) => activeLocationFilters(type)}
              setLocationFilters={(type: LocationFilterVariant, values: string[]) => setLocationFilter(type, values)}
            />
          </>
        )}

        {activeFilter === 'service_class' && (
          <PTVClassFilter
            selectedPTVServiceClasses={serviceClassFilters}
            setSelectedPTVServiceClasses={(items: PTVServiceClass[]) => setServicecClasses(items)}
          />
        )}

        {activeFilter === 'target_group' && (
          <TargetGroupFilter
            selectedTargetGroups={targetGroupFilters}
            setSelectedTargetGroups={(items: string[]) => setTargetGroupsFilter(items)}
          />
        )}

        {activeFilter === 'other' && (
          <OtherFilters
            selectedFundingType={fundingType}
            setSelectedFundingType={(items: string[]) => setFundingType(items)}
          />
        )}
      </Container>
    </FiltersSelectionContainer>
  )
}
