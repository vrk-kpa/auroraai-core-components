import { config } from "../../src/config"
import supertest from "supertest"
import { app } from "../../src/app"
import {
  Y_ALUSTA_MOCK_ERROR_URL,
  Y_ALUSTA_MOCK_INVALID_RESPONSE_URL,
  Y_ALUSTA_MOCK_VALID_RESPONSE_URL,
} from "../../__mocks__/axios"
import { clearCache } from "../../src/middlewares/attributesDatamodelMiddleware"

const request = supertest(app)

beforeEach(() => {
  config.datamodel_api_url = Y_ALUSTA_MOCK_VALID_RESPONSE_URL
  clearCache()
})

describe("attributes-management datamodel endpoint", () => {
  it("returns a json-ld datamodel", async () => {
    const { status, body } = await request
      .get("/attributes-management/v1/datamodel")
      .type("json")

    expect(status).toBe(200)
    expect(Array.isArray(body["@graph"])).toBe(true)
  })

  it("returns cached datamodel when y-alusta returns an error", async () => {
    // Valid response from Y-alusta creates cache
    await request.get("/attributes-management/v1/datamodel").type("json")

    // Error response from Y-alusta; cached value is returned
    config.datamodel_api_url = Y_ALUSTA_MOCK_ERROR_URL
    const { status } = await request
      .get("/attributes-management/v1/datamodel")
      .type("json")

    expect(status).toBe(200)
  })

  it("returns an error when no cache and y-alusta returns invalid datamodel", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_INVALID_RESPONSE_URL

    const { status } = await request
      .get("/attributes-management/v1/datamodel")
      .type("json")

    expect(status).toBe(500)
  })

  it("returns an error when no cache and y-alusta returns an error", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_ERROR_URL

    const { status } = await request
      .get("/attributes-management/v1/datamodel")
      .type("json")

    expect(status).toBe(500)
  })
})
