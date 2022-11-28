import { NextPage } from "next"
import React, { PropsWithChildren } from "react"
import {
  Button,
  Heading,
  Paragraph,
  suomifiDesignTokens,
  Text,
} from "suomifi-ui-components"
import { Head } from "../components/Head"
import Layout from "../components/Layout"
import { Box } from "../components/styles/Box"
import { MediumContainer } from "../components/styles/MediumContainer"
import { NavigationLinkList } from "../components/NavigationLinkList"
import { Row } from "../components/styles/Row"
import { RegisterForm } from "../schemas"
import { ioTsResolver } from "@hookform/resolvers/io-ts"
import { useForm } from "react-hook-form"
import { Input } from "../components/Input"
import { PasswordCriteriaFormInput } from "../components/PasswordCriteriaFormInput"
import { useState } from "react"
import { profileManagementAPI } from "../api/profileManagementApi"
import useTranslation from "next-translate/useTranslation"
import Trans from "next-translate/Trans"
import NextLink from "next/link"
import { PasswordCriteriaForm } from "../components/PasswordCriteriaForm"
import { useRouter } from "next/router"
import { Main } from "../components/Main"
import { ErrorAlert } from "../components/ErrorAlert"
import { MultilineParagraph } from "../components/MultilineParagraph"
import { APIError } from "../utils/errors"

function ForgotLink({ children }: PropsWithChildren<Record<never, never>>) {
  return (
    <NextLink href="/forgot" passHref>
      <a
        css={{
          color: "inherit",
        }}
      >
        {children}
      </a>
    </NextLink>
  )
}

const Register: NextPage = () => {
  const { t, lang } = useTranslation("register")

  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    getValues,
  } = useForm<RegisterForm>({
    resolver: ioTsResolver(RegisterForm),
    mode: "onBlur",
  })

  const password = watch("password")

  const [error, setError] = useState<APIError>()
  const [emailInUse, setEmailInUse] = useState(false)

  const router = useRouter()

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(undefined)
    const returnUrl = router.query.return?.toString()
    const response = await profileManagementAPI().signUp({
      email,
      password,
      language: lang,
      returnUrl,
    })

    if ("error" in response) {
      setError(response)
      return
    }

    if ("codeDeliveredTo" in response) {
      await router.push(
        `/register/confirmation-sent?${new URLSearchParams({
          email: email ?? "generic-email",
        }).toString()}`,
        "/register/confirmation-sent"
      )
      return
    }

    // auto-verified (check response.confirmed), login
  })

  const checkEmailAvailability = () => {
    const email = getValues("email")

    profileManagementAPI()
      .checkEmailAvailability(email)
      .then((result) => {
        if (typeof result === "boolean") {
          setEmailInUse(!result)
        }
      })
  }

  return (
    <Layout>
      <Head pageName={t("title")} />

      <Main>
        <MediumContainer center>
          <Heading
            id="heading-register"
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
            <MultilineParagraph text={t("intro")} marginBottomSpacing="m" />

            <Paragraph marginBottomSpacing="m">
              <Text variant="bold">{t("introSubheading")}</Text>
            </Paragraph>

            <form onSubmit={onSubmit} css={{ width: "100%" }}>
              {error && <ErrorAlert error={error} />}

              <PasswordCriteriaForm password={password ?? ""}>
                <div
                  css={{
                    marginBottom: suomifiDesignTokens.spacing.s,
                  }}
                >
                  <Input
                    name="email"
                    labelText={t("common:email")}
                    visualPlaceholder={t("common:emailPlaceholder")}
                    type="email"
                    control={control}
                    onBlur={() => checkEmailAvailability()}
                    onFocus={() => setEmailInUse(false)}
                    customError={
                      emailInUse ? (
                        <Trans
                          i18nKey="register:emailNotAvailable"
                          components={{
                            link: <ForgotLink />,
                          }}
                        />
                      ) : undefined
                    }
                    autoComplete="email"
                  />
                </div>

                <PasswordCriteriaFormInput id="password" control={control} />
              </PasswordCriteriaForm>

              <NavigationLinkList
                css={{
                  marginBottom: suomifiDesignTokens.spacing.xxl,
                }}
                links={[
                  { name: t("goBack"), link: "/login", id: "login-link" },
                  {
                    name: t("common:readMoreAuroraAi"),
                    link: "/read-more",
                    id: "read-more-link",
                  },
                ]}
              />

              <Row gap={suomifiDesignTokens.spacing.s}>
                <Button
                  id="register-submit-button"
                  type="submit"
                  variant="default"
                  disabled={isSubmitting}
                >
                  {t("submit")}
                </Button>
                <Button
                  id="register-cancel-button"
                  variant="secondary"
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

Register.getInitialProps = () => ({})

export default Register
