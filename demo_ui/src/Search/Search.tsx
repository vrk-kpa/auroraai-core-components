import { FC, useState } from 'react'
import {
  Button,
  Heading,
  SearchInput,
  suomifiDesignTokens,
  Text,
  Notification,
  Dropdown,
  DropdownItem,
} from 'suomifi-ui-components'
import { RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { fetchSearchTextTranslation, fetchTextSearch } from '../http/api'
import { Section } from '../Section/Section'
import {
  sessionIDState,
  isFetchingSearchState,
  termSearchResultsState,
  recommendationIDState,
  FiltersState,
  termSearchFiltersState,
  translationLanguageState,
} from '../state/global'
import { SearchServices } from '../Services/Services'
import styled from 'styled-components'
import { useRecoilState } from 'recoil'
import {
  getSelectedFilters,
  getSelectedFundingType,
  getSelectedServiceClasses,
  getSelectedTargetGroups,
} from '../utils'
import { SelectedFilters } from './SelectedFilters'
import { FilterSelection } from '../FilterSelection/FilterSelection'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ButtonContainer } from '../common/ButtonContainer'

const VerticalMargin = styled.div`
  margin-top: 10px;
  margin-bottom: 10px;
`

const Container = styled.div`
  margin-top: ${suomifiDesignTokens.spacing.m};
  margin-bottom: ${suomifiDesignTokens.spacing.m};
`

const supportedLanguages: { [key: string]: string } = {
  Englanti: 'en',
  Norja: 'no',
  Ranska: 'fr',
  Ruotsi: 'sv',
  Saksa: 'de',
  Suomi: 'fi',
  Tanska: 'da',
  Ukraina: 'uk',
  Venäjä: 'ru,',
  Viro: 'et',
}

type Props = {
  featureFlags: string[]
}

export const Search: FC<Props> = ({ featureFlags }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  const [isFetchingSearch, setIsFetchingSearch] = useRecoilState(isFetchingSearchState)
  const [termSearchResults, setTermSearchResults] = useRecoilState(termSearchResultsState)
  const [_, setRecommendationID] = useRecoilState(recommendationIDState)

  const [sessionID] = useRecoilState(sessionIDState)

  const [filters, setFilters] = useRecoilState<FiltersState>(termSearchFiltersState)
  const [translationLanguage, setTranslationLanguage] = useRecoilState(translationLanguageState)

  const { includeNationalServices } = filters

  const handleSearchTextTranslation = async (searchTerm: string, language: string): Promise<string> => {
    const response = await fetchSearchTextTranslation(searchTerm, language)
    if (response.ok) {
      const body = await response.json()
      return body.search_text as string
    } else {
      setError('Käännös epäonnistui.')
      return ''
    }
  }

  const handleSend = async () => {
    try {
      setIsFetchingSearch(true)
      setError(undefined)

      const finalSearchTerm =
        translationLanguage !== 'fi' ? await handleSearchTextTranslation(searchTerm, translationLanguage) : searchTerm

      const response = await fetchTextSearch(
        sessionID,
        finalSearchTerm,
        includeNationalServices,
        getSelectedFilters(filters, 'municipalities'),
        getSelectedFilters(filters, 'region'),
        getSelectedFilters(filters, 'hospitalDistrict'),
        getSelectedFilters(filters, 'wellbeingCounty'),
        getSelectedServiceClasses(filters),
        getSelectedTargetGroups(filters),
        getSelectedFundingType(filters),
      )

      if (response.ok) {
        const searchResults: RecommendServiceResponseDto = await response.json()

        setTermSearchResults(searchResults.recommended_services)
        setRecommendationID(searchResults.auroraai_recommendation_id)
      } else {
        setError('Suosituksia ei saatavilla tällä hetkellä')
      }
    } catch (e) {
      console.error(`Error searching services: ${e}`)
      setError('On tapahtunut virhe, yritä myöhemmin uudelleen')
    } finally {
      setIsFetchingSearch(false)
    }
  }

  return (
    <>
      <Section>
        <p>Vapaatekstiin perustuva palvelusuosittelu</p>
        <SearchInput
          labelText='Tekstikenttä palvelusuositteluun'
          clearButtonLabel='Tyhjennä'
          searchButtonLabel='Hae'
          fullWidth={true}
          searchButtonProps={{ disabled: isFetchingSearch }}
          onSearch={handleSend}
          onChange={(value) => setSearchTerm(value?.toString() || '')}
          value={searchTerm}
        />
        {featureFlags?.includes('translate_api') && (
          <Dropdown
            name='LanguageDropdown'
            labelText='Hakutekstin kieli'
            defaultValue={'fi'}
            onChange={(value) => setTranslationLanguage(value)}
          >
            {Object.keys(supportedLanguages).map((lang) => (
              <DropdownItem value={supportedLanguages[lang]}>{lang}</DropdownItem>
            ))}
          </Dropdown>
        )}

        {translationLanguage !== 'fi' && (
          <p>
            Hakeminen muulla, kuin suomen kielellä, on kokeellinen ominaisuus. Haku saattaa kestää normaalia pidempään.
          </p>
        )}

        <FilterSelection filters={filters} setFilters={setFilters} featureFlags={featureFlags} />
      </Section>
      <Section>
        <SelectedFilters />
        <ButtonContainer>
          <Button disabled={isFetchingSearch || searchTerm === ''} onClick={() => handleSend()}>
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

      {!isFetchingSearch && termSearchResults && (
        <Section>
          <VerticalMargin>
            <Heading variant='h2'>Löydetyt palvelut</Heading>
          </VerticalMargin>
          <Container>
            {termSearchResults.length > 0 ? (
              <SearchServices recommendations={termSearchResults} />
            ) : (
              <Text>Ei löytynyt palveluita</Text>
            )}
          </Container>
        </Section>
      )}

      {isFetchingSearch && (
        <Section>
          <LoadingSpinner msg={' Haetaan palveluita...'} />
        </Section>
      )}
    </>
  )
}
