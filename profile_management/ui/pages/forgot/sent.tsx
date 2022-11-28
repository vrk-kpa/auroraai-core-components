import { NextPage } from "next"
import { Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../components/Layout"
import { Box } from "../../components/styles/Box"
import { MediumContainer } from "../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { redirect } from "../../utils/redirect"
import { Head } from "../../components/Head"
import { Main } from "../../components/Main"
import { MultilineParagraph } from "../../components/MultilineParagraph"

const ForgotSent: NextPage = () => {
  const { t } = useTranslation("forgotSent")

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="forgot-password-sent-heading"
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
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

ForgotSent.getInitialProps = (ctx): { email: string } => {
  const email = ctx.query.email?.toString()

  if (!email) {
    redirect("/", ctx)
    return { email: "" }
  }

  return {
    email,
  }
}

export default ForgotSent
