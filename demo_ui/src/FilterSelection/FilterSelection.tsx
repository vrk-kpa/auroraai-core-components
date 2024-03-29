import { SetterOrUpdater } from 'recoil'
import { suomifiDesignTokens } from 'suomifi-ui-components'
import { FiltersState } from '../state/global'
import styled from 'styled-components'
import LocationFilter from '../LocationFilter/LocationFilter'
import { LocationFilterVariant, PTVServiceClass, RecommendationFilter } from '../types'
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

  const visibleLocationFilters = getVisibleFilters(featureFlags)

  const {
    locationFiltersSelected,
    includeNationalServices,
    onlyNationalServices,
    locationFilters,
    targetGroupFilters,
    serviceClassFilters,
    fundingType,
    rerank,
  } = filters

  const setLocationFiltersSelected = (selectedFilters: LocationFilterVariant[]) => {
    setFilters((f) => ({ ...f, locationFiltersSelected: selectedFilters }))
  }

  const setIncludeNationalServices = (value: boolean) => {
    setFilters((f) => ({ ...f, includeNationalServices: value }))
  }

  const setOnlyNationalServices = (value: boolean) => {
    setFilters((f) => ({ ...f, onlyNationalServices: value }))
  }

  const activeLocationFilters = (type: LocationFilterVariant) => {
    return locationFilters[type]
  }

  const setLocationFilter = (type: LocationFilterVariant, items: string[]) => {
    setFilters((f) => ({ ...f, locationFilters: { ...f.locationFilters, [type]: items } }))
  }

  const setTargetGroupsFilter = (items: string[]) => {
    setFilters((f) => ({ ...f, targetGroupFilters: items }))
  }

  const setServicecClasses = (items: PTVServiceClass[]) => {
    setFilters((f) => ({ ...f, serviceClassFilters: items }))
  }

  const setFundingType = (items: string[]) => {
    setFilters((f) => ({ ...f, fundingType: items }))
  }

  const setRerank = (value: boolean) => {
    setFilters((f) => ({ ...f, rerank: value }))
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
              onlyNationalServices={onlyNationalServices}
              setOnlyNationalServices={(value: boolean) => setOnlyNationalServices(value)}
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
            rerank={rerank}
            setRerank={(value: boolean) => setRerank(value)}
          />
        )}
      </Container>
    </FiltersSelectionContainer>
  )
}
