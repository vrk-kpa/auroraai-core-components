import React from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle } from 'styled-components'
import { suomifiDesignTokens } from 'suomifi-ui-components'
import './index.css'
import { App } from './App'
import reportWebVitals from './reportWebVitals'

import 'suomifi-ui-components/dist/main.css'
import { fetchConfig } from './http/api'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${suomifiDesignTokens.colors.depthLight3};
  }
`
const config = fetchConfig()

config.then((config) => {
  ReactDOM.render(
    <React.StrictMode>
      <GlobalStyle />
      <BrowserRouter>
        <Switch>
          <Route exact path='/ui'>
            <HelmetProvider>
              <App config={config} />
            </HelmetProvider>
          </Route>
        </Switch>
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root'),
  )

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals()
})
