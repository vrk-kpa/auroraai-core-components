import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { localisedTextSearchResultsState } from '../state/global'
import { useNavigate } from 'react-router-dom'
import { LanguageMenuItem } from 'suomifi-ui-components'
import { translateServiceData } from '../http/api'

export const DemoUiLanguageItem: FC<{ language: string }> = ({ language }) => {
  const { i18n } = useTranslation()
  const [searchResults, setSearchResults] = useRecoilState(localisedTextSearchResultsState)
  const navigate = useNavigate()

  const onSelect = async () => {
    await i18n.changeLanguage(language)

    if (typeof searchResults.services !== 'undefined') {
      setSearchResults({ ...searchResults, loadingTranslations: true })
      const services = await Promise.all(
        searchResults.services.map(
          async (service) => (await translateServiceData(service.service_id, language)) || service,
        ),
      )
      setSearchResults({ ...searchResults, services, loadingTranslations: false })
    }

    navigate({
      pathname: '/ui/localised/text-search',
      search: `?lang=${language}`,
    })
  }

  return (
    <LanguageMenuItem selected={language === i18n.language} onSelect={onSelect}>
      {i18n.getFixedT(language)('languageMenuText')}
    </LanguageMenuItem>
  )
}
