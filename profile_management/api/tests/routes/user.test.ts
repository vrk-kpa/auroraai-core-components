import axios from "axios"
import base64url from "base64url"
import { UUID } from "io-ts-types"
import supertest from "supertest"
import * as uuid from "uuid"
import { app } from "../../src/app"
import { attributeController } from "../../src/controllers/attribute/attribute"
import { oauthController, TokenPair } from "../../src/controllers/oauth/oauth"
import { auroraAIServiceController } from "../../src/controllers/auroraAIService/auroraAIService"
import { db } from "../../src/db"
import {
  AGE_SERVICE_ID,
  ANOTHER_SERVICE_ID,
  FAILING_SERVICE_ID,
  REDIRECT_URI,
  VALID_SERVICE_ID,
  USER_NEW_TEST_EMAIL,
  USER_TEST_EMAIL,
  EXPIRED_EMAIL_VERIFY_TOKEN,
} from "../constants"
import { setupTestDbConnection } from "../helpers"
import jwt from "jsonwebtoken"
import { sesClient } from "../../src/ses/config"
import { cognitoClient } from "../../src/cognito/config"

jest.mock("../../src/config")
jest.mock("../../src/middlewares/UserMiddleware")
jest.mock("../../src/i18n.json", () => ({
  CustomMessage_InitiateEmailChange: {
    fi: {
      subject: "",
      message: "",
    },
  },
}))

const request = supertest(app)

afterAll(() => db.$pool.end())

beforeAll(setupTestDbConnection)

const GENERIC_TRANSLATABLE = {
  en: expect.any(String),
  fi: expect.any(String),
  sv: expect.any(String),
}

describe("user: connected services", () => {
  it("lists an authorized service as a connected service", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["age"],
      },
    })

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].retrievableAttributes).toStrictEqual([{ name: "age" }])
    expect(body[0].storableAttributes).toHaveLength(0)
  })

  it("lists an authorized service as a connected service with no attributes", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {},
    })

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].retrievableAttributes).toHaveLength(0)
    expect(body[0].storableAttributes).toHaveLength(0)
  })

  it("lists an authorized service as a connected service with multiple retrievable attributes", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["age", "municipality_code"],
      },
    })

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].retrievableAttributes).toStrictEqual([
      { name: "age" },
      { name: "municipality_code" },
    ])
    expect(body[0].storableAttributes).toHaveLength(0)
  })

  it("lists an authorized service as a connected service with a storable attribute", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].retrievableAttributes).toHaveLength(0)
    expect(body[0].storableAttributes).toStrictEqual([
      { name: "age", isStored: false },
    ])
  })

  it("lists an authorized service as a connected service with a storable and retrievable attribute", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].retrievableAttributes).toStrictEqual([
      { name: "municipality_code" },
    ])
    expect(body[0].storableAttributes).toStrictEqual([
      { name: "age", isStored: false },
    ])
  })

  it("lists an authorized service as a connected service with a stored storable attribute and retrievable attribute", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, VALID_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].retrievableAttributes).toStrictEqual([
      { name: "municipality_code" },
    ])
    expect(body[0].storableAttributes).toStrictEqual([
      { name: "age", isStored: true },
    ])
  })

  /**
   * If services OAuth tokens expire we may have a situation that an attribute is listed as stored but
   * there is no authorization to use that attribute. In this case the attribute should not be listed.
   */
  it("dosn't list a stored attribute with no authorization", async () => {
    // Create a new user with no oauth tokens
    const username = uuid.v4() as UUID

    await storeAttributesForUser(username, VALID_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].retrievableAttributes).toHaveLength(0)
    expect(body[0].storableAttributes).toHaveLength(0)
  })

  it("lists multiple authorized services as a connected services with mixed retrievable and stored attributes", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
      [ANOTHER_SERVICE_ID]: {
        retrievableAttributes: ["age", "life_situation_meters"],
        storableAttributes: ["municipality_code"],
      },
    })

    await storeAttributesForUser(username, ANOTHER_SERVICE_ID as UUID, [
      "municipality_code",
    ])

    const { status, body } = await request
      .get("/v1/user/services")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          retrievableAttributes: [{ name: "municipality_code" }],
          storableAttributes: [{ name: "age", isStored: false }],
        }),
        expect.objectContaining({
          retrievableAttributes: [
            { name: "age" },
            { name: "life_situation_meters" },
          ],
          storableAttributes: [{ name: "municipality_code", isStored: true }],
        }),
      ])
    )
  })

  it("removes a service from user account", async () => {
    const axiosSpy = jest.spyOn(axios, "delete")
    const username = await createUserWithAuthorizedAttributes({
      [AGE_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    const { status } = await request
      .delete("/v1/user/service")
      .set({ username })
      .type("json")
      .send({
        auroraAIServiceId: AGE_SERVICE_ID,
      })
    expect(status).toBe(204)
    axiosSpy.mockRestore()
  })

  it("retry row is inserted to DB if service removal requests fail", async () => {
    const axiosSpy = jest.spyOn(axios, "delete")
    const username = await createUserWithAuthorizedAttributes({
      [FAILING_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    const { status } = await request
      .delete("/v1/user/service")
      .set({ username })
      .type("json")
      .send({
        auroraAIServiceId: FAILING_SERVICE_ID,
      })
    expect(axiosSpy).toBeCalledTimes(3)
    expect(status).toBe(204)

    const pendingDeletions = await getPendingAttributeDeletions(
      username,
      FAILING_SERVICE_ID as UUID
    )
    expect(pendingDeletions.length).toBe(1)
    axiosSpy.mockRestore()
  })

  it("modifies service scopes successfully and replaces token pair with a new one", async () => {
    const axiosSpy = jest
      .spyOn(axios, "post")
      .mockImplementationOnce(() => Promise.resolve())
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    const { refreshToken } = await getUserTokensForService(
      username,
      VALID_SERVICE_ID as UUID
    )

    const { status } = await request
      .post("/v1/user/scope_change_request")
      .set({ username })
      .type("json")
      .send({
        serviceId: VALID_SERVICE_ID,
        scopes: ["age"],
      })

    // verify that old token does not exist anymore, but a new one is created
    const tokens = (await oauthController.getUserTokensByServiceId(
      username,
      VALID_SERVICE_ID as UUID
    )) as TokenPair[]
    const oldToken = tokens.find(
      (token) => !Buffer.compare(token.refreshToken, refreshToken)
    )

    expect(oldToken).toBe(undefined)
    expect(tokens.length).toBe(1)
    expect(status).toBe(204)
    expect(axiosSpy).toBeCalledTimes(1)

    // delete tokens created during testing
    await oauthController.removeAllTokenPairsForUser(username)
    axiosSpy.mockRestore()
  })

  it("attempts to modify service scopes but request to service fails", async () => {
    const axiosSpy = jest
      .spyOn(axios, "post")
      .mockImplementationOnce(() =>
        Promise.reject({ response: { status: 400 } })
      )
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    const { refreshToken } = await getUserTokensForService(
      username,
      VALID_SERVICE_ID as UUID
    )

    const { status } = await request
      .post("/v1/user/scope_change_request")
      .set({ username })
      .type("json")
      .send({
        serviceId: VALID_SERVICE_ID,
        scopes: ["age"],
      })

    // verify that old token is restored
    const tokens = (await oauthController.getUserTokensByServiceId(
      username,
      VALID_SERVICE_ID as UUID
    )) as TokenPair[]

    const oldToken = tokens.find(
      (token) => !Buffer.compare(token.refreshToken, refreshToken)
    )

    expect(oldToken).toBeDefined()
    expect(tokens.length).toBe(1)
    expect(status).toBe(500)
    expect(axiosSpy).toBeCalledTimes(1)

    // delete tokens created during testing
    await oauthController.removeAllTokenPairsForUser(username)
    axiosSpy.mockRestore()
  })

  it("deletes an authorized scope successfully", async () => {
    const axiosSpy = jest
      .spyOn(axios, "post")
      .mockImplementationOnce(() => Promise.resolve())
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, VALID_SERVICE_ID as UUID, ["age"])

    const { status } = await request
      .post("/v1/user/scope_change_request")
      .set({ username })
      .type("json")
      .send({
        serviceId: VALID_SERVICE_ID,
        scopes: [],
      })

    const attributeSources = await getUserAttributesSourcesByServiceID(
      username,
      VALID_SERVICE_ID as UUID
    )
    expect(status).toBe(204)
    expect(attributeSources.length).toBe(0)
    // delete tokens created during testing
    await oauthController.removeAllTokenPairsForUser(username)
    axiosSpy.mockRestore()
  })
})

describe("user: OAuth authorization initialization", () => {
  it("allows authorization initialization, and returns correct redirect URI, client info, and sources", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [ANOTHER_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, ANOTHER_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .post("/v1/user/authorize_init")
      .set({ username })
      .type("json")
      .send({
        clientId: VALID_SERVICE_ID,
        redirectUri: REDIRECT_URI,
        scopes: ["age"],
        consentRequired: false,
      })

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      client: {
        id: VALID_SERVICE_ID,
        name: GENERIC_TRANSLATABLE,
      },
      redirectUri: REDIRECT_URI,
      sources: {
        age: [GENERIC_TRANSLATABLE],
      },
    })
  })

  it("refuses authorization initialization with extraneous scopes", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [ANOTHER_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, ANOTHER_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .post("/v1/user/authorize_init")
      .set({ username })
      .type("json")
      .send({
        clientId: VALID_SERVICE_ID,
        redirectUri: REDIRECT_URI,
        scopes: ["age", "municipality_code"],
        consentRequired: false,
      })

    expect(status).toBe(401)
    expect(body).toStrictEqual({
      details: {
        code: "invalid_scope",
        context: "Oauth",
      },
      error: "UnauthorizedError",
      message: "Unauthorized scope included",
    })
  })

  it("refuses authorization initialization with a disallowed redirect URI", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [ANOTHER_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, ANOTHER_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .post("/v1/user/authorize_init")
      .set({ username })
      .type("json")
      .send({
        clientId: VALID_SERVICE_ID,
        redirectUri: "http://example2.com",
        scopes: ["age"],
        consentRequired: false,
      })

    expect(status).toBe(401)
    expect(body).toStrictEqual({
      details: {
        code: "invalid_request",
        context: "Oauth",
      },
      error: "UnauthorizedError",
      message: "Redirect URI is not allowed",
    })
  })
})

describe("user: OAuth authorization", () => {
  it("authorizes an user and returns an authorization code", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [ANOTHER_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, ANOTHER_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .post("/v1/user/authorize")
      .set({ username })
      .type("json")
      .send({
        clientId: VALID_SERVICE_ID,
        redirectUri: REDIRECT_URI,
        scopes: ["age"],
      })

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      code: expect.any(String),
    })

    const codeInfo = await getAuthorizationCodeByCode(body.code)
    expect(codeInfo).toStrictEqual({
      username,
      auroraAIServiceId: VALID_SERVICE_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["openid", "age"],
    })
  })

  it("refuses authorization with extraneous scopes", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [ANOTHER_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, ANOTHER_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .post("/v1/user/authorize")
      .set({ username })
      .type("json")
      .send({
        clientId: VALID_SERVICE_ID,
        redirectUri: REDIRECT_URI,
        scopes: ["age", "municipality_code"],
      })

    expect(status).toBe(401)
    expect(body).toStrictEqual({
      details: {
        code: "invalid_scope",
        context: "Oauth",
      },
      error: "UnauthorizedError",
      message: "Unauthorized scope included",
    })
  })

  it("refuses authorization with a disallowed redirect URI", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [ANOTHER_SERVICE_ID]: {
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, ANOTHER_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .post("/v1/user/authorize")
      .set({ username })
      .type("json")
      .send({
        clientId: VALID_SERVICE_ID,
        redirectUri: "http://example2.com",
        scopes: ["age"],
      })

    expect(status).toBe(401)
    expect(body).toStrictEqual({
      details: {
        code: "invalid_request",
        context: "Oauth",
      },
      error: "UnauthorizedError",
      message: "Redirect URI is not allowed",
    })
  })
})

describe("user: account deletion", () => {
  it("lists correct deletion blocking services", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })

    await storeAttributesForUser(username, VALID_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .get("/v1/user/services_blocking_deletion")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      retrievable: [GENERIC_TRANSLATABLE],
      storable: [
        {
          link: GENERIC_TRANSLATABLE,
          name: GENERIC_TRANSLATABLE,
        },
      ],
    })
  })

  it("lists a stored attribute even without a valid authorization", async () => {
    const username = uuid.v4() as UUID

    await storeAttributesForUser(username, VALID_SERVICE_ID as UUID, ["age"])

    const { status, body } = await request
      .get("/v1/user/services_blocking_deletion")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      retrievable: [],
      storable: [
        {
          link: GENERIC_TRANSLATABLE,
          name: GENERIC_TRANSLATABLE,
        },
      ],
    })
  })

  it("doesn't list expired authorizations as blockers", async () => {
    const username = await createUserWithAuthorizedAttributes(
      {
        [VALID_SERVICE_ID]: {
          retrievableAttributes: ["municipality_code"],
        },
      },
      new Date(2000, 1, 1, 0, 0, 0)
    )

    const { status, body } = await request
      .get("/v1/user/services_blocking_deletion")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      retrievable: [],
      storable: [],
    })
  })

  it("deactivates all connected services", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
      },
      [ANOTHER_SERVICE_ID]: {
        retrievableAttributes: ["age"],
      },
    })

    const { status } = await request
      .post("/v1/user/deactivate_all_services")
      .set({ username })

    expect(status).toBe(204)
    expect(await getAuthorizedServicesCount(username)).toBe("0")
  })

  it("removes user and sends removal requests to connected services", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })
    const removeAttributeSourcesSpy = jest
      .spyOn(attributeController, "removeAttributeSourcesByServiceId")
      .mockImplementation(() => Promise.resolve())

    const requestServiceToDeleteAttributesSpy = jest
      .spyOn(auroraAIServiceController, "requestServiceToDeleteAttributes")
      .mockImplementation(() => Promise.resolve(true))

    const { status, body } = await request
      .delete("/v1/user/me")
      .set({ username })

    expect(status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(removeAttributeSourcesSpy).toHaveBeenCalledTimes(1)
    expect(requestServiceToDeleteAttributesSpy).toHaveBeenCalledTimes(1)
    removeAttributeSourcesSpy.mockRestore()
    requestServiceToDeleteAttributesSpy.mockRestore()
  })
})

describe("user: email address change initiation", () => {
  it("successfully initiates email change request", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })
    const jwtSignSpy = jest.spyOn(jwt, "sign")
    const sesClientSpy = jest.spyOn(sesClient, "send")
    const { status, body } = await request
      .post("/v1/user/change_email")
      .set({ username })
      .send({
        email: USER_TEST_EMAIL,
        newEmail: USER_NEW_TEST_EMAIL,
        language: "fi",
      })
    expect(status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(jwtSignSpy).toBeCalledTimes(1)
    expect(sesClientSpy).toBeCalledTimes(1)
    jwtSignSpy.mockRestore()
    sesClientSpy.mockRestore()
  })

  it("fails to initiate email change request due to SES failure", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })
    const jwtSignSpy = jest.spyOn(jwt, "sign")
    const sesClientSpy = jest
      .spyOn(sesClient, "send")
      .mockImplementationOnce(() => Promise.reject("Mocked SES error"))
    const { status } = await request
      .post("/v1/user/change_email")
      .set({ username })
      .send({
        email: USER_TEST_EMAIL,
        newEmail: USER_NEW_TEST_EMAIL,
        language: "fi",
      })
    expect(status).toBe(500)
    expect(jwtSignSpy).toBeCalledTimes(1)
    expect(sesClientSpy).toBeCalledTimes(1)
    jwtSignSpy.mockRestore()
    sesClientSpy.mockRestore()
  })
})

describe("user: email address change verification", () => {
  it("email is verified successfully", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })

    const cognitoClientSpy = jest
      .spyOn(cognitoClient, "send")
      .mockImplementationOnce(() => Promise.resolve({ Users: [] })) // mock - check if the user already verified
      .mockImplementationOnce(() =>
        Promise.resolve({
          Users: [
            { UserAttributes: [{ Name: "email", Value: USER_NEW_TEST_EMAIL }] },
          ],
        })
      ) // mock - make sure the current email is still valid
      .mockImplementationOnce(() => Promise.resolve())

    const jwtVerifySpy = jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => ({
        email: USER_TEST_EMAIL,
        newEmail: USER_NEW_TEST_EMAIL,
      }))
    const { status, body } = await request
      .post("/v1/user/change_email_verify")
      .set({ username })
      .send({
        token: "ABCD",
      })
    expect(status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(jwtVerifySpy).toBeCalledTimes(1)
    expect(cognitoClientSpy).toBeCalledTimes(3)
    jwtVerifySpy.mockRestore()
    cognitoClientSpy.mockRestore()
  })

  it("verification fails because it was already done", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })

    const cognitoClientSpy = jest
      .spyOn(cognitoClient, "send")
      .mockImplementationOnce(() =>
        Promise.resolve({
          Users: [
            { UserAttributes: [{ Name: "email", Value: USER_NEW_TEST_EMAIL }] },
          ],
        })
      ) // check email availability
      .mockImplementationOnce(() => Promise.resolve(true)) // user update command

    const jwtVerifySpy = jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => ({
        email: USER_TEST_EMAIL,
        newEmail: USER_NEW_TEST_EMAIL,
      }))
    const { status } = await request
      .post("/v1/user/change_email_verify")
      .set({ username })
      .send({
        token: "ABCD",
      })
    expect(status).toBe(401)
    expect(jwtVerifySpy).toBeCalledTimes(1)
    expect(cognitoClientSpy).toBeCalledTimes(1)
    jwtVerifySpy.mockRestore()
    cognitoClientSpy.mockRestore()
  })

  it("verification fails because token is expired", async () => {
    const username = await createUserWithAuthorizedAttributes({
      [VALID_SERVICE_ID]: {
        retrievableAttributes: ["municipality_code"],
        storableAttributes: ["age"],
      },
    })

    const { status, body } = await request
      .post("/v1/user/change_email_verify")
      .set({ username })
      .send({
        token: EXPIRED_EMAIL_VERIFY_TOKEN,
      })
    expect(status).toBe(400)
    expect(body).toEqual({ error: "ValidationError", message: "Invalid token" })
  })
})

const createUserWithAuthorizedAttributes = async (
  serviceAttributes: Record<
    string,
    { retrievableAttributes?: string[]; storableAttributes?: string[] }
  >,
  expirationTime?: Date
) => {
  const username = uuid.v4() as UUID

  await Promise.all(
    Object.entries<{
      retrievableAttributes?: string[]
      storableAttributes?: string[]
    }>(serviceAttributes).map(
      async ([serviceId, { retrievableAttributes, storableAttributes }]) => {
        const scopes = [
          "openid",
          ...(retrievableAttributes ?? []),
          ...(storableAttributes?.map((attr) => `store:${attr}`) ?? []),
        ]

        const { accessToken } = await oauthController.createTokenPair(
          serviceId as UUID,
          username,
          scopes,
          scopes,
          new Date()
        )

        if (expirationTime) {
          await db.task((t) =>
            t.none(
              `
                UPDATE oauth_token_pair
                SET refresh_expiration_time = $/expirationTime/, access_expiration_time = $/expirationTime/
                WHERE access_token = $/accessToken/
              `,
              { accessToken, expirationTime }
            )
          )
        }
      }
    )
  )

  return username
}

const storeAttributesForUser = (
  username: UUID,
  auroraAIServiceId: UUID,
  storableAttributes: string[]
) =>
  attributeController.addAttributeSources(
    username,
    auroraAIServiceId,
    storableAttributes
  )

const getAuthorizationCodeByCode = (code: string) =>
  db.task((t) =>
    t.oneOrNone<{
      username: string
      auroraAIServiceId: string
      redirectUri: string
      scopes: string[]
    }>(
      `SELECT username, aurora_ai_service_id as "auroraAIServiceId", redirect_uri as "redirectUri", scopes
       FROM oauth_authorization_code
       WHERE code = $/decodedAuthorizationCode/`,
      { decodedAuthorizationCode: base64url.toBuffer(code) }
    )
  )

const getAuthorizedServicesCount = async (username: string) => {
  const oauthTokenPairCount = await db.task((t) =>
    t.oneOrNone<{
      count: string
    }>(
      `SELECT COUNT(*) as "count"
       FROM oauth_token_pair
       WHERE username = $/username/`,
      { username }
    )
  )
  return oauthTokenPairCount?.count ?? "0"
}

const getPendingAttributeDeletions = async (
  username: UUID,
  auroraAIServiceId: UUID
) =>
  await db.task((t) =>
    t.manyOrNone<{
      username: UUID
      auroraAIServiceId: UUID
      initiated_time: Date
    }>(
      `SELECT username, aurora_ai_service_id as "auroraAIServiceId", initiated_time as "initiatedTime" 
      FROM attribute_deletion
      WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/
      `,
      { username, auroraAIServiceId }
    )
  )

const getUserTokensForService = async (username: UUID, serviceId: UUID) => {
  const { accessToken, refreshToken } = await db.task((t) =>
    t.oneOrNone(
      `SELECT access_token as "accessToken", refresh_token as "refreshToken" 
      FROM oauth_token_pair 
      WHERE username = $/username/ AND aurora_ai_service_id = $/serviceId/`,
      { username, serviceId }
    )
  )
  return { accessToken, refreshToken }
}

const getUserAttributesSourcesByServiceID = async (
  username: UUID,
  serviceId: UUID
) =>
  (
    await db.task((t) =>
      t.manyOrNone(
        `SELECT attribute 
        FROM attribute_source
        WHERE username = $/username/ AND aurora_ai_service_id = $/serviceId/`,
        { username, serviceId }
      )
    )
  ).map((attribute) => attribute.attribute)
