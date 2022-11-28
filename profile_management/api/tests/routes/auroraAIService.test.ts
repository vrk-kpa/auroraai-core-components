import supertest from "supertest"
import { app } from "../../src/app"
import { db } from "../../src/db"
import { INVALID_PTV_ID, VALID_PTV_ID } from "../constants"
import { AUTHORIZATION_HEADERS, setupTestDbConnection } from "../helpers"

const request = supertest(app)

afterAll(() => db.$pool.end())

beforeAll(setupTestDbConnection)

describe("session transfer support", () => {
  it("returns a validation error for an invalid PTV channel ID", async () => {
    const { status, body } = await request
      .post("/v1/aurora_ai_services/session_transfer_supports")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptv_service_channel_ids: "invalid",
      })

    expect(status).toBe(400)
    expect(body.error).toEqual("ValidationError")
  })

  it("returns a validation error when giving a string instead of a PTV channel ID array", async () => {
    const { status, body } = await request
      .post("/v1/aurora_ai_services/session_transfer_supports")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptv_service_channel_ids: ["invalid"],
      })

    expect(status).toBe(400)
    expect(body.error).toEqual("ValidationError")
  })

  it("returns a validation error when no PTV channel ID is given", async () => {
    const { status, body } = await request
      .post("/v1/aurora_ai_services/session_transfer_supports")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({})

    expect(status).toBe(400)
    expect(body.error).toEqual("ValidationError")
  })

  it("returns true for a supported channel", async () => {
    const { status, body } = await request
      .post("/v1/aurora_ai_services/session_transfer_supports")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptv_service_channel_ids: [VALID_PTV_ID],
      })

    expect(status).toBe(200)
    expect(body).toEqual({
      [VALID_PTV_ID]: true,
    })
  })

  it("returns false for an unsupported channel", async () => {
    const { status, body } = await request
      .post("/v1/aurora_ai_services/session_transfer_supports")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptv_service_channel_ids: [INVALID_PTV_ID],
      })

    expect(status).toBe(200)
    expect(body).toEqual({
      [INVALID_PTV_ID]: false,
    })
  })

  it("returns correct support booleans for unsupported and supported channels", async () => {
    const { status, body } = await request
      .post("/v1/aurora_ai_services/session_transfer_supports")
      .set(AUTHORIZATION_HEADERS)
      .type("json")
      .send({
        ptv_service_channel_ids: [VALID_PTV_ID, INVALID_PTV_ID],
      })

    expect(status).toBe(200)
    expect(body).toEqual({
      [VALID_PTV_ID]: true,
      [INVALID_PTV_ID]: false,
    })
  })
})
