import * as t from "io-ts"
import { Nullable } from "shared/schemas"

interface HttpURLBrand {
  readonly HttpURL: unique symbol
}

export const HttpURL = t.brand(
  t.string,
  (s: string): s is t.Branded<string, HttpURLBrand> => {
    try {
      const { protocol } = new URL(s)
      return ["https:", "http:"].includes(protocol.toLowerCase())
    } catch (e) {
      return false
    }
  },
  "HttpURL"
)

export const OpenIDConfiguration = t.type({
  issuer: HttpURL,
  authorization_endpoint: HttpURL,
  token_endpoint: HttpURL,
  userinfo_endpoint: HttpURL,
  jwks_uri: HttpURL,
  registration_endpoint: Nullable(HttpURL),
  scopes_supported: Nullable(t.array(t.string)),
  response_types_supported: t.array(t.string),
  response_modes_supported: Nullable(t.array(t.string)),
  grant_types_supported: Nullable(t.array(t.string)),
  acr_values_supported: Nullable(t.array(t.string)),
  subject_types_supported: t.array(t.string),
  id_token_signing_alg_values_supported: t.array(t.string),
  id_token_encryption_alg_values_supported: Nullable(t.array(t.string)),
  id_token_encryption_enc_values_supported: Nullable(t.array(t.string)),
  userinfo_signing_alg_values_supported: Nullable(t.array(t.string)),
  userinfo_encryption_alg_values_supported: Nullable(t.array(t.string)),
  userinfo_encryption_enc_values_supported: Nullable(t.array(t.string)),
  request_object_signing_alg_values_supported: Nullable(t.array(t.string)),
  request_object_encryption_alg_values_supported: Nullable(t.array(t.string)),
  request_object_encryption_enc_values_supported: Nullable(t.array(t.string)),
  token_endpoint_auth_methods_supported: Nullable(t.array(t.string)),
  token_endpoint_auth_signing_alg_values_supported: Nullable(t.array(t.string)),
  display_values_supported: Nullable(t.array(t.string)),
  claim_types_supported: Nullable(t.array(t.string)),
  claims_supported: Nullable(t.array(t.string)),
  service_documentation: Nullable(HttpURL),
  claims_locales_supported: Nullable(t.array(t.string)),
  ui_locales_supported: Nullable(t.array(t.string)),
  claims_parameter_supported: Nullable(t.boolean),
  request_parameter_supported: Nullable(t.boolean),
  request_uri_parameter_supported: Nullable(t.boolean),
  require_request_uri_registration: Nullable(t.boolean),
  op_policy_uri: Nullable(HttpURL),
  op_tos_uri: Nullable(HttpURL),
})

export const JWKsList = t.type({
  keys: t.array(
    t.type({
      alg: t.string,
      e: t.string,
      kid: t.string,
      kty: t.string,
      n: t.string,
      use: t.string,
    })
  ),
})
