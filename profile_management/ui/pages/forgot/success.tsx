import { NextPage } from "next"
import { Button, Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../components/Layout"
import { Box } from "../../components/styles/Box"
import { MediumContainer } from "../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router"
import { Head } from "../../components/Head"
import { Main } from "../../components/Main"
import { MultilineParagraph } from "../../components/MultilineParagraph"

const ForgotSuccess: NextPage = () => {
  const { t } = useTranslation("forgotSuccess")

  const router = useRouter()

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="forgot-success-heading"
            variant="h1"
            style={{
              marginTop: suomifiDesignTokens.spacing.xxxl,
              marginBottom: suomifiDesignTokens.spacing.m,
            }}
          >
            {t("heading")}
          </Heading>
          <Box
            style={{
              padding: suomifiDesignTokens.spacing.insetXl,
            }}
          >
            <MultilineParagraph text={t("intro")} marginBottomSpacing="m" />

            <Button variant="default" onClick={() => router.push("/login")}>
              {t("common:signIn")}
            </Button>
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

ForgotSuccess.getInitialProps = () => ({})

export default ForgotSuccess
