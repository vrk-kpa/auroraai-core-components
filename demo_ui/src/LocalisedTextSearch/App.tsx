import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HelmetProvider } from 'react-helmet-async'
import { RecoilRoot } from 'recoil'
import { Block, Heading, LanguageMenu } from 'suomifi-ui-components'
import './suomifi.css'
import { AuroraAILogo } from '../AuroraAILogo'
import { LocalisedTextSearch } from './TextSearch'
import { DemoUiLanguageItem } from './LanguageMenu'
import { RecommendationResultContainer } from './ServiceResults'
import { NationalFilterOption, ServiceFilters } from './FilterTypes'
import { FilterPanel } from './FilterPanel'

const App = () => {
  const { t, i18n } = useTranslation()
  const supportedLanguages = (i18n.options.supportedLngs || []).filter((language) => language !== 'cimode')

  const [filters, setFilters] = useState<ServiceFilters>({
    nationalServices: NationalFilterOption.AllServices,
    maxResults: 5,
  })

  return (
    <HelmetProvider>
      <RecoilRoot>
        <Block
          margin='0'
          variant='header'
          style={{
            borderBottom: 'solid lightgray',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <AuroraAILogo width='120px' />
          <Block variant='div' style={{ alignSelf: 'flex-end' }}>
            <LanguageMenu name={t('languageMenuText')}>
              {supportedLanguages.map((language) => (
                <DemoUiLanguageItem key={language} language={language} />
              ))}
            </LanguageMenu>
          </Block>
        </Block>

        <Block
          margin='m'
          variant='main'
          style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%' }}
        >
          <Block variant='div' margin='0' style={{ width: 'inherit', maxWidth: '1200px' }}>
            <Heading variant='h1'>{t('headingMain')}</Heading>
            <Block style={{ display: 'flex', flexDirection: 'row' }}>
              <Block style={{ width: '70%' }}>
                <LocalisedTextSearch filters={filters} setFilters={setFilters} />
                <RecommendationResultContainer />
              </Block>
              <FilterPanel filters={filters} setFilters={setFilters} />
            </Block>
          </Block>
        </Block>
      </RecoilRoot>
    </HelmetProvider>
  )
}

export default App
