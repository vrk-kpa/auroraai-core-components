import { NextPage } from "next"
import useTranslation from "next-translate/useTranslation"
import React from "react"
import {
  Heading,
  Paragraph,
  Text,
  suomifiDesignTokens,
} from "suomifi-ui-components"
import { Head } from "../../components/Head"
import Layout from "../../components/Layout"
import { Box } from "../../components/styles/Box"
import { MediumContainer } from "../../components/styles/MediumContainer"
import { redirect } from "../../utils/redirect"
import { isLeft } from "fp-ts/Either"
import * as schemas from "shared/schemas"
import { censorEmail } from "../../utils/email"
import { Main } from "../../components/Main"

const RegisterConfirmationSent: NextPage<{
  email: schemas.EmailAddress
}> = ({ email }) => {
  const { t } = useTranslation("registerConfirmationSent")

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="confirmation-sent-heading"
            variant="h1"
            css={{
              marginTop: suomifiDesignTokens.spacing.xxxl,
              marginBottom: suomifiDesignTokens.spacing.m,
            }}
          >
            {t("heading")}
          </Heading>

          <Box
            css={{
              padding: suomifiDesignTokens.spacing.insetXl,
            }}
          >
            <Paragraph marginBottomSpacing="xxl">
              <Text>
                {email === "generic-email"
                  ? t("instructionsGeneric")
                  : t("instructions", { email: censorEmail(email) })}
              </Text>
            </Paragraph>
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

RegisterConfirmationSent.getInitialProps = (ctx) => {
  const email = ctx.query.email?.toString()

  if (!email) {
    redirect("/", ctx)
    return { email: "" as schemas.EmailAddress }
  }

  const decoded = schemas.EmailAddress.decode(email)

  if (isLeft(decoded)) {
    redirect("/", ctx)
    return { email: "" as schemas.EmailAddress }
  }

  return {
    email: decoded.right,
  }
}

export default RegisterConfirmationSent
