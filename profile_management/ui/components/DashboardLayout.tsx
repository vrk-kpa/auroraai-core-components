import Layout from "../components/Layout"
import { Container } from "../components/styles/Container"
import { Box } from "../components/styles/Box"
import { StaticIcon, suomifiDesignTokens } from "suomifi-ui-components"
import NextLink from "next/link"
import { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { css } from "styled-components"
import { breakpoints } from "../breakpoints"
import useTranslation from "next-translate/useTranslation"
import { useContext } from "react"
import { UserContext } from "../contexts/user"
import { Main } from "./Main"

const nav = [
  {
    title: "profileInfo",
    href: "/profile",
  },
  {
    title: "connectedServices",
    href: "/connected-services",
  },
]

const isActive = (target: string, current: string) => {
  return target === "/connected-services"
    ? current.startsWith("/connected-services")
    : target === current.split("?")[0] // strip out query params
}

const navItem = css`
  width: 100%;
  padding: ${suomifiDesignTokens.spacing.insetXl};
  color: ${suomifiDesignTokens.colors.highlightBase};
  text-transform: uppercase;
  cursor: pointer;
  display: block;
  border-bottom: 1px solid ${suomifiDesignTokens.colors.highlightLight3};
  text-decoration: none;
`

const activeNavItem = css`
  font-weight: bold;
  background-color: ${suomifiDesignTokens.colors.highlightBase};
  color: ${suomifiDesignTokens.colors.whiteBase};
`

const dashboardContent = css`
  display: flex;

  @media (max-width: ${breakpoints.lg}) {
    flex-direction: column;
  }
`

const dashboardNavigation = css`
  width: 22rem;
  flex-shrink: 0;
  word-break: break-all;

  @media (max-width: ${breakpoints.lg}) {
    width: 100%;
  }
`

const navigationTitle = css`
  padding: ${suomifiDesignTokens.spacing.insetXl};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: ${suomifiDesignTokens.spacing.s};
  border-bottom: 1px solid ${suomifiDesignTokens.colors.highlightLight3};
`

export function DashboardLayout({
  children,
}: PropsWithChildren<Record<never, never>>): JSX.Element {
  const { asPath } = useRouter()

  const { user } = useContext(UserContext)

  const { t } = useTranslation("common")

  return (
    <Layout user={user} hasSideNav showServiceRedirectAlert={true}>
      <Container
        css={{ margin: "0 auto", marginTop: suomifiDesignTokens.spacing.l }}
      >
        <Box css={dashboardContent}>
          <nav css={dashboardNavigation} id="sidenav" tabIndex={-1}>
            <div css={navigationTitle}>
              <StaticIcon
                icon="organisation"
                css={{ width: "2.5rem", height: "2.5rem" }}
              />
              <div>AuroraAI</div>
            </div>
            {nav.map(({ title, href }) => (
              <NextLink
                key={JSON.stringify([title, href])}
                href={href}
                passHref
              >
                <a
                  id={title}
                  css={[navItem].concat(
                    isActive(href, asPath) ? [activeNavItem] : []
                  )}
                  aria-current={isActive(href, asPath) ? "page" : undefined}
                >
                  {t(title)}
                </a>
              </NextLink>
            ))}
          </nav>
          <Main
            css={{
              padding: suomifiDesignTokens.spacing.insetXl,
              flexGrow: 1,
              outline: "none",
            }}
          >
            {children}
          </Main>
        </Box>
      </Container>
    </Layout>
  )
}
