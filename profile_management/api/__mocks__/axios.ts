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
import {
  mockAttributeSchema,
  mockScopes,
  mockAgeSchema,
  mockLifeSituationMetersSchema,
  mockMunicipalityCodeSchema,
  mockTampereDemoFlagSchema,
  mockLocalisation
} from "../tests/mockData/attributeManagement"

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
        tampere_demo_flag: true
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
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/schema`]:
    {
      data: mockAttributeSchema,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/schema/age`]:
    {
      data: mockAgeSchema,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/schema/life_situation_meters`]:
    {
      data: mockLifeSituationMetersSchema,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/schema/municipality_code`]:
    {
      data: mockMunicipalityCodeSchema,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/schema/tampere_demo_flag`]:
    {
      data: mockTampereDemoFlagSchema,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/scopes`]:
    {
      data: mockScopes,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/localisation`]:
    {
      data: mockLocalisation,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/localisation/age`]:
    {
      data: mockLocalisation.age,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/localisation/life_situation_meters`]:
    {
      data: mockLocalisation.life_situation_meters,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/localisation/municipality_code`]:
    {
      data: mockLocalisation.municipality_code,
    },
    [`${config.attributes_management_url}:${config.attributes_management_port}/attributes-management/v1/localisation/tampere_demo_flag`]:
    {
      data: mockLocalisation.tampere_demo_flag,
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
