import supertest from "supertest"
import { app } from "../../src/app"
import { db } from "../../src/db"
import {
  INVALID_PTV_ID,
  VALID_ACCESS_TOKEN,
  VALID_PTV_ID,
  INVALID_ACCESS_TOKEN,
  MISSING_ACCESS_TOKEN,
  EXPIRED_ACCESS_TOKEN,
} from "../constants"
import { AUTHORIZATION_HEADERS, setupTestDbConnection } from "../helpers"

const request = supertest(app)

afterAll(() => db.$pool.end())

beforeAll(setupTestDbConnection)

describe("addition of session attributes", () => {
  it("rejects an invalid PTV ID", async () => {
    const { status, body } = await request
      .post("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptvServiceChannelId: INVALID_PTV_ID,
        sessionAttributes: {},
      })

    expect(status).toBe(400)
    expect(body.error).toEqual("ValidationError")
  })

  it("doesn't return an access token when called without any attributes", async () => {
    const { status, body } = await request
      .post("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptvServiceChannelId: VALID_PTV_ID,
        sessionAttributes: {},
      })

    expect(status).toBe(400)
    expect(body.accessToken).toBeUndefined()
  })

  it("doesn't return an access token when called with unsupported attributes", async () => {
    // The service VALID_PTV_ID config allows only "age" and "municipality_code" session transfer attributes.
    const { status, body } = await request
      .post("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptvServiceChannelId: VALID_PTV_ID,
        sessionAttributes: {
          life_situation_meters: {
            family: [8],
          },
        },
      })

    expect(status).toBe(200)
    expect(body.ptvServiceChannelId).toBe(VALID_PTV_ID)
    expect(body.accessToken).toBeUndefined()
  })

  it("returns an access token when when called with all supported attributes", async () => {
    const { status, body } = await request
      .post("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptvServiceChannelId: VALID_PTV_ID,
        sessionAttributes: {
          age: 18,
          municipality_code: "005",
        },
      })

    expect(status).toBe(200)
    expect(typeof body.accessToken).toBe("string")
  })

  it("returns an access token when when called with only municipality code attribute", async () => {
    const { status, body } = await request
      .post("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptvServiceChannelId: VALID_PTV_ID,
        sessionAttributes: {
          municipality_code: "005",
        },
      })

    expect(status).toBe(200)
    expect(typeof body.accessToken).toBe("string")
  })

  it("returns an access token when when called with only age attribute", async () => {
    const { status, body } = await request
      .post("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptvServiceChannelId: VALID_PTV_ID,
        sessionAttributes: {
          age: 18,
        },
      })

    expect(status).toBe(200)
    expect(typeof body.accessToken).toBe("string")
  })

  it("returns an access token when called with supported and unsupported attributes…", async () => {
    const { status, body } = await request
      .post("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptvServiceChannelId: VALID_PTV_ID,
        sessionAttributes: {
          age: 18,
          municipality_code: "005",
          life_situation_meters: {
            family: [8],
          },
        },
      })

    expect(status).toBe(200)
    expect(body.ptvServiceChannelId).toBe(VALID_PTV_ID)
    expect(typeof body.accessToken).toBe("string")
  })
})

describe("retrieval of session attributes", () => {
  it("returns the associated attributes", async () => {
    const { status, body } = await request
      .get("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .query({
        access_token: VALID_ACCESS_TOKEN,
      })

    expect(status).toBe(200)
    expect(body).toEqual({
      age: 18,
      municipality_code: "005",
    })
  })

  it("returns a 404 error for a non-existent access token", async () => {
    const { status, body } = await request
      .get("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .query({
        access_token: MISSING_ACCESS_TOKEN,
      })

    expect(status).toBe(404)
    expect(body.error).toEqual("NotFoundError")
  })

  it("returns a 404 error for an expired access token", async () => {
    const { status, body } = await request
      .get("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .query({
        access_token: EXPIRED_ACCESS_TOKEN,
      })

    expect(status).toBe(404)
    expect(body.error).toEqual("NotFoundError")
  })

  it("returns a 400 error for a invalid access token", async () => {
    const { status, body } = await request
      .get("/v1/session_attributes")
      .set(AUTHORIZATION_HEADERS)
      .query({
        access_token: INVALID_ACCESS_TOKEN,
      })

    expect(status).toBe(400)
    expect(body.error).toEqual("ValidationError")
  })
})
