import { NextPage } from "next"
import { useState } from "react"
import {
  Button,
  Heading,
  suomifiDesignTokens,
  Paragraph,
  Text,
} from "suomifi-ui-components"
import { AuthResponse, profileManagementAPI } from "../api/profileManagementApi"
import Layout from "../components/Layout"
import { Box } from "../components/styles/Box"
import { MediumContainer } from "../components/styles/MediumContainer"
import useTranslation from "next-translate/useTranslation"
import { useForm } from "react-hook-form"
import { ioTsResolver } from "@hookform/resolvers/io-ts"
import { LoginForm } from "../schemas"
import { Input } from "../components/Input"
import { calculateA, generateSmallA, getSRPPasswordKey } from "../utils/srp"
import { getAmazonFormattedDate } from "../utils/date"
import { Row } from "../components/styles/Row"
import { useRouter } from "next/router"
import { NavigationLinkList } from "../components/NavigationLinkList"
import { Head } from "../components/Head"
import { Main } from "../components/Main"
import { ChallengeType } from "shared/cognito-types"
import { ErrorAlert } from "../components/ErrorAlert"
import { MultilineParagraph } from "../components/MultilineParagraph"
import { PasswordExpiredAlert } from "../components/PasswordExpiredAlert"
import { APIError } from "../utils/errors"
import { useUpdateUserContextWithProps } from "../contexts/user"

const cryptoLiner = import("webcrypto-liner")

const Login: NextPage = () => {
  const { t } = useTranslation("login")

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    resolver: ioTsResolver(LoginForm),
    mode: "onBlur",
  })

  const [error, setError] = useState<APIError>()

  const router = useRouter()

  useUpdateUserContextWithProps({ user: undefined }) // Force reloading user data if user visits login page.

  const onLogin = handleSubmit(async ({ email, password }) => {
    setError(undefined)

    try {
      await cryptoLiner

      const a = generateSmallA()
      const A = calculateA(a)

      const init = await profileManagementAPI().initiateAuth({
        username: email,
        srpA: A.toString(16),
      })

      const handleResponse = async (response: AuthResponse | APIError) => {
        if (response === null) {
          let url = router.query.return?.toString() ?? "/profile"
          if (!url.startsWith("/")) url = "/profile"
          router.replace(url)

          return
        }

        if ("error" in response) {
          if (
            response.error === "UnauthorizedError" &&
            response.details?.code === "UserNotConfirmedException"
          ) {
            await router.push(
              `/register/confirmation-sent?${new URLSearchParams({
                email,
              }).toString()}`,
              "/register/confirmation-sent"
            )
            return
          }

          setError(response)
          return
        }

        if (response.challengeName === ChallengeType.PASSWORD_VERIFIER) {
          const timestamp = getAmazonFormattedDate()

          const poolId = response.poolId.split("_")[1]

          const message = new Uint8Array([
            ...Array.from(new TextEncoder().encode(poolId)),
            ...Array.from(
              new TextEncoder().encode(response.challengeParameters.userId)
            ),
            ...Array.from(
              Uint8Array.from(
                atob(response.challengeParameters.secretBlock),
                (c) => c.charCodeAt(0)
              )
            ),
            ...Array.from(new TextEncoder().encode(timestamp)),
          ])

          const signature = await crypto.subtle.sign(
            "HMAC",
            await getSRPPasswordKey(
              response.challengeParameters.userId,
              password,
              response.challengeParameters,
              a,
              poolId
            ),
            message
          )

          await handleResponse(
            await profileManagementAPI().respondToAuthChallenge({
              challenge: {
                type: ChallengeType.PASSWORD_VERIFIER,
                parameters: {
                  username: email,
                  secretBlock: response.challengeParameters.secretBlock,
                  timestamp,
                  signature: btoa(
                    Array.from(new Uint8Array(signature))
                      .map((b) => String.fromCharCode(b))
                      .join("")
                  ),
                },
              },
              session: response.session,
            })
          )
        } else {
          setError({
            error: "ValidationError",
            message: "Unknown challenge type.",
            details: {
              context: "RespondToAuthChallenge",
              code: "ValidationError",
            },
          })
        }
      }

      await handleResponse(init)
    } catch (e) {
      console.error(e)
      setError({ error: "BrowserException", message: "Error" })
    }
  })

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="heading-login"
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

            {error && (
              <>
                {error.error === "ForbiddenError" &&
                error.details?.code === "PasswordResetRequiredException" ? (
                  <PasswordExpiredAlert />
                ) : (
                  <ErrorAlert error={error} />
                )}
              </>
            )}

            <form onSubmit={onLogin}>
              <div css={{ marginBottom: suomifiDesignTokens.spacing.m }}>
                <Input
                  name="email"
                  autoComplete="email"
                  labelText={t("common:email")}
                  visualPlaceholder="mikko.mallikas@osoite.fi"
                  control={control}
                />
              </div>
              <div>
                <Input
                  name="password"
                  autoComplete="current-password"
                  labelText={t("common:password")}
                  visualPlaceholder={t("common:password").toLowerCase()}
                  type="password"
                  control={control}
                />
              </div>

              <NavigationLinkList
                links={[
                  {
                    link: "/forgot",
                    name: t("common:forgotPassword"),
                    id: "forgot-password-link",
                  },
                  {
                    link: `/register${
                      router.query.return
                        ? `?return=${encodeURIComponent(
                            router.query.return.toString()
                          )}`
                        : ""
                    }`,
                    name: t("common:createAccountAuroraAi"),
                    id: "create-account-link",
                  },
                  {
                    link: "/read-more",
                    name: t("common:readMoreAuroraAi"),
                    id: "read-more-link",
                  },
                ]}
                css={{ marginBottom: suomifiDesignTokens.spacing.m }}
              />

              <Row gap={suomifiDesignTokens.spacing.s}>
                <Button
                  id="login-button"
                  variant="default"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {t("submit")}
                </Button>
                <Button
                  id="cancel-login-button"
                  variant="secondary"
                  type="reset"
                  onClick={(): void => {
                    reset()
                    setError(undefined)
                  }}
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

Login.getInitialProps = () => ({})

export default Login
