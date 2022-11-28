import { db } from "../../../../src/db"
import { setupTestDbConnection } from "../../../helpers"
import {  attributeIsValid } from "../../../../src/controllers/attributesManagement/attributesManagement"

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)

describe("attributeController.validateAttribute", () => {
  describe("tampere_demo_flag", () => {
    it("returns true when boolean is used as attribute", async () => {
      expect(await attributeIsValid("tampere_demo_flag", true)).toBe(true)
      expect(await attributeIsValid("tampere_demo_flag", false)).toBe(true)
    })

    it("returns true when invalid boolean is used as attribute", async () => {
      expect(await attributeIsValid("tampere_demo_flag", "true")).toBe(false)
      expect(await attributeIsValid("tampere_demo_flag", 1)).toBe(false)
    })
  })
})