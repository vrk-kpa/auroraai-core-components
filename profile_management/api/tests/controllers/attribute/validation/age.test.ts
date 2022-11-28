import { db } from "../../../../src/db"
import { setupTestDbConnection } from "../../../helpers"
import {  attributeIsValid } from "../../../../src/controllers/attributesManagement/attributesManagement"

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)

describe("attributeController.validateAttribute", () => {
  describe("age", () => {
    it("returns true when integer used as attribute", async () => {
      expect(await attributeIsValid("age", 51)).toBe(true)
    })

    it("returns false when string used as attribute", async () => {
      expect(await attributeIsValid("age", "51")).toBe(false)
    })

    // See https://www.npmjs.com/package/jsonschema#user-content-handling-undefined
    it("returns true when undefined used as attribute", async () => {
      expect(await attributeIsValid("age", undefined)).toBe(true)
    })
  })
})