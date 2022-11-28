import { db } from "../../../../src/db"
import { setupTestDbConnection } from "../../../helpers"
import {  attributeIsValid } from "../../../../src/controllers/attributesManagement/attributesManagement"

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)

describe("attributeController.validateAttribute", () => {
  describe("municipality_code", () => {
    it("returns true when valid code string is used as attribute", async () => {
      expect(await attributeIsValid("municipality_code", "005")).toBe(true)
      expect(await attributeIsValid("municipality_code", "165")).toBe(true)
      expect(await attributeIsValid("municipality_code", "980")).toBe(true)
    })

    it("returns false when invalid code string is used as attribute", async () => {
      expect(await attributeIsValid("municipality_code", "001")).toBe(false)
      expect(await attributeIsValid("municipality_code", "4444")).toBe(false)
      expect(await attributeIsValid("municipality_code", "999")).toBe(false)
    })

    it("returns false when integer is used as attribute", async () => {
      expect(await attributeIsValid("municipality_code", 153)).toBe(false)
    })
  })
})