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

describe("attributes-management localisation endpoint", () => {
  it("returns localisations for all attributes", async () => {
    const { status, body } = await request
      .get("/attributes-management/v1/localisation")
      .type("json")

    expect(status).toBe(200)
    expect(body).toEqual({
      complex_test_attribute: {
        description: {
          fi: "Testiattribuutti jolla on property",
        },
        name: {
          fi: "Kompleksi testiattribuutti",
          sv: "Kompleks testattribut",
        },
        properties: {
          nested_test_property: {
            name: {
              fi: "Sisäinen attribuutti",
            },
          },
        },
      },
      shoesize: {
        description: {
          fi: "Käyttäjän kengän koko",
        },
        name: {
          fi: "Kengän koko",
          sv: "Sko storlek",
        },
      },
    })
  })

  it("returns localisations for single attribute", async () => {
    const { status, body } = await request
      .get("/attributes-management/v1/localisation/shoesize")
      .type("json")

    expect(status).toBe(200)
    expect(body).toEqual({
      description: {
        fi: "Käyttäjän kengän koko",
      },
      name: {
        fi: "Kengän koko",
        sv: "Sko storlek",
      },
    })
  })

  it("returns 404 for missing attribute", async () => {
    const { status } = await request
      .get("/attributes-management/v1/localisation/foobar")
      .type("json")

    expect(status).toBe(404)
  })

  it("returns error when no cache and Y-alusta returns invalid model", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_INVALID_RESPONSE_URL
    const { status } = await request
      .get("/attributes-management/v1/localisation/")
      .type("json")

    expect(status).toBe(500)
  })

  it("returns error when no cache and Y-alusta returns error", async () => {
    config.datamodel_api_url = Y_ALUSTA_MOCK_ERROR_URL
    const { status } = await request
      .get("/attributes-management/v1/localisation/shoesize")
      .type("json")

    expect(status).toBe(500)
  })
})
