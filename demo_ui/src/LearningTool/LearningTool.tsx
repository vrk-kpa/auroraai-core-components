import { useState } from 'react'
import { useRecoilState } from 'recoil'
import {
  Expander,
  ExpanderContent,
  ExpanderTitleButton,
  suomifiDesignTokens,
  Button,
  Notification,
} from 'suomifi-ui-components'
import { RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { fetchRecommendations, constructRecommendationPayload, Meters } from '../http/api'
import { Section } from '../Section/Section'
import {
  sessionIDState,
  isFetchingRecommendationsState,
  recommendedServicesState,
  metersState,
  recommendationIDState,
  attributesState,
  learningFiltersState,
  FiltersState,
  hasOneMeter,
} from '../state/global'

import styled from 'styled-components'
import PTVClassFilter from '../PTVClassFilter/PTVClassFilter'
import AttributesFilter from './AttributesFilter'
import { mapObjIndexed } from 'ramda'
import { SessionInfo } from '../SessionInfo/SessionInfo'
import { ServiceRecommendations } from './ServiceRecommendations'
import { SelectedFilters } from './SelectedFilters'
import LocationFilter from '../LocationFilter/LocationFilter'
import {
  hospitalDistrictFilter,
  municipalitiesFilter,
  regionFilter,
  LocationFilterVariant,
  PTVServiceClass,
} from '../types'
import TargetGroupFilter from '../TargetGroupFilter/TargetGroupFilter'
import {
  getSelectedFilters,
  getSelectedFundingType,
  getSelectedServiceClasses,
  getSelectedTargetGroups,
  getVisibleFilters,
} from '../utils'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ButtonContainer } from '../common/ButtonContainer'
import OtherFilters from '../OtherFilters/OtherFilters'

const Container = styled.div`
  margin: ${suomifiDesignTokens.spacing.l} 0;

  > .fi-expander {
    margin: ${suomifiDesignTokens.spacing.s} 0;
  }
`

export const LearningTool = ({ featureFlags }: { featureFlags: string[] }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const [noMeters, setNoMeters] = useState<boolean>(false)

  const [isFetching, setIsFetching] = useRecoilState(isFetchingRecommendationsState)
  const [sessionID] = useRecoilState(sessionIDState)
  const [_, setRecommendedServices] = useRecoilState(recommendedServicesState)
  const [recommendationID, setRecommendationID] = useRecoilState(recommendationIDState)
  const [meters, ___] = useRecoilState(metersState)
  const [____, setAttributes] = useRecoilState(attributesState)

  const initialFilters = [municipalitiesFilter, regionFilter, hospitalDistrictFilter]

  const visibleLocationFilters = getVisibleFilters(initialFilters, featureFlags)

  const [filters, setFilters] = useRecoilState<FiltersState>(learningFiltersState)
  const {
    locationFiltersSelected,
    includeNationalServices,
    locationFilters,
    fundingType,
    rerank,
    onlyNationalServices,
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

  const setTargetGroups = (items: string[]) => {
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

  const checkMeters = (meters: Partial<Meters>) => {
    return Object.keys(meters).length > 0
  }

  const handleSend = async () => {
    if (!checkMeters(meters)) setNoMeters(true)
    else if (hasOneMeter(meters)) {
      try {
        setIsFetching(true)
        setError(undefined)
        setNoMeters(false)
        const response = await fetchRecommendations(
          sessionID,
          meters,
          onlyNationalServices ? undefined : includeNationalServices,
          onlyNationalServices,
          getSelectedFilters(filters, 'municipalities'),
          getSelectedFilters(filters, 'region'),
          getSelectedFilters(filters, 'hospitalDistrict'),
          getSelectedFilters(filters, 'wellbeingCounty'),
          getSelectedServiceClasses(filters),
          getSelectedTargetGroups(filters),
          getSelectedFundingType(filters),
          rerank,
        )

        const data: RecommendServiceResponseDto = await response.json()

        if (!response.ok) {
          throw new Error(response.statusText)
        }
        setRecommendedServices(data.recommended_services)
        setRecommendationID(data.auroraai_recommendation_id)

        setAttributes({
          life_situation_meters: mapObjIndexed((v) => [v], meters),
        })
      } catch (e) {
        console.error(`Error searching services: ${e}`)
        setError('Suosituksia ei saatavilla tällä hetkellä')
      } finally {
        setIsFetching(false)
      }
    }
  }

  const copyApiPayload = async () => {
    if (hasOneMeter(meters)) {
      const payload = constructRecommendationPayload(
        sessionID,
        meters,
        includeNationalServices,
        onlyNationalServices,
        getSelectedFilters(filters, 'municipalities'),
        getSelectedFilters(filters, 'region'),
        getSelectedFilters(filters, 'hospitalDistrict'),
        getSelectedFilters(filters, 'wellbeingCounty'),
        getSelectedServiceClasses(filters),
        getSelectedTargetGroups(filters),
        getSelectedFundingType(filters),
      )
      navigator.clipboard
        .writeText(JSON.stringify({ ...payload, session_id: '' }))
        .catch(() => alert('Kopiointi epäonnistui'))
    }
  }

  return (
    <>
      <Section>
        <p>
          AuroraAI-suosittelija suosittelee Palvelutietovarannosta (PTV) haettavia palveluita. Opetustyökalun avulla
          voit rajata sitä, mitä palveluita suosittelija tarjoaa AuroaAI-verkon loppukäyttäjille. Voit myös arvioida
          suosittelijan antamien palvalusuosittelujen osuvuutta.
        </p>

        <p>Anna yksi tai muutama rajaavia kriteereitä palvelusuositusten täsmentämiseksi.</p>

        <Container>
          <Expander>
            <ExpanderTitleButton>Aluerajaus</ExpanderTitleButton>
            <ExpanderContent>
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
            </ExpanderContent>
          </Expander>
          <Expander>
            <ExpanderTitleButton>Attribuutit</ExpanderTitleButton>
            <ExpanderContent>
              <AttributesFilter />
            </ExpanderContent>
          </Expander>

          <Expander>
            <ExpanderTitleButton>Palveluluokka</ExpanderTitleButton>
            <ExpanderContent>
              <PTVClassFilter
                selectedPTVServiceClasses={filters.serviceClassFilters}
                setSelectedPTVServiceClasses={(items: PTVServiceClass[]) => setServicecClasses(items)}
              />
            </ExpanderContent>
          </Expander>

          <Expander>
            <ExpanderTitleButton>Kohderyhmä</ExpanderTitleButton>
            <ExpanderContent>
              <TargetGroupFilter
                selectedTargetGroups={filters.targetGroupFilters}
                setSelectedTargetGroups={(items: string[]) => setTargetGroups(items)}
              />
            </ExpanderContent>
          </Expander>

          <Expander>
            <ExpanderTitleButton>Muu</ExpanderTitleButton>
            <ExpanderContent>
              <OtherFilters
                selectedFundingType={fundingType}
                setSelectedFundingType={(items: string[]) => setFundingType(items)}
                rerank={rerank}
                setRerank={(value: boolean) => setRerank(value)}
              />
            </ExpanderContent>
          </Expander>
        </Container>
      </Section>
      <Section>
        <SelectedFilters />
        <ButtonContainer>
          <Button disabled={!hasOneMeter(meters) || isFetching} onClick={handleSend}>
            Hae palveluita
          </Button>

          <Button style={{ marginLeft: '5px' }} onClick={copyApiPayload} disabled={!hasOneMeter(meters)}>
            Kopioi API-kutsun data leikepöydälle
          </Button>
        </ButtonContainer>
      </Section>
      <Section>
        {isFetching ? (
          <LoadingSpinner msg={' Haetaan palveluita...'} />
        ) : (
          <>
            {noMeters ? (
              <Notification
                status='neutral'
                headingText='Info'
                closeText={'Sulje'}
                onCloseButtonClick={() => setNoMeters(false)}
              >
                Vähintään 1 elämäntilanne attribuuteista tarvitaan
              </Notification>
            ) : error ? (
              <Notification
                status='error'
                headingText='Virhe'
                closeText={'Sulje'}
                onCloseButtonClick={() => setError(undefined)}
              >
                {error}
              </Notification>
            ) : (
              <>{recommendationID && <ServiceRecommendations recommendationId={recommendationID} />}</>
            )}
          </>
        )}
      </Section>

      <Section>
        <SessionInfo />
      </Section>
    </>
  )
}
