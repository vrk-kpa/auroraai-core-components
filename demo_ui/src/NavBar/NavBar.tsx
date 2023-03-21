import React, { FC } from 'react'
import { NavLink as RouterNavLink } from 'react-router-dom'
import styled from 'styled-components'
import { suomifiDesignTokens } from 'suomifi-ui-components'

const ACTIVE_LINK_CLASS_NAME = 'active'

const Nav = styled.nav`
  background-color: ${suomifiDesignTokens.colors.whiteBase};
  border-top: solid 1px ${suomifiDesignTokens.colors.depthLight1};
  border-bottom: solid 1px ${suomifiDesignTokens.colors.depthLight1};
`

const Container = styled.div`
  max-width: 800px;
  margin: auto;
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const NavItem = styled.li`
  box-sizing: border-box;
  display: inline-block;
  padding: ${suomifiDesignTokens.spacing.s} ${suomifiDesignTokens.spacing.xl} ${suomifiDesignTokens.spacing.s} 0;
  border-bottom: solid 4px transparent;
`

const NavLink = styled(RouterNavLink)`
  box-sizing: border-box;
  color: ${suomifiDesignTokens.colors.blackBase};
  text-decoration: none;
  padding: ${suomifiDesignTokens.spacing.s} 0;

  &.active {
    border-bottom: solid 4px ${suomifiDesignTokens.colors.highlightBase};
  }
`

type Props = {
  featureFlags: string[]
}

export const NavBar: FC<Props> = ({ featureFlags }) => (
  <Nav role='navigation'>
    <Container>
      <List>
        <NavItem>
          <NavLink className={(navData) => (navData.isActive ? ACTIVE_LINK_CLASS_NAME : '')} to='/ui/'>
            Tietoa palvelusta
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={(navData) => (navData.isActive ? ACTIVE_LINK_CLASS_NAME : '')} to='/ui/recommender'>
            Palvelusuositukset
          </NavLink>
        </NavItem>
        {featureFlags.includes('ui_search') && (
          <NavItem>
            <NavLink className={(navData) => (navData.isActive ? ACTIVE_LINK_CLASS_NAME : '')} to='/ui/search'>
              Tekstisuosittelu
            </NavLink>
          </NavItem>
        )}
        <NavItem>
          <NavLink className={(navData) => (navData.isActive ? ACTIVE_LINK_CLASS_NAME : '')} to='/ui/info'>
            Lisätietoja
          </NavLink>
        </NavItem>
      </List>
    </Container>
  </Nav>
)
