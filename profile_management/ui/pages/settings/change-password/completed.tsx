import { NextPage } from "next"
import { Button, Heading, suomifiDesignTokens } from "suomifi-ui-components"
import Layout from "../../../components/Layout"
import { Box } from "../../../components/styles/Box"
import { MediumContainer } from "../../../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import {
  getUserProps,
  Refetchable,
  withRefetchables,
} from "../../../api/apiSession"
import { useRouter } from "next/router"
import { User } from "../../../api/profileManagementApi"
import {
  UserContext,
  useUpdateUserContextWithProps,
} from "../../../contexts/user"
import { useContext } from "react"
import { useAsyncProps } from "../../../hooks/useAsyncProps"
import { Head } from "../../../components/Head"
import { Main } from "../../../components/Main"
import { MultilineParagraph } from "../../../components/MultilineParagraph"

const SettingsChangePasswordCompleted: NextPage<
  Refetchable<{ user: User } | { error: string }>
> = (initialProps) => {
  const { props } = useAsyncProps(
    initialProps,
    getUserProps,
    useContext(UserContext)
  )

  useUpdateUserContextWithProps(props)

  const { t } = useTranslation("settingsChangePasswordCompleted")

  const router = useRouter()

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="change-password-completed-heading"
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

            <Button
              id="go-to-frontpage"
              variant="default"
              onClick={() => {
                router.push("/")
              }}
            >
              {t("common:goToFrontpage")}
            </Button>
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

SettingsChangePasswordCompleted.getInitialProps = withRefetchables((ctx) =>
  getUserProps({}, ctx)
)

export default SettingsChangePasswordCompleted
