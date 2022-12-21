import express, { Response, urlencoded } from "express"
import { Request } from "express"
import { config } from "./config"
import path from "path"
import axios, { AxiosError } from "axios"
import session from "express-session"
import createMemoryStore from "memorystore"
import municipalities from "./src/municipalities.json"
import { Issuer } from "openid-client"
import { pseudoRandomBytes } from "crypto"
import { JWT } from "jose"
import { StatusCodes, ReasonPhrases } from "http-status-codes"
import urljoin from "url-join"
import helmet from "helmet"

const MemoryStore = createMemoryStore(session)

const clientSecret = "mock-service-api-key"
const oauthHost = `${config.profile_management_api_url}/oauth`

const mockInstanceNumber = parseInt(process.env.MOCK_INSTANCE as string) ?? 1
const instanceConfig =
  mockInstanceNumber === 1 ? config.instance1_config : config.instance2_config

const instancePath = `mock-services/${mockInstanceNumber}`
const host = `${config.auroraai_host}/${instancePath}`
const clientId =
  instanceConfig.client_id ?? "708cfe6c-a099-47fc-b77e-102957a6b696"

declare global {
  namespace Express {
    interface Request {
      jwt?: { attributes: string[]; sub: string }
    }
  }
}

const log = (event: string, data: object) => {
  const timestamp = new Date().toISOString()
  console.log(JSON.stringify({ timestamp, event, data }))
}

log("start", {
  mock_instance_number: mockInstanceNumber,
  client_id: clientId,
  host,
  oauth_host: oauthHost,
  port: instanceConfig.mock_service_port,
})

/**
 * We must manually create the issuer as we don't have
 * access to the dev environment from external network and
 * the JWK url in the openid configuration includes the
 * external domain instead of the internal hostname so even
 * if we requested the openid configuration via the internal
 * hostname, the discovery would fail because the library can't
 * load the JWKs. A more realistic use of this library would be:
 *
 * ```ts
 * const auroraAIClient = Issuer.discover(
 *    `https://dev.suomiai.cloud.dvv.fi/.well-known/openid-configuration`
 * ).then(
 *    (issuer) =>
 *      new issuer.Client({
 *        client_id,
 *        client_secret,
 *        redirect_uris: [`https://myhost.com/oauth/callback/auroraai`],
 *        response_types: ["code"],
 *      })
 * )
 * ```
 */

// https://github.com/panva/node-openid-client/blob/992fec49e2908323547a3e9010613f74b2e88ad4/lib/helpers/consts.js#L20
const ISSUER_DEFAULTS = {
  claim_types_supported: ["normal"],
  claims_parameter_supported: false,
  grant_types_supported: ["authorization_code", "implicit"],
  request_parameter_supported: false,
  request_uri_parameter_supported: true,
  require_request_uri_registration: false,
  response_modes_supported: ["query", "fragment"],
  token_endpoint_auth_methods_supported: ["client_secret_basic"],
}
const auroraAIIssuer = new Issuer({
  ...ISSUER_DEFAULTS,
  issuer: `${config.auroraai_host}/oauth`,
  authorization_endpoint: `${config.auroraai_host}/authorize`,
  token_endpoint: `${oauthHost}/token`,
  token_endpoint_auth_methods_supported: ["client_secret_basic"],
  revocation_endpoint: `${oauthHost}/revoke`,
  jwks_uri: `${oauthHost}/.well-known/jwks.json`,
  response_types_supported: ["code"],
  response_modes_supported: ["query"],
  subject_types_supported: ["public"],
  id_token_signing_alg_values_supported: ["RS256"],
  userinfo_endpoint: `${oauthHost}/userinfo`,
})

const oauthRedirectUris = [
  `${host}/oauth/callback/auroraai`,
  `${host}/oauth/callback/auroraai/sv`,
]

const auroraAIClient = new auroraAIIssuer.Client({
  client_id: clientId,
  client_secret: clientSecret,
  redirect_uris: oauthRedirectUris,
  response_types: ["code"],
})

const app = express()
app.use(helmet.noSniff())
app.use(helmet.hsts())
app.use(
    helmet.frameguard({
        action: "deny",
    })
)
app.use(helmet.hidePoweredBy())

const sessionStore = new MemoryStore({ checkPeriod: 86400000 })

app.use(
  session({
    secret: "just-for-mock",
    name: host,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
  })
)
app.use(express.json())

app.engine("html", require("ejs").renderFile)
app.set("view engine", "html")
app.set("views", path.join(__dirname, "/build"))

const testErrorMiddleware = (
  req: express.Request,
  res: express.Response,
  next: Function
) => {
  if (app.locals.testError !== undefined) {
    res.status(app.locals.testError.status)
    res.json({ message: app.locals.testError.message })
    return
  }
  next()
}

const jwtParserMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: Function
) => {
  const jwks = await auroraAIIssuer.keystore()

  const [authType, authCreds] = (req.headers.authorization ?? "").split(" ")

  if (authType !== "Bearer") {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: ReasonPhrases.UNAUTHORIZED })
    return
  }

  const audience = config.jwt_audience
    ? `${config.jwt_audience}/${instancePath}`
    : host

  try {
    const { scope, sub } = JWT.verify(authCreds, jwks, {
      issuer: auroraAIIssuer.metadata.issuer,
      audience,
    }) as { scope: string; sub: string }

    req.jwt = { attributes: scope.split(" "), sub }
  } catch (e) {
    console.error(e)
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: ReasonPhrases.UNAUTHORIZED })
    return
  }

  next()
}

const baseRouter = express.Router()
const profileManagementRouter = express.Router()

profileManagementRouter.use([testErrorMiddleware, jwtParserMiddleware])
baseRouter.use("/static", express.static(path.join(__dirname, "/build")))
baseRouter.get("/healthcheck", (_, res) => res.send("OK"))
baseRouter.use(`/auroraai/profile-management`, profileManagementRouter)

baseRouter.get(`/auroraai/logout`, (req, res) => {
  const { locale } = req.query
  const loc = locale ? `${locale}/` : ""
  const callbackUrl = encodeURI(`${host}/${loc}`)
  return res.redirect(
    `${config.auroraai_host}/logout?callbackUrl=${callbackUrl}`
  )
})

baseRouter.get("/auroraai/profile", async (req, res) => {
  const { locale } = req.query
  const loc = locale ? `${locale}/` : ""
  return res.redirect(
    `${config.auroraai_host}/${loc}profile?returnToServiceId=${instanceConfig.client_id}`
  )
})

baseRouter.get("/oauth/authorize/auroraai", async (req, res) => {
  try {
    req.session.state = pseudoRandomBytes(16)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")

    const storableAttributes =
      instanceConfig.stored_attributes?.map((it) => `store:${it}`).join(" ") ??
      ""

    const retrievableAttributes =
      instanceConfig.remote_attributes?.join(" ") ?? ""

    // if session has a list of scopes, use them instead of the default ones
    const scopesInSession = req.session.scope?.join(" ")
    const defaultScopes = `openid ${retrievableAttributes} ${storableAttributes}`
    const scope = `${scopesInSession || defaultScopes}`

    const svLocale = req.query.locale === "sv"

    res.redirect(
      auroraAIClient.authorizationUrl({
        scope,
        state: req.session.state,
        redirect_uri: svLocale ? oauthRedirectUris[1] : oauthRedirectUris[0],
        ui_locales: svLocale ? "sv" : undefined,
      })
    )
  } catch (e) {
    console.error(e)
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
})

const handleOauthCallback = async (req: Request, res: Response) => {
  try {
    const { error } = req.query
    const locale = req.path.endsWith("sv") ? "sv" : ""

    if (error) {
      console.error(error)
      return res.redirect(urljoin(`${host}`, `${locale}`, "/"))
    }
    const params = auroraAIClient.callbackParams(req)

    const tokenSet = await auroraAIClient.callback(
      `${host}${req.path}`,
      params,
      {
        state: req.session.state,
      }
    )

    req.session.access_token = tokenSet.access_token
    req.session.scope = tokenSet.scope?.split(" ")
    req.session.state = undefined
    req.session.sub = tokenSet.claims().sub

    res.redirect(urljoin(`${host}`, `${locale}`, "oauth-home"))
  } catch (e) {
    console.error(e)
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

baseRouter.get("/oauth/callback/auroraai", handleOauthCallback)
baseRouter.get("/oauth/callback/auroraai/sv", handleOauthCallback)

baseRouter.get("/oauth/revoke/auroraai", async (req, res) => {
  log("oauth_revoke", {})

  if (!req.session.access_token) return res.status(StatusCodes.UNAUTHORIZED)

  await auroraAIClient.revoke(req.session.access_token)

  req.session.destroy((error) => {
    if (error) {
      log("oauth_revoke", { error })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
    }
    return res.redirect(`${host}/`)
  })
})

type AttributeResponse = Record<
  string,
  { status: "NOT_AVAILABLE" | "SUCCESS"; value?: any }
>

const getStoredAttributes = (username: string): Record<string, any> => {
  log("get_stored_attributes", { username })
  const integerUsername = Buffer.from(username).readUInt32BE(0)

  const mock_3x10d = [(integerUsername % 5) + 1]

  const mockAttributes: Record<string, any> = {
    age: 18 + (integerUsername % 100),
    municipality_code:
      municipalities[integerUsername % municipalities.length].id,
    life_situation_meters: {
      family: mock_3x10d,
      finance: mock_3x10d,
      friends: mock_3x10d,
      health: mock_3x10d,
      housing: mock_3x10d,
      improvement_of_strengths: mock_3x10d,
      life_satisfaction: mock_3x10d,
      resilience: mock_3x10d,
      self_esteem: mock_3x10d,
      working_studying: mock_3x10d,
    },
  }

  Object.keys(mockAttributes).map((it) => {
    mockAttributes[it] = instanceConfig.stored_attributes?.includes(it)
      ? mockAttributes[it]
      : undefined
  })

  log("get_stored_attributes", { mockAttributes })
  return mockAttributes
}

const getAttributesFromAuroraAi = async (
  access_token: string
): Promise<Record<string, any>> => {
  const { data } = await axios.get<AttributeResponse>(
    `${config.profile_management_api_url}/profile-management/v1/user_attributes/all_authorized`,
    {
      headers: {
        authorization: `Bearer ${access_token}`,
      },
    }
  )

  const attributes: Record<string, any> = {}

  Object.keys(data).map((it) => {
    attributes[it] = data[it].status === "NOT_AVAILABLE" ? null : data[it].value
  })

  return attributes
}

// Get values for attributes that are locally "stored" in mock service
baseRouter.get(`/api/local-attributes`, async (req, res) => {
  if (!req.session.access_token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: ReasonPhrases.UNAUTHORIZED })
  }

  try {
    const attributes = getStoredAttributes(req.session.sub ?? "")
    log("get_local attributes", attributes)

    res.json(attributes)
  } catch (e) {
    console.error(e)
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
})

// Try to get all authorized attribute values from Aurora-AI network
baseRouter.get(`/api/auroraai-attributes`, async (req, res) => {
  if (!req.session.access_token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: ReasonPhrases.UNAUTHORIZED })
  }

  try {
    const attributes = await getAttributesFromAuroraAi(req.session.access_token)

    log("get_auroraai-attributes", attributes)

    res.json(attributes)
  } catch (e) {
    console.error(e)
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
})

// Notify AuroraAI profile management that mock service has a value available for given attributes.
baseRouter.post(`/api/auroraai-attributes`, async (req, res) => {
  if (!req.session.access_token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: ReasonPhrases.UNAUTHORIZED })
  }

  try {
    await axios.patch(
      `${config.profile_management_api_url}/profile-management/v1/user_attributes`,
      req.body,
      {
        headers: {
          authorization: `Bearer ${req.session.access_token}`,
        },
      }
    )

    res.sendStatus(StatusCodes.NO_CONTENT)
  } catch (e) {
    const error = e as AxiosError
    error.response?.status === 403
      ? res
          .status(StatusCodes.FORBIDDEN)
          .json({ error: ReasonPhrases.FORBIDDEN })
      : res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
})

baseRouter.post(
  `/test-api/error`,
  (
    req: Request<{}, {}, { status: number; message: string | undefined }>,
    res
  ) => {
    if (!req.body.status || req.body.status < 400 || req.body.status > 511) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: ReasonPhrases.BAD_REQUEST })
      return
    }

    app.locals.testError = req.body
    log("post-test-error", app.locals.testError)
    res.status(StatusCodes.OK).json(app.locals.testError)
  }
)

baseRouter.delete(`/test-api/error`, (req, res) => {
  app.locals.testError = undefined
  log("delete-test-error", { message: "ok" })
  res.sendStatus(StatusCodes.OK)
})

baseRouter.get(`/*`, (req, res) => {
  log("default_path_handle", { path: req.url })
  return res.render("index", {
    serviceHost: config.auroraai_host,
    mockInstanceNumber: mockInstanceNumber,
  })
})

profileManagementRouter.get("/v1/user_attributes", async (req, res) => {
  log("get_user_attributes", { jwt: req.jwt })
  if (!req.jwt || req.jwt.attributes.length < 1) {
    log("get_user_attributes", { error: "bad request" })
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid request" })
  }

  const attributes = getStoredAttributes(req.jwt.sub ?? "")
  Object.keys(attributes).map((it) => {
    if (!req.jwt?.attributes.includes(it)) {
      attributes[it] = undefined
    }
  })

  res.json(attributes)
})

profileManagementRouter.delete("/v1/user_attributes", async (req, res) => {
  // A real AuroraAI service would delete the user data here, but Mock service is
  // stateless and has nothing to delete so we just log the user id and acknowledge with HTTP 200.
  log("delete_user_attributes", { sub: req.jwt?.sub })

  res.sendStatus(StatusCodes.OK)
})

profileManagementRouter.post("/v1/token", async (req, res) => {
  try {
    sessionStore.all((err, sessions) => {
      Object.entries(sessions ?? {}).forEach((it) => {
        const [sessionId, data] = it
        if (data.sub !== (req.jwt?.sub ?? "")) return
        sessionStore.set(sessionId, {
          ...data,
          access_token: req.body.access_token,
          scope: req.body.scope?.split(" "),
        })
      })
      res.sendStatus(StatusCodes.OK)
    })
  } catch (e) {
    console.error(e)
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
})

app.use(`/${instancePath}/sv`, baseRouter)
app.use(`/${instancePath}`, baseRouter)

const server = app.listen(instanceConfig.mock_service_port)
server.keepAliveTimeout = 95 * 1000 // 95 seconds. This must be bigger than the ALB idle_timeout

declare module "express-session" {
  interface SessionData {
    access_token?: string
    scope?: string[]
    sub?: string

    state?: string
  }
}
