import type axiosType from "axios"
import { AxiosResponse } from "axios"
import { config } from "../src/config"
import {
  MULTI_ATTRIBUTE_SERVICE_ORIGIN,
  AGE_SERVICE_ORIGIN,
  INVALID_AGE_SERVICE_ORIGIN,
  FAILING_SERVICE_ORIGIN,
  MUNICIPALITY_SERVICE_ORIGIN,
} from "../tests/constants"


const axios = jest.createMockFromModule<typeof axiosType>("axios")

const responses = {
  [`${AGE_SERVICE_ORIGIN}/auroraai/profile-management/v1/user_attributes`]: {
    data: {
      age: 18,
    },
  },
  [`${INVALID_AGE_SERVICE_ORIGIN}/auroraai/profile-management/v1/user_attributes`]:
    {
      data: {
        age: "201",
      },
    },
  [`${MUNICIPALITY_SERVICE_ORIGIN}/auroraai/profile-management/v1/user_attributes`]:
    {
      data: {
        municipality_code: "005",
      },
    },
  [`${MULTI_ATTRIBUTE_SERVICE_ORIGIN}/auroraai/profile-management/v1/user_attributes`]:
    {
      data: {
        age: 18,
        municipality_code: "005",
        tampere_demo_flag: true,
      },
    },
  [`${FAILING_SERVICE_ORIGIN}/auroraai/profile-management/v1/user_attributes`]:
    { data: "ERROR", status: 502 },
  [`https://cognito-idp.eu-west-1.amazonaws.com/${config.profile_management_cognito_user_pool_id}/.well-known/jwks.json`]:
    {
      data: {
        keys: [],
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
axios.delete = <T = any, R = AxiosResponse<T>>(url: string): Promise<R> => {
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
