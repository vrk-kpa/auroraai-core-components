import { NextPage } from "next"
import { useContext, useMemo, useState } from "react"
import { Button, Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../components/Layout"
import { Box } from "../../components/styles/Box"
import { MediumContainer } from "../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useForm } from "react-hook-form"
import { ioTsResolver } from "@hookform/resolvers/io-ts"
import { ChangeEmailForm } from "../../schemas"
import { Input } from "../../components/Input"
import { Row } from "../../components/styles/Row"
import { useRouter } from "next/router"
import { profileManagementAPI, User } from "../../api/profileManagementApi"
import {
  getUserProps,
  Refetchable,
  withRefetchables,
} from "../../api/apiSession"
import { UserContext, useUpdateUserContextWithProps } from "../../contexts/user"
import { useAsyncProps } from "../../hooks/useAsyncProps"
import { Head } from "../../components/Head"
import { Main } from "../../components/Main"
import { ErrorAlert } from "../../components/ErrorAlert"
import { MultilineParagraph } from "../../components/MultilineParagraph"
import { EmailAddress, isValidEmail } from "shared/schemas"
import { APIError } from "../../utils/errors"

const SettingsChangeEmail: NextPage<
  Refetchable<{ user: User } | { error: string }>
> = (initialProps) => {
  const { user } = useContext(UserContext)

  const { props } = useAsyncProps(
    initialProps,
    getUserProps,
    useMemo(() => ({ user }), [user])
  )

  useUpdateUserContextWithProps(props)

  const { t, lang } = useTranslation("settingsChangeEmail")

  const router = useRouter()

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    getValues,
  } = useForm<ChangeEmailForm>({
    resolver: ioTsResolver(ChangeEmailForm),
    mode: "onBlur",
  })

  const [error, setError] = useState<APIError>()

  const onSubmit = handleSubmit(async ({ email }) => {
    if (!props) return
    if (await isEmailInUse(email)) return

    setError(undefined)

    const response = await profileManagementAPI(true).changeEmail({
      email: user?.email as EmailAddress,
      newEmail: email,
      language: lang,
    })

    if ("error" in response) {
      setError(response)
      return
    }

    await router.push(
      `/settings/change-email/sent?${new URLSearchParams({
        email: response.codeDeliveredTo ?? "generic-email",
      })}`,
      "/settings/change-email/sent"
    )
  })

  const [emailInUse, setEmailInUse] = useState(false)

  const isEmailInUse = async (email: string) => {
    const response = await profileManagementAPI().checkEmailAvailability(email)

    if (typeof response != "boolean" && "error" in response) {
      setError(response)
      return true
    }
    return !response
  }

  const updateEmailInUseState = async () => {
    const email = getValues("email")
    if (!email || !isValidEmail(email)) return

    const emailInUse = await isEmailInUse(email)
    setEmailInUse(emailInUse)
  }

  return (
    <Layout user={user}>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="change-email-heading"
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

              <div
                css={{
                  marginBottom: suomifiDesignTokens.spacing.s,
                }}
              >
                <Input
                  name="email"
                  labelText={t("newEmail")}
                  visualPlaceholder={t("common:emailPlaceholder")}
                  type="email"
                  control={control}
                  onBlur={() => updateEmailInUseState()}
                  onFocus={() => setEmailInUse(false)}
                  customError={emailInUse ? t("emailInUse") : undefined}
                  autoComplete="email"
                />
              </div>

              <Row gap={suomifiDesignTokens.spacing.s}>
                <Button
                  id="change-email-submit"
                  variant="default"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {t("submit")}
                </Button>
                <Button
                  id="change-email-cancel"
                  variant="secondary"
                  type="reset"
                  onClick={() => router.back()}
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

SettingsChangeEmail.getInitialProps = withRefetchables((ctx) =>
  getUserProps({}, ctx)
)

export default SettingsChangeEmail
