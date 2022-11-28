import { NextPage, NextPageContext } from "next"
import { useContext, useMemo, useState } from "react"
import {
  Heading,
  suomifiDesignTokens,
  Paragraph,
  Text,
  Button,
  Icon,
} from "suomifi-ui-components"
import Layout from "../../components/Layout"
import { Box } from "../../components/styles/Box"
import { MediumContainer } from "../../components/styles/MediumContainer"
import { Container } from "../../components/styles/Container"
import useTranslation from "next-translate/useTranslation"
import { profileManagementAPI, User } from "../../api/profileManagementApi"
import { Refetchable, withRefetchables } from "../../api/apiSession"
import { UserContext, useUpdateUserContextWithProps } from "../../contexts/user"
import { useAsyncProps } from "../../hooks/useAsyncProps"
import { Head } from "../../components/Head"
import { Main } from "../../components/Main"
import { ErrorAlert } from "../../components/ErrorAlert"
import { Alert } from "../../components/styles/Alert"
import { Row } from "../../components/styles/Row"
import { useRouter } from "next/router"
import { AccountDeletionConfirmationModal } from "../../components/AccountDeletionConfirmationModal"
import { MultilineParagraph } from "../../components/MultilineParagraph"
import { APIError } from "../../utils/errors"

const getProps = async ({ user }: { user?: User }, ctx?: NextPageContext) => {
  const [userData] = await Promise.all([
    user ?? profileManagementAPI(true, ctx).getUser(),
  ])

  return {
    user: userData,
  }
}

const SettingsDeleteAccount: NextPage<
  Refetchable<{
    user: User | APIError
  }>
> = (initialProps) => {
  const router = useRouter()

  const { user } = useContext(UserContext)

  const { props } = useAsyncProps(
    initialProps,
    getProps,
    useMemo(() => ({ user }), [user])
  )

  useUpdateUserContextWithProps(props)

  const { t } = useTranslation("settingsDeleteAccount")

  const [error, setError] = useState<APIError>()
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false)
  const [success, setSuccess] = useState(false)

  const onDelete = async () => {
    setIsLoading(true)

    const error = await profileManagementAPI(true).deleteUser()

    if ("error" in error) {
      setIsLoading(false)
      setError(error)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  return (
    <Layout user={user}>
      <Head pageName={t("title")} />

      <AccountDeletionConfirmationModal
        visible={confirmationModalVisible}
        close={(didDelete) => {
          if (didDelete) {
            onDelete()
          }

          setConfirmationModalVisible(false)
        }}
      />

      <Main>
        <MediumContainer center>
          <Heading
            id="delete-account-heading"
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
            {success ? (
              <Container id="delete-account-success" center>
                <Alert
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
                  {t("success")}
                </Alert>
                <Button
                  id="delete-account-success-ok"
                  css={{
                    display: "block",
                    margin: "auto",
                  }}
                  onClick={() => {
                    router.push("/logout")
                  }}
                >
                  {t("common:ok")}
                </Button>
              </Container>
            ) : (
              <>
                {!props ? (
                  t("loading")
                ) : (
                  <>
                    {error && <ErrorAlert error={error} />}

                    <MultilineParagraph
                      text={t("intro")}
                      marginBottomSpacing="m"
                    />

                    <Paragraph marginBottomSpacing="s">
                      <Text css={{ fontWeight: "bold" }}>{t("warning")}</Text>
                    </Paragraph>
                  </>
                )}

                <Row
                  gap={suomifiDesignTokens.spacing.s}
                  css={{ marginTop: suomifiDesignTokens.spacing.s }}
                >
                  <Button
                    id="delete-account-remove"
                    disabled={isLoading || success}
                    onClick={() => setConfirmationModalVisible(true)}
                  >
                    {t("removeAccount")}
                  </Button>

                  <Button
                    id="delete-account-cancel"
                    variant="secondary"
                    onClick={() => {
                      router.back()
                    }}
                  >
                    {t("common:cancel")}
                  </Button>
                </Row>
              </>
            )}
          </Box>
        </MediumContainer>
      </Main>
    </Layout>
  )
}

SettingsDeleteAccount.getInitialProps = withRefetchables((ctx) =>
  getProps({}, ctx)
)

export default SettingsDeleteAccount
