import { config } from "../../src/config"
import supertest from "supertest"
import { app } from "../../src/app"
import {
  Y_ALUSTA_MOCK_ERROR_URL,
  Y_ALUSTA_MOCK_INVALID_RESPONSE_URL,
  Y_ALUSTA_MOCK_VALID_RESPONSE_URL,
} from "../../__mocks__/axios"
import { clearCache } from "../../src/middlewares/attributesSchemaMiddleware"

const request = supertest(app)

beforeEach(() => {
  config.datamodel_api_url = Y_ALUSTA_MOCK_VALID_RESPONSE_URL
  clearCache()
})

describe("attributes-management schema endpoint", () => {
  it("returns a full schema", async () => {
    const { status, body } = await request
      .get("/attributes-management/v1/schema/")
      .type("json")

    expect(status).toBe(200)
    expect(
      body.definitions.AuroraAIAttributes.properties.shoesize.type
    ).toEqual("integer")
  })

  it("returns a schema for single attribute", async () => {
    const { status, body } = await request
      .get("/attributes-management/v1/schema/shoesize")
      .type("json")

    expect(status).toBe(200)
    expect(body.type).toEqual("integer")
  })

  it("returns 404 for missing attribute", async () => {
    const { status } = await request
      .get("/attributes-management/v1/schema/foobar")
      .type("json")

    expect(status).toBe(404)
  })

  it("returns cached schema when y-alusta returns an error", async () => {
    // Valid response from Y-alusta creates cache
    await request.get("/attributes-management/v1/schema/shoesize").type("json")

    // Error response from Y-alusta; cached value is returned
    config.datamodel_api_url = Y_ALUSTA_MOCK_ERROR_URL
    const { status, body } = await request
      .get("/attributes-management/v1/schema/shoesize")
      .type("json")

    expect(status).toBe(200)
    expect(body.type).toEqual("integer")
  })

  it("returns cached schema when y-alusta returns invalid schema", async () => {
    // Valid response from Y-alusta creates cache
    await request.get("/attributes-management/v1/schema").type("json")

    // Invalid response from Y-alusta; cached value is returned
    config.datamodel_api_url = Y_ALUSTA_MOCK_INVALID_RESPONSE_URL
    const { status, body } = await request
      .get("/attributes-management/v1/schema")
      .type("json")

    expect(status).toBe(200)
    expect(
      body.definitions.AuroraAIAttributes.properties.shoesize.type
    ).toEqual("integer")
  })

  it("returns an error when no cache and y-alusta returns invalid schema", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_INVALID_RESPONSE_URL

    const { status } = await request
      .get("/attributes-management/v1/schema")
      .type("json")

    expect(status).toBe(500)
  })

  it("returns an error when no cache and y-alusta returns an error", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_ERROR_URL

    const { status } = await request
      .get("/attributes-management/v1/schema")
      .type("json")

    expect(status).toBe(500)
  })
})
