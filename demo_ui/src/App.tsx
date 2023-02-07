import { FC, useState } from 'react'
import { HashRouter, Route, Switch } from 'react-router-dom'
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
    <RecoilRoot>
      <HashRouter basename='/'>
        <Header>
          <NavBar featureFlags={config.featureFlags} />
        </Header>
        <Main>
          {config.environment && showEnvAlert(config.environment) && (
            <InlineAlert labelText='Huom!' status='warning'>
              Käytät {config.environment.toUpperCase()}-ympäristöä
            </InlineAlert>
          )}
          <Switch>
            <Route exact path='/'>
              <Page title='Tietoa palvelusta'>
                <DemoUIHome />
              </Page>
            </Route>

            <Route exact path='/recommender'>
              <Page title='Palvelusuositukset'>
                <LearningTool featureFlags={config.featureFlags} />
              </Page>
            </Route>

            <Route path='/search'>
              <Page title='Tekstisuosittelu'>
                <Search featureFlags={config.featureFlags} />
              </Page>
            </Route>
            <Route path='/info'>
              <Page title='Lisätietoja'>
                <AdditionalInfo />
              </Page>
            </Route>
          </Switch>
        </Main>
      </HashRouter>
    </RecoilRoot>
  )
}
