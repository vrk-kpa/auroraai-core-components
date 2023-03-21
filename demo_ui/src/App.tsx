import { FC, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import styled from 'styled-components'
import { InlineAlert, suomifiDesignTokens } from 'suomifi-ui-components'
import { AdditionalInfo } from './AdditionalInfo/AdditionalInfo'
import { Search } from './Search/Search'
import { NavBar } from './NavBar/NavBar'
import { Page } from './Page/Page'
import { LearningTool } from './LearningTool/LearningTool'
import { RecoilRoot } from 'recoil'
import { Config, Step } from './types'
import { showEnvAlert } from './utils'
import { DemoUIHome } from './DemoUI/DemoUIHome'

const Header = styled.header`
  height: 6rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-color: ${suomifiDesignTokens.colors.whiteBase};
`

const Main = styled.main`
  max-width: 800px;
  margin: ${suomifiDesignTokens.spacing.l} auto;
`

type Props = {
  config: Config
}

export const App: FC<Props> = ({ config }) => {
  useState<Step>('questionnaire')

  return (
    <HelmetProvider>
      <RecoilRoot>
        <Header>
          <NavBar featureFlags={config.featureFlags} />
        </Header>
        <Main>
          {config.environment && showEnvAlert(config.environment) && (
            <InlineAlert labelText='Huom!' status='warning'>
              Käytät {config.environment.toUpperCase()}-ympäristöä
            </InlineAlert>
          )}

          <Routes>
            <Route
              index
              path='*'
              element={
                <Page title='Tietoa palvelusta'>
                  <DemoUIHome />
                </Page>
              }
            />

            <Route
              path='recommender'
              element={
                <Page title='Palvelusuositukset'>
                  <LearningTool featureFlags={config.featureFlags} />
                </Page>
              }
            />

            <Route
              path='search'
              element={
                <Page title='Tekstisuosittelu'>
                  <Search featureFlags={config.featureFlags} />
                </Page>
              }
            />

            <Route
              path='info'
              element={
                <Page title='Lisätietoja'>
                  <AdditionalInfo />
                </Page>
              }
            />
          </Routes>
        </Main>
      </RecoilRoot>
    </HelmetProvider>
  )
}
