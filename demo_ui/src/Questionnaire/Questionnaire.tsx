import { FC, useState } from 'react'
import { useRecoilState } from 'recoil'
import { Button, Heading, suomifiDesignTokens, Notification } from 'suomifi-ui-components'
import { RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { fetchRecommendations } from '../http/api'
import { Question, Questions } from '../Questions/Questions'
import { Section } from '../Section/Section'
import {
  attributesState,
  hasOneMeter,
  isFetchingRecommendationsState,
  metersState,
  MetersState,
  recommendationIDState,
  demoRecommendedServicesState,
  sessionIDState,
  demoFiltersState,
} from '../state/global'
import { SessionInfo } from '../SessionInfo/SessionInfo'
import { mapObjIndexed } from 'ramda'
import styled from 'styled-components'
import { FilterSelection } from '../FilterSelection/FilterSelection'
import { getSelectedFilters, getSelectedServiceClasses, getSelectedTargetGroups } from '../utils'
import { ButtonContainer } from '../common/ButtonContainer'
import { LoadingSpinner } from '../common/LoadingSpinner'

const questions: Question[] = [
  { type: 'health', description: 'Terveydentilasi' },
  { type: 'resilience', description: 'Kykyysi voittaa elämässä eteen tulevia vaikeuksia' },
  { type: 'housing', description: 'Asumisoloihisi' },
  { type: 'working_studying', description: 'Päivittäiseen pärjäämiseesi' },
  { type: 'family', description: 'Perheeseesi ja läheisiisi' },
  { type: 'friends', description: 'Luotettavien ystävien määrään' },
  { type: 'finance', description: 'Taloudellisen tilanteeseesi' },
  { type: 'improvement_of_strengths', description: 'Omien vahvuuksiesi kehittämiseen' },
  { type: 'self_esteem', description: 'Itsetuntoosi' },
  { type: 'life_satisfaction', description: 'Elämääsi kokonaisuutena' },
]

const options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const Container = styled.div<{ border?: boolean }>`
  margin-top: ${suomifiDesignTokens.spacing.l};
  margin-bottom: ${suomifiDesignTokens.spacing.l};
  border-top: ${({ border }): string => (border ? `4px solid ${suomifiDesignTokens.colors.highlightBase}` : 'none')};
`

type Props = {
  onDone: (filledQuestionnaire: MetersState) => void
  featureFlags: string[]
}

export const Questionnaire: FC<Props> = ({ onDone, featureFlags }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const [meters, setMeters] = useRecoilState(metersState)
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useRecoilState(isFetchingRecommendationsState)

  const [_, setRecommendedServices] = useRecoilState(demoRecommendedServicesState)

  const [___, setRecommendationID] = useRecoilState(recommendationIDState)
  const [sessionID] = useRecoilState(sessionIDState)
  const [____, setAttributes] = useRecoilState(attributesState)

  const [filters, setFilters] = useRecoilState(demoFiltersState)

  const { includeNationalServices } = filters

  const handleSend = async () => {
    if (hasOneMeter(meters)) {
      try {
        setIsFetchingRecommendations(true)
        setError(undefined)

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

        if (!response.ok) {
          throw new Error(response.statusText)
        }
        const data: RecommendServiceResponseDto = await response.json()

        setRecommendationID(data.auroraai_recommendation_id)
        setRecommendedServices(data.recommended_services)

        setAttributes({
          life_situation_meters: mapObjIndexed((v) => [v], meters),
        })
        window.scrollTo(0, 0)
        onDone(meters)
      } catch (e) {
        console.error(`Error fetching recommendations: ${e}`)
        setError('Suosituksia ei saatavilla tällä hetkellä')
      } finally {
        setIsFetchingRecommendations(false)
      }
    } else {
      throw new Error('Unable to send a partially filled questionnaire')
    }
  }

  return (
    <>
      <Section>
        <p>
          Tässä palvelussa pääset tekemään lyhyen elämäntilannekartoituksen ja saat sen perusteella ehdotuksia
          erilaisiin palveluihin. Suositusmoottori on vasta kehitteillä joten annetut suositukset eivät välttämättä ole
          vielä hyviä tai osuvia.
        </p>
        <p>Vastaaminen on nimetöntä ja vastaukset poistetaan kolmen kuukauden kuluttua vastaamisesta.</p>
      </Section>
      <Section>
        <Heading variant='h2'>Elämäntilannekartoitus</Heading>

        <Heading variant='h3' smallScreen>
          Kun ajattelet nykyhetkeä, niin kuinka tyytyväinen olet seuraaviin asioihin?
        </Heading>
        <div>
          <Questions
            questions={questions}
            options={options}
            onOptionSelect={(q, v) => setMeters({ ...meters, ...{ [q.type]: v } })}
            isMutable={!isFetchingRecommendations}
          />
        </div>
      </Section>

      <Section>
        <FilterSelection filters={filters} setFilters={setFilters} featureFlags={featureFlags} />

        <ButtonContainer>
          <Button disabled={!hasOneMeter(meters) || isFetchingRecommendations} onClick={handleSend}>
            Etsi palveluita
          </Button>
        </ButtonContainer>

        {error && (
          <Container>
            <Notification
              status='error'
              headingText='Virhe'
              closeText={'Sulje'}
              onCloseButtonClick={() => setError(undefined)}
            >
              {error}
            </Notification>
          </Container>
        )}
      </Section>

      {isFetchingRecommendations && (
        <Section>
          <LoadingSpinner msg={' Haetaan palveluita...'} />
        </Section>
      )}
      <Section>
        <SessionInfo />
      </Section>
    </>
  )
}
