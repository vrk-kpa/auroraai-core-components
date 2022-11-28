import { NextPage } from "next"
import { Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../../components/Layout"
import { Box } from "../../../components/styles/Box"
import { MediumContainer } from "../../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import {
  getUserProps,
  Refetchable,
  withRefetchables,
} from "../../../api/apiSession"
import { redirect } from "../../../utils/redirect"
import { User } from "../../../api/profileManagementApi"
import {
  UserContext,
  useUpdateUserContextWithProps,
} from "../../../contexts/user"
import { useContext, useMemo } from "react"
import { useAsyncProps } from "../../../hooks/useAsyncProps"
import { Head } from "../../../components/Head"
import { Main } from "../../../components/Main"
import { MultilineParagraph } from "../../../components/MultilineParagraph"

const SettingsChangeEmailSent: NextPage<
  Refetchable<{ user: User } | { error: string }> & { email: string }
> = (initialProps) => {
  const { user } = useContext(UserContext)

  const { props } = useAsyncProps(
    initialProps,
    getUserProps,
    useMemo(() => ({ user }), [user])
  )

  useUpdateUserContextWithProps(props)

  const { t } = useTranslation("settingsChangeEmailSent")

  return (
    <Layout user={user}>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="change-email-sent-heading"
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

SettingsChangeEmailSent.getInitialProps = async (ctx) => {
  const email = ctx.query.email?.toString()

  if (!email) {
    redirect("/", ctx)
    return { email: "", token: "", error: "" }
  }

  const data = await withRefetchables((ctx) => getUserProps({}, ctx))(ctx)

  return {
    ...data,
    email,
  }
}

export default SettingsChangeEmailSent
