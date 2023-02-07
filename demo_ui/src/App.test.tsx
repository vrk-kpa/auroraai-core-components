import { render, screen, within } from '@testing-library/react'
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
  const activeNavItem = within(navElement).getByText('Tietoa palvelusta')

  expect(navElement).toBeInTheDocument()
  expect(activeNavItem).toBeInTheDocument()
  expect(activeNavItem).toHaveClass('active')
})
