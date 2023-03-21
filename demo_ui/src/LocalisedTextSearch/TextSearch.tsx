import { fetchTextSearch, translateRecommendationResults, translateSearchText } from '../http/api'
import { useRecoilState } from 'recoil'
import { RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { useTranslation } from 'react-i18next'
import { localisedTextSearchResultsState, recommendationIDState } from '../state/global'
import React, { FC, useState } from 'react'
import { Block, Heading, SearchInput } from 'suomifi-ui-components'
import { FilterProps, NationalFilterOption, ServiceFilters } from './FilterTypes'

export const LocalisedTextSearch: FC<FilterProps> = ({ filters }) => {
  const { t, i18n } = useTranslation()

  const [resultState, setResultState] = useRecoilState(localisedTextSearchResultsState)

  const [, setRecommendationID] = useRecoilState(recommendationIDState)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchButtonClick = (filters: ServiceFilters) => {
    return async (value: string | number | undefined) => {
      setResultState({ ...resultState, loadingRecommendations: true })

      const searchTerm = value?.toString() || ''
      const translatedSearchTerm =
        i18n.language !== 'fi' ? await translateSearchText(searchTerm, i18n.language) : searchTerm

      const response = await fetchTextSearch(
        'dummy_session_id',
        translatedSearchTerm,
        filters.nationalServices !== NationalFilterOption.OnlyLimited,
        filters.nationalServices === NationalFilterOption.OnlyNational,
        filters.municipalities,
        undefined,
        undefined,
        undefined,
        filters.serviceClasses,
        undefined,
        filters.fundingTypes,
      )

      if (response.ok) {
        const searchResults: RecommendServiceResponseDto = await response.json()
        const services = await translateRecommendationResults(searchResults, i18n.language)
        setRecommendationID(searchResults.auroraai_recommendation_id)
        setResultState({ ...resultState, services, loadingRecommendations: false })
      } else {
        console.error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`)
        setResultState({ ...resultState, loadingRecommendations: false })
      }
    }
  }

  return (
    <Block
      mt='m'
      padding='m'
      variant='section'
      style={{ backgroundColor: 'white', borderStyle: 'solid', borderColor: 'lightgray' }}
    >
      <Heading variant='h2' style={{ marginBottom: '20pt' }}>
        {t('headingFreeTextSearch')}
      </Heading>

      <SearchInput
        labelText={t('labelSearchQueryTextInput')}
        searchButtonLabel={t('labelSearchQuerySendButton')}
        clearButtonLabel={t('labelSearchQueryClearButton')}
        fullWidth={true}
        searchButtonProps={{ disabled: resultState.loadingRecommendations || resultState.loadingTranslations }}
        onSearch={handleSearchButtonClick(filters)}
        onChange={(value) => setSearchTerm(value?.toString() || '')}
        value={searchTerm}
      />
    </Block>
  )
}
