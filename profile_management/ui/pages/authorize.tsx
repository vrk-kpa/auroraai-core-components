import { NextPage, NextPageContext } from "next"
import Layout from "../components/Layout"
import { Head } from "../components/Head"
import {
  Heading,
  suomifiDesignTokens,
  Button,
  Paragraph,
  RadioButtonGroup,
  RadioButton,
} from "suomifi-ui-components"
import { Box } from "../components/styles/Box"
import { Main } from "../components/Main"
import { Container } from "../components/styles/Container"
import { OauthAuthorizationRequest } from "../schemas"
import { isLeft } from "fp-ts/lib/Either"
import { profileManagementAPI, User } from "../api/profileManagementApi"
import { APIError } from "../utils/errors"
import useTranslation from "next-translate/useTranslation"
import { Refetchable, withRefetchables } from "../api/apiSession"
import { UserContext, useUpdateUserContextWithProps } from "../contexts/user"
import { useAsyncProps } from "../hooks/useAsyncProps"
import { redirect, redirectToExternal } from "../utils/redirect"
import { useContext, useMemo, useState } from "react"
import { ErrorAlert } from "../components/ErrorAlert"
import { attributesManagementAPI } from "../attributesManagementApi/attributesManagementApi"
import {
  Language,
  LANGUAGES,
  RedirectURI,
  TranslatableString,
  Scope,
} from "shared/schemas"
import { UUID } from "io-ts-types/UUID"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { ScopeList } from "ui/components/ScopeList"
import Trans from "next-translate/Trans"
import { css } from "styled-components"
import {
  ensureOpenIDScope,
  isRetrievableAttribute,
  isStorableAttribute,
} from "shared/util/attributes"
import { stringPairQueryParams } from "../utils/url"

type AuthorizeProps =
  | {
      client: { id: string; name: TranslatableString }
      state?: string
      redirectUri: RedirectURI
      scopes: Scope[]
      sources: Record<string, TranslatableString[]>
      user: User
      attributeLocalisation: Record<string, any>
    }
  | { code: string; state?: string; redirectUri: RedirectURI }
  | (APIError & { redirectUri?: RedirectURI })

interface AuthorizeGetProps {
  query: Record<string, string>
  user?: User
}

const oauthLoginIsRequired = (props?: AuthorizeProps) =>
  props &&
  "error" in props &&
  props?.details?.context === "Oauth" &&
  props?.details?.code === "login_required"

const redirectToLogin = (
  query: Record<string, string>,
  ctx?: NextPageContext
) => {
  const authorizeParams = new URLSearchParams(
    (({ prompt, ...rest }) => rest)(query)
  ).toString()

  const logoutParams = new URLSearchParams({
    return: `/authorize?${authorizeParams}`,
  }).toString()

  redirect(`/logout?${logoutParams}`, ctx)
}

const ensureRequestedLocale = (
  query: Record<string, string>,
  lang: Language,
  ctx?: NextPageContext
) => {
  if (query.ui_locales) {
    const preferredLanguage = query.ui_locales
      .split(" ")
      .map((locale) => locale.split("-")[0])
      .find((locale) => LANGUAGES.includes(locale as Language))

    if (preferredLanguage && lang !== preferredLanguage) {
      redirect(
        `/authorize?${new URLSearchParams(
          (({ ui_locales, ...rest }) => rest)(query)
        ).toString()}`,
        ctx,
        302,
        preferredLanguage as Language
      )
    }
  }
}

const maxAgeExceeded = (maxAge: string, authTime: number) => {
  const validMaxAge = maxAge && /^[0-9]+$/.test(maxAge)
  return !!(
    validMaxAge &&
    authTime &&
    Math.floor(Date.now() / 1000) - parseInt(maxAge, 10) > authTime
  )
}

const getProps = async (
  { query, user }: AuthorizeGetProps,
  ctx?: NextPageContext
): Promise<AuthorizeProps> => {
  const userData = await (user ??
    profileManagementAPI(true, ctx, true).getUser())

  if ("error" in userData) {
    return userData as APIError
  }

  if (
    query.prompt === "login" ||
    maxAgeExceeded(query.max_age, userData.authTime)
  ) {
    return {
      error: "UnauthorizedError",
      message: "Login required",
      details: { code: "login_required", context: "Oauth" },
    }
  }

  const request = OauthAuthorizationRequest.decode(query)

  const rawRedirectUri = RedirectURI.decode(query.redirect_uri)
  const fallbackRedirectUri = isLeft(rawRedirectUri)
    ? undefined
    : rawRedirectUri.right

  if (isLeft(request)) {
    return {
      error: "ValidationError",
      message: "Invalid authorization request.",
      details: { context: "Oauth", code: "invalid_request" },
      redirectUri: fallbackRedirectUri,
    }
  }

  const { client_id, scope, state, redirect_uri } = request.right

  const scopes = ensureOpenIDScope(
    (scope?.toString().split(" ") ?? ["openid"]).filter(
      (scope) => scope.length > 0
    )
  ) as Scope[]

  const authorizationData = await profileManagementAPI(
    true,
    ctx
  ).initOauthAuthorize({
    clientId: client_id,
    redirectUri: redirect_uri,
    scopes,
    consentRequired: query.prompt === "consent",
  })

  if ("error" in authorizationData) {
    return {
      ...authorizationData,
      details: authorizationData.details ?? {
        context: "Oauth",
        code: "invalid_request",
      },
      redirectUri: redirect_uri ?? fallbackRedirectUri,
    }
  }

  if ("code" in authorizationData) {
    return {
      code: authorizationData.code,
      state: state ?? undefined,
      redirectUri: authorizationData.redirectUri,
    }
  } else if (query.prompt === "none") {
    return {
      error: "ValidationError",
      message: "Invalid prompt.",
      details: { context: "Oauth", code: "consent_required" },
      redirectUri: authorizationData.redirectUri,
    }
  }

  const attributeLocalisation = await attributesManagementAPI(
    ctx
  ).getLocalisation()

  return {
    scopes,
    state: state ?? undefined,
    client: authorizationData.client,
    redirectUri: authorizationData.redirectUri,
    sources: authorizationData.sources,
    user: userData,
    attributeLocalisation:
      "error" in attributeLocalisation
        ? {}
        : (attributeLocalisation as Record<string, any>)
  }
}

const scopeSubheading = css`
  margin-bottom: ${suomifiDesignTokens.spacing.s};
  margin-top: ${suomifiDesignTokens.spacing.m};
  font-size: 20px !important;
  line-height: unset !important;
  &.no-top-margin {
    margin-top: 0;
  }
`

const Authorize: NextPage<Refetchable<AuthorizeProps>> = (initialProps) => {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [redirectError, setRedirectError] = useState<APIError>()
  const [phase, setPhase] = useState("storablePermissions")
  const [permissions, setPermissions] = useState("approve-permissions")
  const router = useRouter()

  const { t, lang } = useTranslation("authorize")

  ensureRequestedLocale(stringPairQueryParams(router.query), lang as Language)

  const { user } = useContext(UserContext)

  const { props } = useAsyncProps<AuthorizeProps, AuthorizeGetProps>(
    initialProps,
    getProps,
    useMemo(
      () => ({ user, query: stringPairQueryParams(router.query) }),
      [user, router.query]
    )
  )

  if (oauthLoginIsRequired(props)) {
    redirectToLogin(stringPairQueryParams(router.query))
  }

  useUpdateUserContextWithProps(props)

  const [scopes, setScopes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (props && !("error" in props) && !("code" in props)) {
      setScopes(Object.fromEntries(props.scopes.map((scope) => [scope, true])))
    }
  }, [props])

  if (props && "code" in props) {
    redirectToExternal(
      `${props.redirectUri}?${new URLSearchParams({
        code: props.code,
        ...(props.state && { state: props.state }),
      }).toString()}`
    )
  }

  const redirectWithError = (oauthError: string) => {
    if (!props) return

    setIsRedirecting(true)

    if ("error" in props) {
      if (!props.redirectUri) return

      redirectToExternal(
        `${props.redirectUri}?${new URLSearchParams({
          error: oauthError,
        }).toString()}`
      )

      return
    }

    redirectToExternal(
      `${props.redirectUri}?${new URLSearchParams({
        error: oauthError,
        ...(props.state && { state: props.state }),
      }).toString()}`
    )
  }

  const selectedScopes = Object.keys(scopes).filter(
    (scope) => scopes[scope]
  ) as Scope[]

  const authorizeAndRedirect = async () => {
    if (!props || "error" in props || "code" in props) {
      setRedirectError({
        error: "InternalServerError",
        message: "Error",
      })
      return
    }

    setIsRedirecting(true)

    const authorizationResponse = await profileManagementAPI(
      true
    ).oauthAuthorize({
      clientId: props.client.id as UUID,
      scopes: selectedScopes,
      redirectUri: props.redirectUri,
    })

    if ("error" in authorizationResponse) {
      setRedirectError(authorizationResponse)
      setIsRedirecting(false)
      return
    }

    const serviceUrl = `${props.redirectUri}?${new URLSearchParams({
      code: authorizationResponse.code,
      ...(props.state && { state: props.state }),
    }).toString()}`

    router.push({
      pathname: "/navigation",
      query: {
        serviceurl: serviceUrl,
        servicename: props.client.name[lang as Language],
        serviceid: props.client.id,
      },
    })
  }

  const onScopeModified = (scope: string, included: boolean) => {
    setScopes({
      ...scopes,
      [scope]: included,
    })
  }

  const onChangePermissions = (value: string) => {
    setPermissions(value)
    if (value === "approve-permissions")
      Object.entries(scopes).map(([scope]) => {
        if (
          (isRetrievableAttribute(scope) &&
            phase === "retrievablePermissions") ||
          (isStorableAttribute(scope) && phase === "storablePermissions")
        )
          setScopes({ ...scopes, [scope]: true })
      })
  }

  const processStorablePermissions = () => {
    setPhase("retrievablePermissions")
    setPermissions("approve-permissions")
  }

  const retrievableScopes = Object.fromEntries(
    Object.entries(scopes).filter(([scope]) => isRetrievableAttribute(scope))
  )

  const storableScopes = Object.fromEntries(
    Object.entries(scopes).filter(([scope]) => isStorableAttribute(scope))
  )

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
            {!props || "code" in props ? (
              t("common:loading")
            ) : "error" in props ? (
              <>
                <ErrorAlert error={props} />

                {props.redirectUri && (
                  <Button
                    id="return-button"
                    disabled={isRedirecting}
                    onClick={() =>
                      redirectWithError(
                        props.details?.code ?? "invalid_request"
                      )
                    }
                  >
                    {t("returnToService")}
                  </Button>
                )}
              </>
            ) : (
              <>
                {redirectError && <ErrorAlert error={redirectError} />}

                {phase === "storablePermissions" && (
                  <>
                    <Paragraph marginBottomSpacing="m">
                      <Trans
                        i18nKey="authorize:intro"
                        components={{
                          strong: <strong />,
                        }}
                        values={{
                          serviceName: props.client.name[lang as Language],
                          serviceHost: new URL(props.redirectUri).hostname,
                        }}
                      />
                    </Paragraph>

                    {Object.keys(storableScopes).length > 0 && (
                      <>
                        <Heading variant="h2" css={scopeSubheading}>
                          {t("storableAttributes")}
                        </Heading>

                        <Paragraph marginBottomSpacing="s">
                          {t("storableAttributesDescription", {
                            serviceName: props.client.name[lang as Language],
                          })}
                        </Paragraph>
                        <ScopeList
                          type="bullet"
                          scopes={storableScopes}
                          onScopeModified={onScopeModified}
                          serviceName={props.client.name[lang as Language]}
                          serviceId={props.client.id}
                          attributeLocalisation={props.attributeLocalisation}
                        />
                      </>
                    )}
                    <div
                      css={{
                        marginTop: suomifiDesignTokens.spacing.l,
                        display: "flex",
                        gap: suomifiDesignTokens.spacing.s,
                      }}
                    >
                      <RadioButtonGroup
                        labelText="Permissions"
                        labelMode="hidden"
                        name="permissions-group"
                        value={permissions}
                        onChange={(value) => onChangePermissions(value)}
                      >
                        <RadioButton
                          value="approve-permissions"
                          id="approve-storable-permissions-radio"
                        >
                          {t("approveStorablePermissions", {
                            serviceName: props.client.name[lang as Language],
                          })}
                        </RadioButton>
                        <RadioButton
                          value="refine-permissions"
                          id="refine-storable-permissions-radio"
                        >
                          {t("refinePermissions")}

                          {permissions === "refine-permissions" &&
                            Object.keys(storableScopes).length > 0 && (
                              <>
                                <Heading variant="h3" css={scopeSubheading}>
                                  {t("saveAttributesToService", {
                                    serviceName:
                                      props.client.name[lang as Language],
                                  })}
                                </Heading>

                                <ScopeList
                                  scopes={storableScopes}
                                  onScopeModified={onScopeModified}
                                  serviceName={
                                    props.client.name[lang as Language]
                                  }
                                  serviceId={props.client.id}
                                  attributeLocalisation={props.attributeLocalisation}
                                />
                              </>
                            )}
                        </RadioButton>
                      </RadioButtonGroup>
                    </div>
                  </>
                )}

                {phase === "retrievablePermissions" && (
                  <>
                    {Object.keys(retrievableScopes).length > 0 && (
                      <>
                        <Heading
                          variant="h2"
                          css={scopeSubheading}
                          className="no-top-margin"
                        >
                          {t("retrievableAttributes")}
                        </Heading>

                        <Paragraph marginBottomSpacing="s">
                          {t("retrievableAttributesDescription", {
                            serviceName: props.client.name[lang as Language],
                          })}
                        </Paragraph>

                        <ScopeList
                          type="bullet"
                          scopes={retrievableScopes}
                          onScopeModified={onScopeModified}
                          sources={props.sources}
                          serviceName={props.client.name[lang as Language]}
                          serviceId={props.client.id}
                          attributeLocalisation={props.attributeLocalisation}
                        />
                      </>
                    )}

                    <div
                      css={{
                        marginTop: suomifiDesignTokens.spacing.l,
                        display: "flex",
                        gap: suomifiDesignTokens.spacing.s,
                      }}
                    >
                      <RadioButtonGroup
                        labelText="Permissions"
                        labelMode="hidden"
                        name="permissions-group"
                        value={permissions}
                        onChange={(value) => onChangePermissions(value)}
                      >
                        <RadioButton
                          value="approve-permissions"
                          id="approve-retrievable-permissions-radio"
                        >
                          {t("approveRetrievablePermissions", {
                            serviceName: props.client.name[lang as Language],
                          })}
                        </RadioButton>
                        <RadioButton
                          value="refine-permissions"
                          id="refine-permissions-radio"
                        >
                          {t("refinePermissions")}

                          {permissions === "refine-permissions" &&
                            Object.keys(retrievableScopes).length > 0 && (
                              <>
                                <Heading variant="h3" css={scopeSubheading}>
                                  {t("giveRetrievableAttributesPermissions", {
                                    serviceName:
                                      props.client.name[lang as Language],
                                  })}
                                </Heading>

                                <ScopeList
                                  scopes={retrievableScopes}
                                  onScopeModified={onScopeModified}
                                  sources={props.sources}
                                  serviceName={
                                    props.client.name[lang as Language]
                                  }
                                  serviceId={props.client.id}
                                  attributeLocalisation={props.attributeLocalisation}
                                />
                              </>
                            )}
                        </RadioButton>
                      </RadioButtonGroup>
                    </div>
                  </>
                )}

                <div
                  css={{
                    marginTop: suomifiDesignTokens.spacing.l,
                    display: "flex",
                    gap: suomifiDesignTokens.spacing.s,
                  }}
                >
                  <Button
                    id="accept-button"
                    disabled={isRedirecting}
                    variant="default"
                    onClick={
                      phase === "storablePermissions"
                        ? processStorablePermissions
                        : authorizeAndRedirect
                    }
                  >
                    {t("acceptTransfer")}
                  </Button>

                  <Button
                    id="cancel-button"
                    disabled={isRedirecting}
                    variant="secondary"
                    onClick={() => redirectWithError("access_denied")}
                  >
                    {t("cancelTransfer")}
                  </Button>
                </div>
              </>
            )}
          </Box>
        </Container>
      </Main>
    </Layout>
  )
}

Authorize.getInitialProps = withRefetchables(async (ctx) => {
  const query = stringPairQueryParams(ctx.query)

  ensureRequestedLocale(query, ctx.locale as Language, ctx)

  const props = await getProps({ query }, ctx)

  if (oauthLoginIsRequired(props)) {
    redirectToLogin(query, ctx)
  }

  if ("code" in props) {
    const serviceUrl = `${props.redirectUri}?${new URLSearchParams({
      code: props.code,
      ...(props.state && { state: props.state }),
    }).toString()}`

    redirect(
      `/navigation?${new URLSearchParams({
        serviceurl: serviceUrl,
        serviceid: props.code,
      }).toString()}`,
      ctx
    )
  }

  return props
})

export default Authorize
