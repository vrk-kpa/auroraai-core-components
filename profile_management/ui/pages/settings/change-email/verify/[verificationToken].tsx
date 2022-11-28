import { NextPage } from "next"
import { Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../../../components/Layout"
import { Box } from "../../../../components/styles/Box"
import { MediumContainer } from "../../../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import {
  getUserProps,
  Refetchable,
  withRefetchables,
} from "../../../../api/apiSession"
import { useRouter } from "next/router"
import { redirect } from "../../../../utils/redirect"
import {
  profileManagementAPI,
  User,
} from "../../../../api/profileManagementApi"
import {
  UserContext,
  useUpdateUserContextWithProps,
} from "../../../../contexts/user"
import { useContext, useEffect, useMemo } from "react"
import { useAsyncProps } from "../../../../hooks/useAsyncProps"
import { useState } from "react"
import { Head } from "../../../../components/Head"
import { Main } from "../../../../components/Main"
import { ErrorAlert } from "../../../../components/ErrorAlert"
import { LoadingSpinner } from "../../../../components/LoadingSpinner"
import { APIError } from "../../../../utils/errors"

const SettingsChangeEmailVerify: NextPage<
  Refetchable<{ user: User } | { error: string }> & {
    verificationToken: string
  }
> = (initialProps) => {
  const { user } = useContext(UserContext)

  const { props } = useAsyncProps(
    initialProps,
    getUserProps,
    useMemo(() => ({ user }), [user])
  )

  useUpdateUserContextWithProps(props)

  const { t } = useTranslation("settingsChangeEmailVerify")

  const router = useRouter()

  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<APIError>()

  useEffect(() => {
    const completeEmailChange = async () => {
      setIsBusy(true)

      const completionResponse = await profileManagementAPI(
        true
      ).verifyEmailChange({ token: initialProps.verificationToken })

      if ("error" in completionResponse) {
        setError(completionResponse)
        setIsBusy(false)
        return
      }

      await router.push("/settings/change-email/success")
    }

    completeEmailChange()
  }, [initialProps.verificationToken, router])

  return (
    <Layout user={user}>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="change-email-verify-heading"
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
            {error ? (
              <ErrorAlert error={error} />
            ) : (
              isBusy && <LoadingSpinner msg={t("performEmailVerification")} />
            )}
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

const stubProps = {
  verificationToken: "",
  error: "",
}

SettingsChangeEmailVerify.getInitialProps = async (ctx) => {
  const verificationToken = ctx.query.verificationToken?.toString()

  if (!verificationToken) {
    redirect("/", ctx)
    return stubProps
  }

  const data = await withRefetchables((ctx) => getUserProps({}, ctx))(ctx)

  return {
    ...data,
    verificationToken,
  }
}

export default SettingsChangeEmailVerify
