import { NextPage } from "next"
import { Fragment } from "react"
import {
  Button,
  Heading,
  suomifiDesignTokens,
  Paragraph,
  Text,
  Block,
} from "suomifi-ui-components"

import Layout from "../components/Layout"
import { Box } from "../components/styles/Box"
import { TabsContainer } from "../components/styles/TabsContainer"
import { MediumContainer } from "../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router"
import { Head } from "../components/Head"
import { Main } from "../components/Main"
import { Tab, Tabs, TabList, TabPanel } from "react-tabs"
import Trans from "next-translate/Trans"
import NextLink from "next/link"

const About: NextPage = () => {
  const { t } = useTranslation("about")

  const router = useRouter()

  const tabParagraphs = (tabIndex: number, paragraphCount: number) => (
    <Fragment>
      {[...Array(paragraphCount)].map((_x, i) => (
        <Fragment key={i + 1}>
          <Paragraph marginBottomSpacing="m">
            <Text variant="bold">
              {t(`tab${tabIndex}.paragraph${i + 1}.heading`)}
            </Text>
          </Paragraph>

          <Block css={{ marginBottom: suomifiDesignTokens.spacing.m }}>
            <Trans
              i18nKey={`about:tab${tabIndex}.paragraph${i + 1}.content`}
              components={{
                ul: <ul />,
                li: <li />,
                a: <NextLink href="/" />,
                br: (
                  <p style={{ marginBottom: suomifiDesignTokens.spacing.m }} />
                ),
              }}
            />
          </Block>
        </Fragment>
      ))}
    </Fragment>
  )

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <TabsContainer>
            <Tabs>
              <TabList id="aurora-ai-tablist">
                <Tab>{t("tab1.title")}</Tab>
                <Tab>{t("tab2.title")}</Tab>
              </TabList>

              <TabPanel>
                <Heading
                  id="auroraai-about-heading"
                  variant="h1"
                  style={{
                    marginTop: suomifiDesignTokens.spacing.xxl,
                    marginBottom: suomifiDesignTokens.spacing.m,
                  }}
                >
                  {t("tab1.heading")}
                </Heading>
                <Box
                  id="auroraai-about-network"
                  className="auroraai-about-content"
                >
                  {tabParagraphs(
                    1,
                    Number.parseInt(t("tab1.paragraphCount")) | 2
                  )}

                  <Button
                    id="back-button"
                    variant="default"
                    onClick={() => router.back()}
                  >
                    {t("common:backToPreviousPage")}
                  </Button>
                </Box>
              </TabPanel>

              <TabPanel>
                <Heading
                  id="auroraai-about-tab2-heading"
                  variant="h1"
                  style={{
                    marginTop: suomifiDesignTokens.spacing.xxl,
                    marginBottom: suomifiDesignTokens.spacing.m,
                  }}
                >
                  {t("tab2.heading")}
                </Heading>
                <Box
                  id="auroraai-about-account"
                  className="auroraai-about-content"
                >
                  <Block
                    style={{ marginBottom: suomifiDesignTokens.spacing.xxl }}
                  >
                    <Trans
                      i18nKey="about:tab2.intro"
                      components={{
                        ul: <ul />,
                        li: <li />,
                      }}
                    />
                  </Block>
                  {tabParagraphs(
                    2,
                    Number.parseInt(t("tab2.paragraphCount")) | 2
                  )}

                  <Button
                    id="back-button"
                    variant="default"
                    onClick={() => router.back()}
                  >
                    {t("common:backToPreviousPage")}
                  </Button>
                </Box>
              </TabPanel>
            </Tabs>
          </TabsContainer>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

export default About
