import supertest from "supertest"
import { app } from "../../../src/app"
import { db } from "../../../src/db"
import {
  TEST_SCOPES,
  VALID_SERVICE_ID,
  OAUTH_REFRESH_TOKEN_FOR_RENEWAL_TEST,
  CLIENT_SECRET,
  EXPIRED_OAUTH_REFRESH_TOKEN,
  VALID_OAUTH_AUTHORIZATION_CODE,
  ANOTHER_SERVICE_ID,
  TEST_USER_ID,
  MISSING_OAUTH_ACCESS_TOKEN,
} from "../../constants"
import { buildOauthClientHeader, setupTestDbConnection } from "../../helpers"
import base64url from "base64url"
import { oauthController } from "../../../src/controllers/oauth/oauth"
import { UUID } from "io-ts-types"

const request = supertest(app)

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)

describe("client-authenticated OAuth: token", () => {
  it("returns new refresh and access tokens when called with an authorization code", async () => {
    const { status, body } = await request
      .post("/oauth/token")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        grant_type: "authorization_code",
        code: base64url(VALID_OAUTH_AUTHORIZATION_CODE),
      })

    expect(status).toEqual(200)

    await verifyNewTokens(body.access_token, body.refresh_token)
  })

  it("returns new oauth tokens and expires current tokens when called with a refresh token", async () => {
    const { status, body } = await request
      .post("/oauth/token")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        grant_type: "refresh_token",
        refresh_token: base64url(OAUTH_REFRESH_TOKEN_FOR_RENEWAL_TEST),
        scope: TEST_SCOPES.join(" "),
      })

    expect(status).toEqual(200)
    expect(body.refresh_token).not.toEqual(
      base64url(OAUTH_REFRESH_TOKEN_FOR_RENEWAL_TEST)
    )

    await verifyNewTokens(body.access_token, body.refresh_token)

    const { refreshTokenExpired, accessTokenExpired } =
      await getExpirationStatusByRefreshToken(
        OAUTH_REFRESH_TOKEN_FOR_RENEWAL_TEST
      )

    expect(refreshTokenExpired).toBe(true)
    expect(accessTokenExpired).toBe(true)
  })

  it("returns error when called with an expired refresh token", async () => {
    const { status, body } = await request
      .post("/oauth/token")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        grant_type: "refresh_token",
        refresh_token: base64url(EXPIRED_OAUTH_REFRESH_TOKEN),
        scope: TEST_SCOPES.join(" "),
      })

    expect(status).toEqual(400)
    expect(body.error).toEqual("invalid_grant")
  })
})

describe("revoke endpoint", () => {
  it("returns 200 and deletes token pair when called with a valid access token and type hint", async () => {
    const { accessToken } = await createTestTokenPair()

    const { status } = await request
      .post("/oauth/revoke")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        token: base64url(accessToken),
        token_type_hint: "test_hint", // should be ignored
      })

    expect(status).toEqual(200)
    expect(
      await oauthController.getAccessToken(base64url(accessToken))
    ).toEqual(null)
  })

  it("returns 200 and deletes token pair when called with a valid refresh token", async () => {
    const { refreshToken } = await createTestTokenPair()

    const { status } = await request
      .post("/oauth/revoke")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        token: base64url(refreshToken),
      })

    expect(status).toEqual(200)
    expect(
      await oauthController.getAccessToken(base64url(refreshToken))
    ).toEqual(null)
  })

  it("returns 200 even when called with non-existent token", async () => {
    const { status } = await request
      .post("/oauth/revoke")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        token: base64url(MISSING_OAUTH_ACCESS_TOKEN),
      })

    expect(status).toEqual(200)
    expect(
      await oauthController.getAccessToken(
        base64url(MISSING_OAUTH_ACCESS_TOKEN)
      )
    ).toEqual(null)
  })

  it("returns error when called with another service's token", async () => {
    const { refreshToken } = await createTestTokenPair(ANOTHER_SERVICE_ID)

    const { status, body } = await request
      .post("/oauth/revoke")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        token: base64url(refreshToken),
      })

    expect(status).toEqual(400)
    expect(body.error).toEqual("invalid_grant")

    const databaseToken = await oauthController.getRefreshToken(
      base64url(refreshToken)
    )
    expect(databaseToken?.token).toEqual(refreshToken)
  })

  it("returns error when called without token", async () => {
    const { status, body } = await request
      .post("/oauth/revoke")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({})

    expect(status).toEqual(400)
    expect(body.error).toEqual("invalid_request")
  })
})

const verifyNewTokens = async (accessToken: string, refreshToken: string) => {
  expect(base64url.toBuffer(accessToken).length).toEqual(128)
  expect(base64url.toBuffer(refreshToken).length).toEqual(128)

  const linkedRefreshToken = await getRefreshTokenByAccessToken(accessToken)
  expect(linkedRefreshToken).toEqual(refreshToken)
}

const getRefreshTokenByAccessToken = async (accessToken: string) => {
  const decodedAccessToken = base64url.toBuffer(accessToken)

  const refreshToken = await db.task((t) =>
    t.oneOrNone(
      `SELECT refresh_token
         FROM oauth_token_pair
         WHERE access_token = $/decodedAccessToken/`,
      { decodedAccessToken }
    )
  )

  return base64url(refreshToken.refresh_token)
}

const getExpirationStatusByRefreshToken = (refreshToken: Buffer) =>
  db.task((t) =>
    t.one<{
      refreshTokenExpired: boolean
      accessTokenExpired: boolean
    }>(
      `SELECT refresh_expiration_time < NOW() as "refreshTokenExpired",
                  access_expiration_time < NOW()  as "accessTokenExpired"
           FROM oauth_token_pair
           WHERE refresh_token = $/refreshToken/`,
      { refreshToken }
    )
  )

const createTestTokenPair = async (serviceID: string = VALID_SERVICE_ID) =>
  oauthController.createTokenPair(
    serviceID as UUID,
    TEST_USER_ID as UUID,
    TEST_SCOPES,
    TEST_SCOPES,
    new Date()
  )
