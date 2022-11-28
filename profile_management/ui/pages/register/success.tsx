import { NextPage } from "next"
import {
  Button,
  Heading,
  suomifiDesignTokens,
  Paragraph,
  Text,
} from "suomifi-ui-components"
import Layout from "../../components/Layout"
import { Box } from "../../components/styles/Box"
import { MediumContainer } from "../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router"
import { redirect } from "../../utils/redirect"
import * as schemas from "shared/schemas"
import { isLeft } from "fp-ts/Either"
import { Head } from "../../components/Head"
import { Main } from "../../components/Main"

const RegisterSuccess: NextPage<{ email: schemas.EmailAddress }> = () => {
  const { t } = useTranslation("registerSuccess")

  const router = useRouter()

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="register-success-heading"
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
            <Paragraph marginBottomSpacing="m">
              <Text>{t("intro")}</Text>
            </Paragraph>

            <Button
              id="register-success-sign-in"
              variant="default"
              onClick={() =>
                router.push(`/login?return=${router.query.returnUrl}`, "/login")
              }
            >
              {t("signIn")}
            </Button>
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

RegisterSuccess.getInitialProps = (ctx) => {
  const email = ctx.query.email?.toString()

  if (!email) {
    redirect("/", ctx)
    return { email: "" as schemas.EmailAddress }
  }

  const decodedEmail = schemas.EmailAddress.decode(email)

  if (isLeft(decodedEmail)) {
    redirect("/", ctx)
    return { email: "" as schemas.EmailAddress }
  }

  return {
    email: decodedEmail.right,
  }
}

export default RegisterSuccess
