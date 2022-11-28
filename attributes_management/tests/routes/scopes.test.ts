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

describe("attributes-management scopes endpoint", () => {
  it("returns list of oauth scopes for attributes", async () => {
    const { status, body } = await request
      .get("/attributes-management/v1/scopes/")
      .type("json")

    expect(status).toBe(200)
    expect(body).toEqual(["shoesize", "store:shoesize", "openid"])
  })

  it("returns cached scopes when y-alusta returns an error", async () => {
    // Valid response from Y-alusta creates cache
    await request.get("/attributes-management/v1/scopes").type("json")

    // Error response from Y-alusta; cached value is returned
    config.datamodel_api_url = Y_ALUSTA_MOCK_ERROR_URL
    const { status } = await request
      .get("/attributes-management/v1/scopes")
      .type("json")

    expect(status).toBe(200)
  })

  it("returns an error when no cache and y-alusta returns invalid schema", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_INVALID_RESPONSE_URL

    const { status } = await request
      .get("/attributes-management/v1/scopes")
      .type("json")

    expect(status).toBe(500)
  })

  it("returns an error when no cache and y-alusta returns an error", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_ERROR_URL

    const { status } = await request
      .get("/attributes-management/v1/scopes")
      .type("json")

    expect(status).toBe(500)
  })
})
