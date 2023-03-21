import React from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle } from 'styled-components'
import { suomifiDesignTokens } from 'suomifi-ui-components'
import './index.css'
import './i18n'
import { App } from './App'
import reportWebVitals from './reportWebVitals'

import 'suomifi-ui-components/dist/main.css'
import { fetchConfig } from './http/api'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { default as LocalisedTextSearchApp } from './LocalisedTextSearch/App'

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
        <Routes>
          <Route path='ui'>
            <Route index path='*' element={<App config={config} />} />
            <Route path='localised'>
              <Route path='text-search' element={<LocalisedTextSearchApp />} />
              <Route index path='*' element={<p>404</p>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root'),
  )

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals()
})
