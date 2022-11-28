import { NextPage } from "next"
import { useState } from "react"
import { Button, Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../../components/Layout"
import { Box } from "../../../components/styles/Box"
import { MediumContainer } from "../../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useForm } from "react-hook-form"
import { ioTsResolver } from "@hookform/resolvers/io-ts"
import { Row } from "../../../components/styles/Row"
import { useRouter } from "next/router"
import { profileManagementAPI } from "../../../api/profileManagementApi"
import { redirect } from "../../../utils/redirect"
import { PasswordCriteriaForm } from "../../../components/PasswordCriteriaForm"
import { PasswordCriteriaFormInput } from "../../../components/PasswordCriteriaFormInput"
import { PasswordInput } from "../../../components/PasswordInput"
import { ForgotResetForm } from "../../../schemas"
import { isLeft } from "fp-ts/lib/Either"
import { Head } from "../../../components/Head"
import { Main } from "../../../components/Main"
import * as schemas from "shared/schemas"
import { ErrorAlert } from "../../../components/ErrorAlert"
import { MultilineParagraph } from "../../../components/MultilineParagraph"
import { APIError } from "../../../utils/errors"

const ForgotReset: NextPage<{
  email: schemas.EmailAddress
  token: schemas.CognitoCode
}> = ({ email, token }) => {
  const { t, lang } = useTranslation("forgotReset")

  const router = useRouter()

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    watch,
    getValues,
  } = useForm<ForgotResetForm>({
    resolver: ioTsResolver(ForgotResetForm),
    mode: "onBlur",
  })

  const password = watch("password")
  const passwordConfirm = watch("passwordConfirm")

  const [error, setError] = useState<APIError>()

  const [passwordMismatch, setPasswordMismatch] = useState(false)

  const checkPasswordMatch = () => {
    setPasswordMismatch(password?.valueOf() !== passwordConfirm?.valueOf())
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!passwordMismatch) {
      setError(undefined)

      const response = await profileManagementAPI().resetPassword({
        email,
        token,
        password,
        notificationLanguage: lang,
      })

      if ("error" in response) {
        setError(response)
        return
      }

      await router.push("/forgot/success")
    }
  })

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="forgot-reset-heading"
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

            <form onSubmit={onSubmit}>
              {error && <ErrorAlert error={error} />}

              <PasswordCriteriaForm password={password ?? ""}>
                <PasswordCriteriaFormInput
                  id="password"
                  name="password"
                  labelText={t("common:password")}
                  control={control}
                  onBlur={() => checkPasswordMatch()}
                />

                <PasswordInput
                  id="passwordConfirm"
                  name="passwordConfirm"
                  labelText={t("common:newPasswordConfirm")}
                  control={control}
                  customError={
                    getValues("passwordConfirm")?.length > 0 && passwordMismatch
                      ? t("common:passwordMismatch")
                      : undefined
                  }
                  onBlur={() => checkPasswordMatch()}
                  autoComplete="off"
                />
              </PasswordCriteriaForm>

              <Row gap={suomifiDesignTokens.spacing.s}>
                <Button variant="default" type="submit" disabled={isSubmitting}>
                  {t("submit")}
                </Button>
                <Button
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

const stubProps = {
  email: "" as schemas.EmailAddress,
  token: "" as schemas.CognitoCode,
}

ForgotReset.getInitialProps = (ctx) => {
  const email = ctx.query.email?.toString()
  const code = ctx.query.code?.toString()

  if (!email || !code) {
    redirect("/", ctx)
    return stubProps
  }

  const decodedEmail = schemas.EmailAddress.decode(email)

  if (isLeft(decodedEmail)) {
    redirect("/", ctx)
    return stubProps
  }

  const decodedCode = schemas.CognitoCode.decode(code)

  if (isLeft(decodedCode)) {
    redirect("/", ctx)
    return stubProps
  }

  return {
    email: decodedEmail.right,
    token: decodedCode.right,
  }
}

export default ForgotReset
