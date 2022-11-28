import { useRecoilState } from 'recoil'
import { Button, suomifiDesignTokens } from 'suomifi-ui-components'
import { RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { fetchRecommendations } from '../http/api'

import {
  hasOneMeter,
  isFetchingRecommendationsState,
  metersState,
  demoFiltersState,
  recommendationIDState,
  demoRecommendedServicesState,
  sessionIDState,
} from '../state/global'

import styled from 'styled-components'
import LocationFilter from '../LocationFilter/LocationFilter'
import { hospitalDistrictFilter, LocationFilterVariant, municipalitiesFilter, regionFilter } from '../types'

const Container = styled.div`
  margin-top: ${suomifiDesignTokens.spacing.m};
  margin-bottom: ${suomifiDesignTokens.spacing.m};
  border-top: 4px solid ${suomifiDesignTokens.colors.highlightBase};
`

export const LocationSelection = ({ hide }: { hide: () => void }) => {
  const [meters] = useRecoilState(metersState)
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useRecoilState(isFetchingRecommendationsState)

  const [_, setRecommendedServices] = useRecoilState(demoRecommendedServicesState)

  const [___, setRecommendationID] = useRecoilState(recommendationIDState)
  const [sessionID] = useRecoilState(sessionIDState)

  const visibleLocationFilters = [municipalitiesFilter, regionFilter, hospitalDistrictFilter]

  const [filters, setFilters] = useRecoilState(demoFiltersState)

  const { locationFiltersSelected, includeNationalServices, locationFilters } = filters

  const isLocationFilterSelected = (filter: LocationFilterVariant) => {
    return locationFiltersSelected.includes(filter)
  }

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

  const handleSend = async () => {
    if (hasOneMeter(meters)) {
      try {
        setIsFetchingRecommendations(true)

        const response = await fetchRecommendations(
          sessionID,
          meters,
          includeNationalServices,
          isLocationFilterSelected('municipalities') ? activeLocationFilters('municipalities') : undefined,
          isLocationFilterSelected('region') ? activeLocationFilters('region') : undefined,
          isLocationFilterSelected('hospitalDistrict') ? activeLocationFilters('hospitalDistrict') : undefined,
        )

        const data: RecommendServiceResponseDto = await response.json()

        setRecommendationID(data.auroraai_recommendation_id)
        setRecommendedServices(data.recommended_services)
      } catch (e) {
        console.error(`Error fetching recommendations: ${e}`)
      } finally {
        setIsFetchingRecommendations(false)
        hide()
      }
    } else {
      throw new Error('Unable to send a partially filled questionnaire')
    }
  }

  return (
    <>
      <Container>
        <p>
          Aluetietojen avulla voimme tarjota tarkempia palvelusuosituksia. Voit valita haluatko suosituksien sisältävän
          haluamillasi alueilla toimivia palveluita, valtakunnallisia palveluita tai molempia.
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
      </Container>

      <Button disabled={!hasOneMeter(meters) || isFetchingRecommendations} onClick={handleSend}>
        Etsi palveluita
      </Button>
    </>
  )
}
