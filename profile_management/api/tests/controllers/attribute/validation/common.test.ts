import {AxiosResponse} from "axios"
import { db } from "../../../../src/db"
import { setupTestDbConnection } from "../../../helpers"
import { getResponseAsSchema, getValidAttributeNames, validateAttributes } from "../../../../src/controllers/attributesManagement/attributesManagement"

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)

const mockResponse = {
  data: {},
  status: 200,
  statusText: 'OK',
  config: {},
  headers: {},
};

describe("attributeController.getValidAttributeNames", () => {
  it("returns attribute union", async () => {    
    const attributeNames = await getValidAttributeNames()
    const attributeNamekeys = Object.keys(attributeNames.keys)
    const testAttributes = ['age', 'municipality_code', 'life_situation_meters', 'tampere_demo_flag']

    expect(attributeNamekeys).toEqual(expect.arrayContaining(testAttributes));
  })
})

describe("attributeController.getResponseAsSchema", () => {
  it("returns response data as Schema object", () => {
    const data = {
      "@id": "http://uri.suomi.fi/datamodel/ns/aurora-att#age",
      "title": "Ikä",
      "description": "Käyttäjän ikä vuosina",
      "@type": "http://www.w3.org/2001/XMLSchema#integer",
      "type": "integer"
    }
    
    const response = {
      ...mockResponse,
      data
    };
    const result = getResponseAsSchema(response as AxiosResponse)

    expect(result).toEqual(data)
  })
})

describe("attributeController.validateAttributes", () => {
  it("returns true when integer used as age attribute", async () => {
    const result = await validateAttributes({age: 51})

    expect(result.errors.length).toBe(0)
    expect(result.valid).toBe(true)
  })

  it("returns false when empty object given as an attribute", async () => {
    const result = await validateAttributes({})

    expect(result.valid).toBe(false)
  })

  it("returns true when empty object is used as life situation meter", async () => {
    const result = await validateAttributes({life_situation_meters: {}})

    expect(result.valid).toBe(true)
  })

  it("returns true when invalid life situation meter key given as an attribute", async () => {
    const result = await validateAttributes({life_situation_meters: {"lorem": [4]}})

    expect(result.valid).toBe(true)
  })

  it("returns false when invalid life situation meter given as an attribute", async () => {
    const result = await validateAttributes({life_situation_meters: {"health": ["4"]}})

    expect(result.valid).toBe(false)
  })
  
  it("returns true when valid life situation meter object is used as attribute", async () => {
    const result = await validateAttributes({life_situation_meters: {working_studying: [4]}})

    expect(result.valid).toBe(true)
  })
})