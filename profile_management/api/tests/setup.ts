import { ITask } from "pg-promise"
import { db, pgp } from "../src/db"
import {
  EXPIRED_ACCESS_TOKEN,
  TEST_SCOPES,
  TEST_USER_ID,
  VALID_ACCESS_TOKEN,
  VALID_SERVICE_ID,
  OAUTH_REFRESH_TOKEN_FOR_RENEWAL_TEST,
  VALID_PTV_ID,
  VALID_SESSION_ATTRIBUTES_ID,
  CLIENT_SECRET,
  EXPIRED_OAUTH_REFRESH_TOKEN,
  OAUTH_ACCESS_TOKEN_FOR_RENEWAL_TEST,
  EXPIRED_OAUTH_ACCESS_TOKEN,
  VALID_OAUTH_AUTHORIZATION_CODE,
  VALID_OAUTH_ACCESS_TOKEN,
  VALID_OAUTH_REFRESH_TOKEN,
  ANOTHER_SERVICE_ID,
  ANOTHER_SERVICE_CLIENT_SECRET,
  ANOTHER_PTV_ID,
  AGE_SERVICE_ID,
  INVALID_AGE_SERVICE_ID,
  AGE_SERVICE_SECRET,
  AGE_SERVICE_ORIGIN,
  MUNICIPALITY_SERVICE_ORIGIN,
  MUNICIPALITY_SERVICE_ID,
  MUNICIPALITY_SERVICE_SECRET,
  MULTI_ATTRIBUTE_SERVICE_ID,
  MULTI_ATTRIBUTE_SERVICE_SECRET,
  MULTI_ATTRIBUTE_SERVICE_ORIGIN,
  AGE_SERVICE_PTV_ID,
  MUNICIPALITY_SERVICE_PTV_ID,
  MULTI_ATTRIBUTE_SERVICE_PTV_ID,
  FAILING_SERVICE_ID,
  FAILING_SERVICE_PTV_ID,
  FAILING_SERVICE_SECRET,
  FAILING_SERVICE_ORIGIN,
  STORE_AGE_OAUTH_ACCESS_TOKEN,
  STORE_AGE_OAUTH_REFRESH_TOKEN,
  AGE_STORING_SERVICE_ID,
  AGE_STORED_USER_ID,
  REDIRECT_URI,
  INVALID_AGE_SERVICE_PTV_ID,
  INVALID_AGE_SERVICE_SECRET,
  INVALID_AGE_SERVICE_ORIGIN,
} from "./constants"
import { setupTestDbConnection } from "./helpers"

const translatable = (fi: string, sv: string, en: string) => ({
  rawType: true,
  toPostgres: () =>
    pgp.as.format("($1, $2, $3)::translatable_text", [fi, sv, en]),
})

const clientSecret = (secret: string) => ({
  rawType: true,
  toPostgres: () => pgp.as.format(`crypt($1, gen_salt('bf'))`, secret),
})

type ClientSecret = ReturnType<typeof clientSecret>
type Translatable = ReturnType<typeof translatable>

const addAuroraAiService = (
  t: ITask<unknown>,
  id: string,
  ptvServiceChannelId: string,
  receivableAttributes: string[],
  oauthClientSecret: ClientSecret | null,
  dataProviderUrl: string,
  allowedRedirectUris?: string[],
  defaultRedirectUri?: string,
  allowedScopes?: string[],
  link?: Translatable
) =>
  t.none(
    pgp.helpers.insert(
      {
        id,
        ptvServiceChannelId,
        receivableAttributes,
        oauthClientSecret,
        dataProviderUrl,
        ...(allowedRedirectUris && { allowedRedirectUris }),
        ...(defaultRedirectUri && { defaultRedirectUri }),
        ...(allowedScopes && { allowedScopes }),
        ...(link && { link }),
      },
      new pgp.helpers.ColumnSet(
        [
          { name: "id", prop: "id" },
          { name: "ptv_service_channel_id", prop: "ptvServiceChannelId" },
          {
            name: "session_transfer_receivable_attributes",
            prop: "receivableAttributes",
          },
          {
            name: "oauth_client_secret",
            prop: "oauthClientSecret",
            def: { rawType: true, toPostgres: () => "DEFAULT" },
          },
          { name: "data_provider_url", prop: "dataProviderUrl" },
          {
            name: "allowed_redirect_uris",
            prop: "allowedRedirectUris",
            def: { rawType: true, toPostgres: () => "DEFAULT" },
          },
          {
            name: "default_redirect_uri",
            prop: "defaultRedirectUri",
            def: { rawType: true, toPostgres: () => "DEFAULT" },
          },
          {
            name: "allowed_scopes",
            prop: "allowedScopes",
            def: { rawType: true, toPostgres: () => "DEFAULT" },
          },
          {
            name: "link",
            prop: "link",
            def: { rawType: true, toPostgres: () => "DEFAULT" },
          },
        ],
        { table: "aurora_ai_service" }
      )
    )
  )

const addSessionAttributes = (
  t: ITask<unknown>,
  id: string,
  sessionAttributes: Record<string, unknown>
) =>
  t.none(
    `
      INSERT INTO session_attributes (id, session_attributes)
      VALUES ($/id/, $/sessionAttributes/)
    `,
    {
      id,
      sessionAttributes,
    }
  )

const addAccessToken = (
  t: ITask<unknown>,
  accessToken: Buffer,
  sessionAttributesId: string,
  auroraAIServiceId: string,
  expirationTime?: Date
) =>
  t.none(
    pgp.helpers.insert(
      {
        accessToken,
        sessionAttributesId,
        auroraAIServiceId,
        ...(expirationTime ? { expirationTime } : {}), // pg-promise will convert undefined values to NULLs
      },
      new pgp.helpers.ColumnSet(
        [
          { name: "access_token", prop: "accessToken" },
          { name: "session_attributes_id", prop: "sessionAttributesId" },
          { name: "aurora_ai_service_id", prop: "auroraAIServiceId" },
          {
            name: "expiration_time",
            prop: "expirationTime",
            def: { rawType: true, toPostgres: () => "DEFAULT" },
          },
        ],
        { table: "access_token" }
      )
    )
  )

const addOauthToken = async (
  t: ITask<unknown>,
  refreshToken: Buffer,
  accessToken: Buffer,
  username: string,
  auroraAIServiceId: string,
  allScopes: string[],
  activeScopes: string[],
  refreshExpirationDays: number
) => {
  await t.none(
    `
      INSERT INTO oauth_token_pair (refresh_token, access_token, username, aurora_ai_service_id, refresh_token_scopes, access_token_scopes, refresh_expiration_time)
      VALUES ($/refreshToken/, $/accessToken/, $/username/, $/auroraAIServiceId/, $/allScopes/, $/activeScopes/, NOW() + INTERVAL '$/refreshExpirationDays/ day')
    `,
    {
      refreshToken,
      accessToken,
      username,
      auroraAIServiceId,
      allScopes,
      activeScopes,
      refreshExpirationDays,
    }
  )
}

const addOauthAuthorizationCode = async (
  t: ITask<unknown>,
  code: Buffer,
  username: string,
  auroraAIServiceId: string,
  scopes: string[]
) => {
  await t.none(
    `
      INSERT INTO oauth_authorization_code (code, username, aurora_ai_service_id, scopes)
      VALUES ($/code/, $/username/, $/auroraAIServiceId/, $/scopes/)
    `,
    {
      code,
      username,
      auroraAIServiceId,
      scopes,
    }
  )
}

const storeAttributes = async (
  t: ITask<unknown>,
  attributes: string[],
  username: string,
  auroraAIServiceId: string
) => {
  await t.batch(
    attributes.map((attribute) =>
      t.none(
        "INSERT INTO attribute_source (username, aurora_ai_service_id, attribute) VALUES ($/username/, $/auroraAIServiceId/, $/attribute/)",
        { username, auroraAIServiceId, attribute }
      )
    )
  )
}

module.exports = async () => {
  setupTestDbConnection()

  await db.task(async (t) => {
    await addAuroraAiService(
      t,
      VALID_SERVICE_ID,
      VALID_PTV_ID,
      ["age", "municipality_code"],
      clientSecret(CLIENT_SECRET),
      "http://example.com",
      [REDIRECT_URI],
      REDIRECT_URI,
      ["age", "store:municipality_code"],
      translatable(
        "http://example-service.com",
        "http://example-service.com",
        "http://example-service.com"
      )
    )

    await addAuroraAiService(
      t,
      AGE_SERVICE_ID,
      AGE_SERVICE_PTV_ID,
      [],
      clientSecret(AGE_SERVICE_SECRET),
      AGE_SERVICE_ORIGIN
    )

    await addAuroraAiService(
      t,
      INVALID_AGE_SERVICE_ID,
      INVALID_AGE_SERVICE_PTV_ID,
      [],
      clientSecret(INVALID_AGE_SERVICE_SECRET),
      INVALID_AGE_SERVICE_ORIGIN
    )

    await addAuroraAiService(
      t,
      MUNICIPALITY_SERVICE_ID,
      MUNICIPALITY_SERVICE_PTV_ID,
      [],
      clientSecret(MUNICIPALITY_SERVICE_SECRET),
      MUNICIPALITY_SERVICE_ORIGIN
    )

    await addAuroraAiService(
      t,
      MULTI_ATTRIBUTE_SERVICE_ID,
      MULTI_ATTRIBUTE_SERVICE_PTV_ID,
      [],
      clientSecret(MULTI_ATTRIBUTE_SERVICE_SECRET),
      MULTI_ATTRIBUTE_SERVICE_ORIGIN
    )

    await addAuroraAiService(
      t,
      FAILING_SERVICE_ID,
      FAILING_SERVICE_PTV_ID,
      [],
      clientSecret(FAILING_SERVICE_SECRET),
      FAILING_SERVICE_ORIGIN
    )

    await addAuroraAiService(
      t,
      AGE_STORING_SERVICE_ID,
      AGE_STORING_SERVICE_ID,
      [],
      clientSecret(""),
      "http://example.com"
    )

    await addAuroraAiService(
      t,
      ANOTHER_SERVICE_ID,
      ANOTHER_PTV_ID,
      [],
      clientSecret(ANOTHER_SERVICE_CLIENT_SECRET),
      "http://example.com"
    )

    await addSessionAttributes(t, VALID_SESSION_ATTRIBUTES_ID, {
      age: 18,
      municipality_code: "005",
    })

    await addAccessToken(
      t,
      Buffer.from(VALID_ACCESS_TOKEN, "hex"),
      VALID_SESSION_ATTRIBUTES_ID,
      VALID_SERVICE_ID
    )
    await addAccessToken(
      t,
      Buffer.from(EXPIRED_ACCESS_TOKEN, "hex"),
      VALID_SESSION_ATTRIBUTES_ID,
      VALID_SERVICE_ID,
      new Date(0)
    )

    await addOauthToken(
      t,
      OAUTH_REFRESH_TOKEN_FOR_RENEWAL_TEST,
      OAUTH_ACCESS_TOKEN_FOR_RENEWAL_TEST,
      TEST_USER_ID,
      VALID_SERVICE_ID,
      TEST_SCOPES,
      TEST_SCOPES,
      100
    )

    await addOauthToken(
      t,
      VALID_OAUTH_REFRESH_TOKEN,
      VALID_OAUTH_ACCESS_TOKEN,
      TEST_USER_ID,
      VALID_SERVICE_ID,
      TEST_SCOPES,
      TEST_SCOPES,
      100
    )

    await addOauthToken(
      t,
      EXPIRED_OAUTH_REFRESH_TOKEN,
      EXPIRED_OAUTH_ACCESS_TOKEN,
      TEST_USER_ID,
      VALID_SERVICE_ID,
      TEST_SCOPES,
      TEST_SCOPES,
      -1
    )

    await addOauthToken(
      t,
      STORE_AGE_OAUTH_REFRESH_TOKEN,
      STORE_AGE_OAUTH_ACCESS_TOKEN,
      TEST_USER_ID,
      AGE_STORING_SERVICE_ID,
      ["store:age"],
      ["store:age"],
      100
    )

    await addOauthAuthorizationCode(
      t,
      VALID_OAUTH_AUTHORIZATION_CODE,
      TEST_USER_ID,
      VALID_SERVICE_ID,
      TEST_SCOPES
    )

    await storeAttributes(
      t,
      ["age"],
      AGE_STORED_USER_ID,
      AGE_STORING_SERVICE_ID
    )
  })
}

process.env.PROFILE_MANAGEMENT_COOKIE_PASSWORD = 'BQb4hA7kcE1y2U1HF41HKA9AtoJnUHm4MXdKeJ'
