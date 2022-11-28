import { NextPage } from "next"
import { getUserProps, Refetchable, withRefetchables } from "../api/apiSession"
import { User } from "../api/profileManagementApi"
import { Main } from "../components/Main"
import Layout from "../components/Layout"
import {
  Button,
  Heading,
  Paragraph,
  suomifiDesignTokens,
} from "suomifi-ui-components"
import { Container } from "../components/styles/Container"
import { Box } from "../components/styles/Box"
import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router"
import { Head } from "../components/Head"
import { UserContext, useUpdateUserContextWithProps } from "../contexts/user"
import { useContext } from "react"
import { useMemo } from "react"
import { useAsyncProps } from "../hooks/useAsyncProps"
import { APIError } from "../utils/errors"
import { redirectToExternal } from "../utils/redirect"

type NavigationProps = { user: User } | APIError

const Navigation: NextPage<Refetchable<NavigationProps>> = (initialProps) => {
  const { t } = useTranslation("navigation")

  const router = useRouter()

  const { user } = useContext(UserContext)

  const { props } = useAsyncProps(
    initialProps,
    getUserProps,
    useMemo(
      () => ({
        user,
      }),
      [user]
    )
  )

  useUpdateUserContextWithProps(props)

  const serviceName: string = router.query.servicename as string
  const serviceUrl: string = router.query.serviceurl as string
  const serviceId: string = router.query.serviceid as string

  return (
    <Layout user={user}>
      <Head pageName={t("title")} />

      <Main>
        <Container size="small" center>
          <Heading
            id="authorize-heading"
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
              padding: suomifiDesignTokens.spacing.insetXxl,
            }}
          >
            <Paragraph marginBottomSpacing="m">
              {t("description", { service: serviceName })}
            </Paragraph>
            <div
              css={{
                marginTop: suomifiDesignTokens.spacing.l,
                display: "flex",
                gap: suomifiDesignTokens.spacing.s,
              }}
            >
              <Button
                id="go-to-service-button"
                disabled={false}
                onClick={() => redirectToExternal(serviceUrl)}
              >
                {t("goToService")}
              </Button>
              <Button
                id="go-to-profile-button"
                disabled={false}
                onClick={() =>
                  router.push(`/profile?returnToServiceId=${serviceId}`)
                }
              >
                {t("goToProfile")}
              </Button>
            </div>
          </Box>
        </Container>
      </Main>
    </Layout>
  )
}

Navigation.getInitialProps = withRefetchables((ctx) => getUserProps({}, ctx))

export default Navigation
