import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HelmetProvider } from 'react-helmet-async'
import { App } from './App'

test('renders navigation bar', () => {
  render(
    <HelmetProvider>
      <App config={{ environment: 'dev', featureFlags: ['ui_search'] }} />
    </HelmetProvider>,
  )
  const navElement = screen.getByRole('navigation')
  const activeNavItem = document.querySelector('nav ul li a.active')
  expect(navElement).toBeInTheDocument()
  expect(activeNavItem).toBeInTheDocument()
})
