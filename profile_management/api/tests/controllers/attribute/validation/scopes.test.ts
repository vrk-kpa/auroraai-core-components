import { db } from "../../../../src/db"
import { setupTestDbConnection } from "../../../helpers"
import { fetchValidAttributeScopes } from "../../../../src/controllers/attributesManagement/attributesManagement"

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)


describe("attributeController.fetchValidAttributeScopes", () => {
  it("returns scopes", async () => {    
    const scopes = await fetchValidAttributeScopes()
    const testAttributes = ['age', 'municipality_code', 'life_situation_meters']

    expect(scopes).toEqual(expect.arrayContaining(testAttributes));
  })
})