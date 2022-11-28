import { db } from "../../../../src/db"
import { setupTestDbConnection } from "../../../helpers"
import { fetchAttributeLocalisations, fetchAttributeLocalisation } from "../../../../src/controllers/attributesManagement/attributesManagement"

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)

describe("attributeController.fetchAttributeLocalisations", () => {
  it("returns localisations for all attributes", async () => {
    const testAttributes = ['age', 'municipality_code', 'life_situation_meters', 'tampere_demo_flag']
    
    const attributeLocalisations = await fetchAttributeLocalisations()
    const attributeKeys = Object.keys(attributeLocalisations)

    expect(attributeKeys).toEqual(expect.arrayContaining(testAttributes));
  })
})

describe("attributeController.fetchAttributeLocalisation", () => {
  it("returns localisations for age attribute", async () => {
    const attributeLocalisations = await fetchAttributeLocalisation('age')

    expect(Object.keys(attributeLocalisations)).toEqual([ "name", "description",]);
    expect(Object.keys(attributeLocalisations.name)).toEqual(["sv", "fi", "en"]);
    expect(Object.keys(attributeLocalisations.description)).toEqual(["fi"]);
  })
})

describe("attributeController.fetchAttributeLocalisation", () => {
  it("returns localisations for life situation meters attribute", async () => {
    const attributeLocalisations = await fetchAttributeLocalisation('life_situation_meters')

    const attributeProperties = attributeLocalisations.properties || {}

    expect(Object.keys(attributeLocalisations)).toEqual([ "name", "description", "properties"]);
    expect(Object.keys(attributeLocalisations.name)).toEqual(["fi", "sv", "en"]);
    expect(Object.keys(attributeLocalisations.description)).toEqual(["fi"]);
    expect(Object.keys(attributeProperties).length).toEqual(10);
  })
})