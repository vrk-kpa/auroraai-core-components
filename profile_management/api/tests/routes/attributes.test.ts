import axios from "axios"
import { UUID } from "io-ts-types/lib/UUID"
import supertest from "supertest"
import { v4 } from "uuid"
import { app } from "../../src/app"
import { attributeController } from "../../src/controllers/attribute/attribute"
import { oauthController } from "../../src/controllers/oauth/oauth"
import { db } from "../../src/db"
import { generateUUIDForOauthClient } from "../../src/util/uuid"
import {
  MULTI_ATTRIBUTE_SERVICE_ID,
  AGE_SERVICE_ID,
  AGE_SERVICE_ORIGIN,
  AGE_STORED_USER_ID,
  AGE_STORING_SERVICE_ID,
  CLIENT_SECRET,
  FAILING_SERVICE_ID,
  INVALID_AGE_SERVICE_ID,
  MUNICIPALITY_SERVICE_ID,
  STORE_AGE_OAUTH_ACCESS_TOKEN,
  TEST_USER_ID,
  VALID_SERVICE_ID,
} from "../constants"
import {
  buildOauthAccessTokenHeader,
  buildOauthClientHeader,
  setupTestDbConnection,
} from "../helpers"
import jwt from "jsonwebtoken"
import { getSecret } from "../../src/util/secrets"
import jwkToPem from "jwk-to-pem"

const request = supertest(app)

afterAll(() => db.$pool.end())

beforeAll(setupTestDbConnection)

describe("attributes", () => {
  it("stores given attributes", async () => {
    const { status } = await request
      .patch("/profile-management/v1/user_attributes")
      .set(buildOauthAccessTokenHeader(STORE_AGE_OAUTH_ACCESS_TOKEN))
      .type("json")
      .send(["age"])

    expect(status).toBe(204)

    const attributesInDatabase = await getStoredAttributes(
      TEST_USER_ID as UUID,
      AGE_STORING_SERVICE_ID as UUID
    )

    expect(attributesInDatabase).toStrictEqual([
      {
        attribute: "age",
      },
    ])

    await cleanStoredAttributes(
      TEST_USER_ID as UUID,
      AGE_STORING_SERVICE_ID as UUID
    )
  })

  it("forbids storing attributes that aren't in scope", async () => {
    const { status, headers } = await request
      .patch("/profile-management/v1/user_attributes")
      .set(buildOauthAccessTokenHeader(STORE_AGE_OAUTH_ACCESS_TOKEN))
      .type("json")
      .send(["age", "municipality_code"])

    expect(status).toBe(403)
    expect(headers["www-authenticate"]).toBe(
      'Bearer error="insufficient_scope"'
    )

    const attributesInDatabase = await getStoredAttributes(
      TEST_USER_ID as UUID,
      AGE_STORING_SERVICE_ID as UUID
    )

    expect(attributesInDatabase).toStrictEqual([])
  })

  it("deletes given attributes", async () => {
    const { status } = await request
      .delete("/profile-management/v1/user_attributes")
      .set(buildOauthClientHeader(VALID_SERVICE_ID, CLIENT_SECRET))
      .type("json")
      .send({
        user_attributes: ["age"],
        user_id: await generateUUIDForOauthClient(
          AGE_STORED_USER_ID as UUID,
          VALID_SERVICE_ID as UUID
        ),
      })

    expect(status).toBe(204)

    const attributesInDatabase = await getStoredAttributes(
      AGE_STORED_USER_ID as UUID,
      VALID_SERVICE_ID as UUID
    )

    expect(attributesInDatabase).toStrictEqual([])
  })

  it("returns an attribute from a source", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [AGE_SERVICE_ID]: ["age"],
      },
      ["age"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/age")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "SUCCESS",
        value: 18,
      },
    })
  })

  it("rejects invalid attribute value from a source", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [INVALID_AGE_SERVICE_ID]: ["age"],
      },
      ["age"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/age")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "NOT_AVAILABLE",
      },
    })
  })

  it("returns multiple attributes from a source", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [MULTI_ATTRIBUTE_SERVICE_ID]: [
          "age",
          "municipality_code",
          "tampere_demo_flag",
        ],
      },
      ["age", "municipality_code", "tampere_demo_flag"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/all_authorized")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "SUCCESS",
        value: 18,
      },
      municipality_code: {
        status: "SUCCESS",
        value: "005",
      },
      tampere_demo_flag: {
        status: "SUCCESS",
        value: true,
      },
    })
  })

  it("returns multiple attributes from multiple sources", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [AGE_SERVICE_ID]: ["age"],
        [MUNICIPALITY_SERVICE_ID]: ["municipality_code"],
      },
      ["age", "municipality_code"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/all_authorized")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "SUCCESS",
        value: 18,
      },
      municipality_code: {
        status: "SUCCESS",
        value: "005",
      },
    })
  })

  it("returns only authorized attributes", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [AGE_SERVICE_ID]: ["age"],
        [MUNICIPALITY_SERVICE_ID]: ["municipality_code"],
      },
      ["municipality_code"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/all_authorized")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      municipality_code: {
        status: "SUCCESS",
        value: "005",
      },
    })
  })

  it("won't return attributes already stored in the calling service", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [VALID_SERVICE_ID]: ["age"],
        [MUNICIPALITY_SERVICE_ID]: ["municipality_code"],
      },
      ["age", "municipality_code"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/all_authorized")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      municipality_code: {
        status: "SUCCESS",
        value: "005",
      },
    })
  })

  it("returns one attribute from a source and one attribute from a fallback source", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [MUNICIPALITY_SERVICE_ID]: ["age", "municipality_code"],
        [AGE_SERVICE_ID]: ["age"],
      },
      ["age", "municipality_code"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/all_authorized")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "SUCCESS",
        value: 18,
      },
      municipality_code: {
        status: "SUCCESS",
        value: "005",
      },
    })
  })

  it("returns a not available status when there are no sources", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes({}, ["age"])

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/age")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "NOT_AVAILABLE",
      },
    })
  })

  it("returns a not available status when there are no appropriate sources", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [MUNICIPALITY_SERVICE_ID]: ["municipality_code"],
      },
      ["age"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/age")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "NOT_AVAILABLE",
      },
    })
  })

  it("returns a not available status when the source is unavailable", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [FAILING_SERVICE_ID]: ["age"],
      },
      ["age"]
    )

    const { status, body } = await request
      .get("/profile-management/v1/user_attributes/age")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(200)
    expect(body).toStrictEqual({
      age: {
        status: "NOT_AVAILABLE",
      },
    })
  })

  it("forbids requesting attributes outside of the granted scope", async () => {
    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [FAILING_SERVICE_ID]: ["age"],
      },
      ["age"]
    )

    const { status, headers } = await request
      .get("/profile-management/v1/user_attributes/municipality_code")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(status).toBe(403)
    expect(headers["www-authenticate"]).toBe(
      'Bearer error="insufficient_scope"'
    )
  })

  it("makes a valid data provider request", async () => {
    const axiosSpy = jest.spyOn(axios, "get")

    const accessToken = await createAccessTokenAndStoreAttributes(
      {
        [AGE_SERVICE_ID]: ["age"],
      },
      ["age"]
    )

    await request
      .get("/profile-management/v1/user_attributes/age")
      .set(buildOauthAccessTokenHeader(accessToken))
      .type("json")

    expect(axiosSpy).toHaveBeenCalled()

    const [url, config] = axiosSpy.mock.calls[0]

    const fullUrl = `${AGE_SERVICE_ORIGIN}/auroraai/profile-management/v1/user_attributes`
    expect(url).toBe(fullUrl)
    expect(config).toHaveProperty("headers.authorization")

    let authType,
      authPayload = ""

    if (typeof config?.headers?.authorization === "string") {
      [authType, authPayload] = (config?.headers?.authorization ?? "").split(
        " "
      )
    }

    expect(authType).toBe("Bearer")

    const authTokenData = jwt.decode(authPayload, { complete: true })

    const { alg, e, kid, kty, n, use } = JSON.parse(
      (await getSecret("Profile_Management_Oauth_JWK")) ?? "{}"
    )

    const jwk = { alg, e, kid, kty, n, use }

    expect(authTokenData?.header.kid).toBe(jwk.kid)

    const verified = jwt.verify(authPayload, jwkToPem(jwk))

    expect(typeof verified).not.toBe("string")

    const payload = verified as jwt.JwtPayload
    expect(payload.aud).toBe(AGE_SERVICE_ORIGIN)
    expect(payload.scope).toBe("age")

    axiosSpy.mockRestore()
  })
})

/**
 * Creates a new user with the given stored attributes
 * and returns a new access token for the new user with
 * permissions to get the wanted attributes.
 */
const createAccessTokenAndStoreAttributes = async (
  storedAttributes: Record<UUID, string[]>,
  wantedAttributes: string[]
) => {
  const username = v4() as UUID

  await Promise.all(
    Object.entries<string[]>(storedAttributes).map(
      async ([source, attributes]) => {
        const scopes = attributes.map((attr) => `store:${attr}`)

        await oauthController.createTokenPair(
          source as UUID,
          username,
          scopes,
          scopes,
          new Date()
        )

        await attributeController.addAttributeSources(
          username,
          source as UUID,
          attributes
        )
      }
    )
  )

  const { accessToken } = await oauthController.createTokenPair(
    VALID_SERVICE_ID as UUID,
    username,
    wantedAttributes,
    wantedAttributes,
    new Date()
  )

  return accessToken
}

const getStoredAttributes = (username: UUID, auroraAIServiceId: UUID) =>
  db.task((t) =>
    t.manyOrNone<{ attribute: string }>(
      "SELECT attribute FROM attribute_source WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/",
      { username, auroraAIServiceId }
    )
  )

const cleanStoredAttributes = (username: UUID, auroraAIServiceId: UUID) =>
  db.task((t) =>
    t.manyOrNone<{ attribute: string }>(
      "DELETE FROM attribute_source WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/",
      { username, auroraAIServiceId }
    )
  )
