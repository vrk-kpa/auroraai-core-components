import { NextPage } from "next"
import { useState } from "react"
import {
  Button,
  Heading,
  suomifiDesignTokens,
  Paragraph,
  Text,
} from "suomifi-ui-components"
import Layout from "../components/Layout"
import { Box } from "../components/styles/Box"
import { MediumContainer } from "../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useForm } from "react-hook-form"
import { ioTsResolver } from "@hookform/resolvers/io-ts"
import { ForgotForm } from "../schemas"
import { Input } from "../components/Input"
import { Row } from "../components/styles/Row"
import { useRouter } from "next/router"
import { profileManagementAPI } from "../api/profileManagementApi"
import { Head } from "../components/Head"
import { Main } from "../components/Main"
import { ErrorAlert } from "../components/ErrorAlert"
import { MultilineParagraph } from "../components/MultilineParagraph"
import { APIError } from "../utils/errors"

const Forgot: NextPage = () => {
  const { t, lang } = useTranslation("forgot")

  const router = useRouter()

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<ForgotForm>({
    resolver: ioTsResolver(ForgotForm),
    mode: "onBlur",
  })

  const [error, setError] = useState<APIError>()

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(undefined)

    const response = await profileManagementAPI().forgotPassword({
      email,
      language: lang,
    })

    if ("error" in response) {
      setError(response)
      return
    }

    await router.push(
      `/forgot/sent?${new URLSearchParams({
        email: response.codeDeliveredTo ?? "generic-email",
      }).toString()}`,
      "/forgot/sent"
    )
  })

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="forgot-password-heading"
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

            <Paragraph marginBottomSpacing="m">
              <Text variant="bold">{t("introSubheading")}</Text>
            </Paragraph>

            <form onSubmit={onSubmit}>
              {error && <ErrorAlert error={error} />}

              <div css={{ marginBottom: suomifiDesignTokens.spacing.m }}>
                <Input
                  name="email"
                  labelText={t("common:email")}
                  visualPlaceholder={t("common:emailPlaceholder")}
                  control={control}
                  autoComplete="email"
                />
              </div>

              <Row gap={suomifiDesignTokens.spacing.s}>
                <Button
                  id="forgot-password-submit-button"
                  variant="default"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {t("submit")}
                </Button>
                <Button
                  id="forgot-password-cancel-button"
                  variant="secondary"
                  type="reset"
                  onClick={() => router.push("/")}
                >
                  {t("common:cancel")}
                </Button>
              </Row>
            </form>
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

Forgot.getInitialProps = () => ({})

export default Forgot
