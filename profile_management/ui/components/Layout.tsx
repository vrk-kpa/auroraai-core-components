import "suomifi-ui-components/dist/main.css"
import { Global } from "./styles/Global"
import React, { PropsWithChildren, useEffect, useState } from "react"
import {
  suomifiDesignTokens,
  SkipLink,
  Button,
  Icon,
  ExternalLink,
} from "suomifi-ui-components"
import { LanguageSelector } from "./LanguageSelector"
import { Container } from "./styles/Container"
import { Footer } from "./styles/Footer"
import { Header } from "./styles/Header"
import { css } from "styled-components"
import { profileManagementAPI, User } from "../api/profileManagementApi"
import NextLink from "next/link"
import { breakpoints } from "../breakpoints"
import { logOutLink, MenuPopover } from "./MenuPopover"
import useTranslation from "next-translate/useTranslation"
import { AuroraAILogo } from "./logos/AuroraAILogo"
import { SuomifiLogo } from "./logos/SuomifiLogo"
import { NavigationLink } from "../components/NavigationLink"
import { setCookies, getCookie } from "cookies-next"
import { useRouter } from "next/router"
import * as schemas from "shared/schemas"
import { Language } from "shared/schemas"
import { RedirectToServiceAlert } from "./RedirectToServiceAlert"
import { Config } from "../schemas"
import { EnvironmentAlert } from "./EnvironmentAlert"
import { AnnouncementAlert } from "./AnnouncementAlert"

const root = css`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`

const footerGrid = css`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: ${suomifiDesignTokens.spacing.m};
  margin-top: ${suomifiDesignTokens.spacing.m};

  @media (max-width: ${breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`

const footerContainer = css`
  margin: 0 auto;
  padding-top: ${suomifiDesignTokens.spacing.xxl};
  padding-bottom: ${suomifiDesignTokens.spacing.xxl};
`

const headerContainer = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const headerSide = css`
  display: flex;
  align-items: center;
`

const userInfo = css`
  display: flex;
  flex-direction: column;
  gap: ${suomifiDesignTokens.spacing.xxs};
  align-items: flex-end;
  margin-left: ${suomifiDesignTokens.spacing.xxxl};
  font-size: 15px;

  @media (max-width: ${breakpoints.sm}) {
    display: none;
  }
`

const menuButtonContainer = css`
  display: none;
  position: relative;
  margin-left: 2rem;

  @media (max-width: ${breakpoints.md}) {
    display: block;
  }

  @media (max-width: ${breakpoints.sm}) {
    position: static;
  }
`

const header = css`
  @media (max-width: ${breakpoints.sm}) {
    position: relative;
  }
`

const languageSelector = css`
  @media (max-width: ${breakpoints.md}) {
    display: none;
  }
`

const menuButton = css`
  cursor: pointer;
  width: 2.5rem;
  height: 2.5rem;
  background: none !important;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

const footerLinks = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${suomifiDesignTokens.spacing.m};
`

export default function Layout({
  children,
  user,
  hasSideNav = false,
  showServiceRedirectAlert = false,
}: PropsWithChildren<{
  user?: User
  hasSideNav?: boolean
  showServiceRedirectAlert?: boolean
}>): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const [serviceRedirectAlert, setServiceRedirectAlert] = useState(false)
  const [config, setConfig] = useState<Config | undefined>(undefined)
  const router = useRouter()

  const { t, lang } = useTranslation("common")

  useEffect(() => {
    const init = async () => {
      const { returnToServiceId: serviceId } = router.query
      if (serviceId) {
        const services = (await profileManagementAPI(
          true
        ).getConnectedServices()) as schemas.ConnectedService[]
        const service = services.find((service) => service.id === serviceId)
        if (service) {
          setCookies("redirectServiceName", service.name[lang as Language])
          setCookies("redirectServiceUrl", service.link[lang as Language])
          setServiceRedirectAlert(true)
        }
      } else if (getCookie("redirectServiceName")) {
        setServiceRedirectAlert(true)
      }

      const config = await profileManagementAPI().getConfig()
      if (!("error" in config)) setConfig(config)
    }
    init()
  }, [router, lang])

  const showEnvAlert = (config: Config) => {
    return config && ["dev", "astest", "qa"].includes(config.environment)
  }

  return (
    <div css={root}>
      <SkipLink href="#main">{t("toMain")}</SkipLink>
      {hasSideNav && <SkipLink href="#sidenav">{t("toSideNav")}</SkipLink>}

      <Global />

      <div>
        <Header css={menuOpen ? header : undefined}>
          <Container css={headerContainer}>
            <div css={{ lineHeight: 0 }} id="auroraai-main">
              <NextLink href="/">
                <a>
                  <AuroraAILogo
                    aria-label={t("common:logoLabel")}
                    width="100px"
                    height="36px"
                    css={{ cursor: "pointer" }}
                  />
                </a>
              </NextLink>
            </div>
            <div css={headerSide}>
              <LanguageSelector css={languageSelector} />

              {user && (
                <div css={userInfo}>
                  <div css={{ fontWeight: "bold" }}>{user.email}</div>
                  <NextLink href="/logout" passHref>
                    <a id="logout-button" css={logOutLink}>
                      {t("logOut")}
                    </a>
                  </NextLink>
                </div>
              )}

              <div css={menuButtonContainer}>
                <Button
                  variant="secondaryNoBorder"
                  aria-label={t(menuOpen ? "closeMenu" : "openMenu")}
                  aria-expanded={menuOpen}
                  aria-haspopup
                  aria-controls="mainMenu"
                  id="mainMenuButton"
                  onClick={() => setMenuOpen(!menuOpen)}
                  css={menuButton}
                >
                  <Icon
                    icon="menu"
                    aria-label="Valikko"
                    css={{
                      color: suomifiDesignTokens.colors.blackBase,
                      width: "1.5rem",
                      height: "1.5rem",
                    }}
                  />
                </Button>
                <MenuPopover
                  user={user}
                  style={{
                    display: menuOpen ? undefined : "none",
                  }}
                  id="mainMenu"
                  aria-labelledby="mainMenuButton"
                  tabIndex={-1}
                />
              </div>
            </div>
          </Container>
        </Header>

        {config && config.environment && showEnvAlert(config) && (
          <EnvironmentAlert environment={config.environment} />
        )}
        {config && config.announcements.length > 0 && (
          <AnnouncementAlert announcement={config.announcements[0]} />
        )}

        {showServiceRedirectAlert && user && serviceRedirectAlert && (
          <RedirectToServiceAlert
            onClose={() => {
              setServiceRedirectAlert(false)
            }}
          />
        )}
        {children}
      </div>

      <Footer
        css={{
          marginTop: suomifiDesignTokens.spacing.xxxxl,
        }}
      >
        <Container css={footerContainer}>
          <SuomifiLogo
            aria-label="Suomi.fi logo"
            css={{
              width: "200px",
            }}
          />

          <div css={footerGrid}>
            <div>{t("footer.info")}</div>
            <div css={footerLinks}>
              <ExternalLink
                id="link-privacy-policy"
                href={
                  lang === "sv"
                    ? "https://dvv.fi/sv/dataskyddsbeskrivningar"
                    : "https://dvv.fi/tietosuojaselosteet"
                }
                target="_blank"
                rel="noopener noreferrer nofollow"
                labelNewWindow={t("opensToNewWindow")}
              >
                {t("footer.privacyPolicy")}
              </ExternalLink>
              <NavigationLink id="link-about-service" href="/read-more">
                {t("footer.aboutService")}
              </NavigationLink>
            </div>
          </div>
        </Container>
      </Footer>
    </div>
  )
}
