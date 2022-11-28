import { useState } from 'react'
import styled from 'styled-components'
import { Button, Heading, suomifiDesignTokens, Text } from 'suomifi-ui-components'
import { Section } from '../Section/Section'
import { Services } from '../Services/Services'
import {
  demoFiltersState,
  demoRecommendedServicesState,
  hasOneMeter,
  isFetchingRecommendationsState,
  metersState,
  recommendationIDState,
  sessionIDState,
} from '../state/global'
import { SessionInfo } from '../SessionInfo/SessionInfo'
import { SelectedFilters } from '../Questionnaire/SelectedFilters'
import { FilterSelection } from '../FilterSelection/FilterSelection'
import { useRecoilState } from 'recoil'
import { fetchRecommendations } from '../http/api'
import { RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { getSelectedFilters, getSelectedServiceClasses, getSelectedTargetGroups } from '../utils'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ButtonContainer } from '../common/ButtonContainer'

const Container = styled.section`
  h2,
  h3,
  h4 {
    margin-bottom: ${suomifiDesignTokens.spacing.m};
  }
`

export const Recommendations = ({ featureFlags }: { featureFlags: string[] }) => {
  const [recommendations] = useRecoilState(demoRecommendedServicesState)

  const [showFilters, setShowFilters] = useState<boolean>(false)

  const [meters] = useRecoilState(metersState)
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useRecoilState(isFetchingRecommendationsState)

  const [_, setRecommendedServices] = useRecoilState(demoRecommendedServicesState)

  const [___, setRecommendationID] = useRecoilState(recommendationIDState)
  const [sessionID] = useRecoilState(sessionIDState)

  const [filters, setFilters] = useRecoilState(demoFiltersState)

  const { includeNationalServices } = filters

  const handleSend = async () => {
    if (hasOneMeter(meters)) {
      try {
        setIsFetchingRecommendations(true)

        const response = await fetchRecommendations(
          sessionID,
          meters,
          includeNationalServices,
          getSelectedFilters(filters, 'municipalities'),
          getSelectedFilters(filters, 'region'),
          getSelectedFilters(filters, 'hospitalDistrict'),
          getSelectedServiceClasses(filters),
          getSelectedTargetGroups(filters),
        )

        const data: RecommendServiceResponseDto = await response.json()

        setRecommendationID(data.auroraai_recommendation_id)
        setRecommendedServices(data.recommended_services)
      } catch (e) {
        console.error(`Error fetching recommendations: ${e}`)
      } finally {
        setIsFetchingRecommendations(false)
        setShowFilters(false)
      }
    } else {
      throw new Error('Unable to send a partially filled questionnaire')
    }
  }

  return (
    <Container>
      <Section>
        <p>
          Alla näet suositukset joita löytyi täyttämäsi elämäntilannekartoituksen perusteella. Suositukset eivät
          välttämättä ole kovin hyviä sillä palvelu on vasta kehitteillä.
        </p>
        <p>
          Meille olisikin tärkeää että antaisit palautetta suosituksista painamalla sydäntä sinulle hyödyllisten
          palveluiden kohdalla.
        </p>
      </Section>

      <Section>
        <SelectedFilters editFilters={() => setShowFilters(true)} showLocationFilters={showFilters} />
        {showFilters && <FilterSelection filters={filters} setFilters={setFilters} featureFlags={featureFlags} />}

        {showFilters && (
          <ButtonContainer>
            <Button disabled={!hasOneMeter(meters) || isFetchingRecommendations} onClick={handleSend}>
              Etsi palveluita
            </Button>
          </ButtonContainer>
        )}
      </Section>

      {isFetchingRecommendations && (
        <Section>
          <LoadingSpinner msg={' Haetaan palveluita...'} />
        </Section>
      )}

      <Section>
        <Heading variant='h2'>Löytyneet palvelut</Heading>
        {recommendations && recommendations.length > 0 ? (
          <Services recommendations={recommendations} allowFeedback={true} />
        ) : (
          <Text>Ei löytynyt palveluita</Text>
        )}
      </Section>
      <Section>
        <p>
          Huomaathan, että suositukset häviävät sulkiessasi selaimen välilehden. Halutessasi voit tehdä testin
          uudestaan.
        </p>
        <Button onClick={() => window.location.reload()}>Tee elämäntilannekartoitus uudelleen</Button>
      </Section>
      <Section>
        <SessionInfo />
      </Section>
    </Container>
  )
}
