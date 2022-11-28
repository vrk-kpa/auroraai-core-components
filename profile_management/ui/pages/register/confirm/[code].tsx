import { NextPage } from "next"
import React, { useState, useEffect } from "react"
import {
  Button,
  Heading,
  Paragraph,
  suomifiDesignTokens,
  Icon,
} from "suomifi-ui-components"
import { Head } from "../../../components/Head"
import Layout from "../../../components/Layout"
import { Box } from "../../../components/styles/Box"
import { MediumContainer } from "../../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router"
import { redirect } from "../../../utils/redirect"
import { profileManagementAPI } from "../../../api/profileManagementApi"
import * as schemas from "shared/schemas"
import { isLeft } from "fp-ts/lib/Either"
import { Main } from "../../../components/Main"
import { ErrorAlert } from "../../../components/ErrorAlert"
import { LoadingSpinner } from "../../../components/LoadingSpinner"
import { Alert } from "../../../components/styles/Alert"
import { APIError } from "../../../utils/errors"

enum ResendState {
  IDLE,
  LOADING,
  SUCCESS,
}

const RegisterConfirmation: NextPage<{
  email: schemas.EmailAddress
  confirmationCode: schemas.CognitoCode
}> = ({ email, confirmationCode }) => {
  const router = useRouter()

  const { t, lang } = useTranslation("registerConfirmation")

  const [resendState, setResendState] = useState<ResendState>(ResendState.IDLE)
  const [resendError, setResendError] = useState<APIError>()

  const handleResend = () => {
    setResendState(ResendState.LOADING)
    setResendError(undefined)

    profileManagementAPI()
      .resendConfirmSignUp({
        email,
        language: lang,
      })
      .then((response) => {
        if ("error" in response) {
          setResendState(ResendState.IDLE)
          setResendError(response)
          return
        }

        setResendState(ResendState.SUCCESS)
      })
  }

  const [error, setError] = useState<APIError>()

  useEffect(() => {
    const onConfirm = async () => {
      const response = await profileManagementAPI().confirmSignUp({
        email,
        confirmationCode,
        language: lang,
      })

      if ("error" in response) {
        setError(response)
        return
      }

      const returnUrl = router.query.returnUrl?.toString() || ""

      await router.push(
        `/register/success?${new URLSearchParams({
          email,
          returnUrl: encodeURIComponent(returnUrl),
        }).toString()}`,
        "/register/success"
      )
    }

    onConfirm()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="confirm-heading"
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
            {error ? (
              <>
                {resendError && <ErrorAlert error={resendError} />}

                {resendState === ResendState.SUCCESS ? (
                  <Alert
                    id="confirm-success-alert"
                    css={{
                      marginBottom: suomifiDesignTokens.spacing.s,
                    }}
                    variant="success"
                  >
                    <Icon
                      icon="checkCircle"
                      fill={suomifiDesignTokens.colors.successBase}
                      css={{
                        width: "1.5rem",
                        height: "1.5rem",
                      }}
                    />
                    {t("resendSuccess")}
                  </Alert>
                ) : (
                  <>
                    <Paragraph marginBottomSpacing="xxl">
                      <ErrorAlert error={error} />
                    </Paragraph>
                    <Button
                      id="confirmation_resend"
                      onClick={() => handleResend()}
                      disabled={resendState === ResendState.LOADING}
                    >
                      {t("resend")}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <LoadingSpinner msg={t("performRegistration")} />
            )}
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

const stubProps = {
  email: "" as schemas.EmailAddress,
  confirmationCode: "" as schemas.CognitoCode,
}

RegisterConfirmation.getInitialProps = (ctx) => {
  const email = ctx.query.email?.toString()
  const confirmationCode = ctx.query.code?.toString()

  if (!email || !confirmationCode) {
    redirect("/", ctx)
    return stubProps
  }

  const decodedEmail = schemas.EmailAddress.decode(email)

  if (isLeft(decodedEmail)) {
    redirect("/", ctx)
    return stubProps
  }

  const decodedConfirmationCode = schemas.CognitoCode.decode(confirmationCode)

  if (isLeft(decodedConfirmationCode)) {
    redirect("/", ctx)
    return stubProps
  }

  return {
    email: decodedEmail.right,
    confirmationCode: decodedConfirmationCode.right,
  }
}

export default RegisterConfirmation
