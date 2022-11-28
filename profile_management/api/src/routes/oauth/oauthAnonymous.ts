import express from "express"
import { config } from "../../config"
import { handleRequest } from "../../util/requestHandler"
import { getSecret } from "../../util/secrets"
import { auroraAIServiceController } from "../../controllers/auroraAIService/auroraAIService"

export const oauthAnonymousRouter = express.Router()

oauthAnonymousRouter.get(
  "/.well-known/openid-configuration",
  handleRequest(async () => {
    const host = config.service_host || "http://localhost:3000"
    const apiHost = `${config.service_host || "http://localhost:7000"}/oauth`

    return {
      issuer: `${host}/oauth`,
      authorization_endpoint: `${host}/authorize`,
      token_endpoint: `${apiHost}/token`,
      token_endpoint_auth_methods_supported: ["client_secret_basic"],
      jwks_uri: `${apiHost}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      subject_types_supported: ["pairwise"],
      id_token_signing_alg_values_supported: ["RS256"],
      userinfo_endpoint: `${apiHost}/userinfo`,
      scopes_supported: await auroraAIServiceController.getAllowedScopes(),
      grant_types_supported: ["authorization_code"],
    }
  })
)

oauthAnonymousRouter.get(
  "/.well-known/jwks.json",
  handleRequest(async () => {
    const { alg, e, kid, kty, n, use } = JSON.parse(
      (await getSecret("Profile_Management_Oauth_JWK")) ?? "{}"
    )

    return {
      keys: [{ alg, e, kid, kty, n, use }],
    }
  })
)
