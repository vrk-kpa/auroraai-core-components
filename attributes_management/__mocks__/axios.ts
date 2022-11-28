import type axiosType from "axios"
import { AxiosResponse } from "axios"
import { config } from "../src/config"
import * as test_datamodel from "../tests/resources/test_datamodel.json"

export const Y_ALUSTA_MOCK_VALID_RESPONSE_URL = `http://y-alusta-mock-valid-response`
export const Y_ALUSTA_MOCK_INVALID_RESPONSE_URL = `http://y-alusta-mock-invalid-response`
export const Y_ALUSTA_MOCK_ERROR_URL = `http://y-alusta-mock-error`

const axios = jest.createMockFromModule<typeof axiosType>("axios")

const responses = {
  [`${Y_ALUSTA_MOCK_VALID_RESPONSE_URL}?${config.json_schema_query}`]: {
    data: {
      definitions: {
        AuroraAIAttributes: {
          title: "AuroraAI-attribuutit",
          type: "object",
          properties: {
            shoesize: {
              title: "Kengänumero",
              description: "Käyttäjän kengännumero",
              type: "integer",
            },
          },
        },
      },
    },
  },

  [`${Y_ALUSTA_MOCK_INVALID_RESPONSE_URL}?${config.json_schema_query}`]: {
    data: {
      message: "not a good schema!",
    },
  },

  [`${Y_ALUSTA_MOCK_ERROR_URL}?${config.json_schema_query}`]: {
    status: 503,
    data: {
      error: "error",
    },
  },

  [`${Y_ALUSTA_MOCK_VALID_RESPONSE_URL}?${config.json_ld_query}`]: {
    data: test_datamodel,
  },

  [`${Y_ALUSTA_MOCK_INVALID_RESPONSE_URL}?${config.json_ld_query}`]: {
    data: {
      message: "not a good json-ld document!",
    },
  },

  [`${Y_ALUSTA_MOCK_ERROR_URL}?${config.json_ld_query}`]: {
    status: 503,
    data: {
      error: "error",
    },
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as Record<string, { data: any; status?: number }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
axios.get = <T = any, R = AxiosResponse<T>>(url: string): Promise<R> => {
  const response = responses[url]

  if (response) {
    return Promise.resolve({
      data: response.data,
      status: response.status ?? 200,
      statusText: "",
      headers: {},
      config: {},
    } as unknown as R)
  }

  throw Error(`Unknown request URL: ${url}`)
}

export default axios
