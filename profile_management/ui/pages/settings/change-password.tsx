import { NextPage } from "next"
import { useContext, useState } from "react"
import { Button, Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../components/Layout"
import { Box } from "../../components/styles/Box"
import { MediumContainer } from "../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useForm } from "react-hook-form"
import { ioTsResolver } from "@hookform/resolvers/io-ts"
import { PasswordInput } from "../../components/PasswordInput"
import { Row } from "../../components/styles/Row"
import { useRouter } from "next/router"
import { profileManagementAPI, User } from "../../api/profileManagementApi"
import {
  getUserProps,
  Refetchable,
  withRefetchables,
} from "../../api/apiSession"
import { UserContext, useUpdateUserContextWithProps } from "../../contexts/user"
import { useMemo } from "react"
import { PasswordCriteriaForm } from "../../components/PasswordCriteriaForm"
import { PasswordCriteriaFormInput } from "../../components/PasswordCriteriaFormInput"
import { useAsyncProps } from "../../hooks/useAsyncProps"
import { ChangePasswordForm } from "../../schemas"
import { Head } from "../../components/Head"
import { Main } from "../../components/Main"
import { ErrorAlert } from "../../components/ErrorAlert"
import { MultilineParagraph } from "../../components/MultilineParagraph"
import { InfoAlert } from "../../components/InfoAlert"
import { getPasswordExpiresInDays, isExpiringSoon } from "../../utils/password"
import { APIError } from "../../utils/errors"

const SettingsChangePassword: NextPage<
  Refetchable<{ user: User } | { error: string }>
> = (initialProps) => {
  const { user } = useContext(UserContext)
  const passwordExpiresInDays = user
    ? getPasswordExpiresInDays(user.passwordExpirationDate)
    : 360

  const { props } = useAsyncProps(
    initialProps,
    getUserProps,
    useMemo(() => ({ user }), [user])
  )

  useUpdateUserContextWithProps(props)

  const { t, lang } = useTranslation("settingsChangePassword")

  const router = useRouter()

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    watch,
    getValues,
  } = useForm<ChangePasswordForm>({
    resolver: ioTsResolver(ChangePasswordForm),
    mode: "onBlur",
  })

  const newPassword = watch("newPassword")
  const newPasswordConfirm = watch("newPasswordConfirm")

  const [error, setError] = useState<APIError>()

  const [passwordMismatch, setPasswordMismatch] = useState(false)

  const checkPasswordMatch = () => {
    setPasswordMismatch(
      newPasswordConfirm?.valueOf() !== newPassword?.valueOf()
    )
  }

  const onSubmit = handleSubmit(async ({ oldPassword, newPassword }) => {
    if (!passwordMismatch) {
      setError(undefined)

      const response = await profileManagementAPI(true).changePassword({
        oldPassword,
        newPassword,
        notificationLanguage: lang,
      })

      if ("error" in response) {
        setError(response)
        return
      }

      if (response.success)
        user
          ? (user.passwordExpirationDate = response.passwordExpirationDate)
          : "n/a"

      await router.push("/settings/change-password/completed")
    }
  })

  return (
    <Layout user={user}>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="change-password-heading"
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
            {isExpiringSoon(passwordExpiresInDays) && (
              <InfoAlert
                msg={{
                  key:
                    passwordExpiresInDays == 0
                      ? "passwordExpiringToday"
                      : "passwordExpiring",
                  param: passwordExpiresInDays,
                }}
              />
            )}
            <MultilineParagraph text={t("intro")} marginBottomSpacing="m" />

            <form onSubmit={onSubmit}>
              {error && <ErrorAlert error={error} />}

              <PasswordCriteriaForm password={newPassword ?? ""}>
                <div
                  css={{
                    marginBottom: suomifiDesignTokens.spacing.s,
                  }}
                >
                  <PasswordInput
                    id="oldPassword"
                    name="oldPassword"
                    labelText={t("oldPassword")}
                    control={control}
                    autoComplete="current-password"
                  />
                </div>

                <PasswordCriteriaFormInput
                  id="newPassword"
                  name="newPassword"
                  labelText={t("newPassword")}
                  control={control}
                  onBlur={() => checkPasswordMatch()}
                />

                <PasswordInput
                  id="newPasswordConfirm"
                  name="newPasswordConfirm"
                  labelText={t("common:newPasswordConfirm")}
                  control={control}
                  customError={
                    getValues("newPasswordConfirm")?.length > 0 &&
                    passwordMismatch
                      ? t("common:passwordMismatch")
                      : undefined
                  }
                  onBlur={() => checkPasswordMatch()}
                  autoComplete="off"
                />
              </PasswordCriteriaForm>

              <Row gap={suomifiDesignTokens.spacing.s}>
                <Button
                  id="change-password-submit"
                  variant="default"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {t("submit")}
                </Button>
                <Button
                  id="change-password-cancel"
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

SettingsChangePassword.getInitialProps = withRefetchables((ctx) =>
  getUserProps({}, ctx)
)

export default SettingsChangePassword
