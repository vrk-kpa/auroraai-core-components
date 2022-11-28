import { db } from "../../../../src/db"
import { setupTestDbConnection } from "../../../helpers"
import {  attributeIsValid } from "../../../../src/controllers/attributesManagement/attributesManagement"

afterAll(() => db.$pool.end())
beforeAll(setupTestDbConnection)

describe("attributeController.validateAttribute", () => {
  describe("life_situation_meters valid", () => {
    it("returns true when valid life situation meter object is used as attribute", async () => {
      expect(await attributeIsValid("life_situation_meters", {working_studying: [4]})).toBe(true)
      expect(await attributeIsValid("life_situation_meters", {resilience: [1]})).toBe(true)
      expect(await attributeIsValid("life_situation_meters", {health: [3], family: [7]})).toBe(true)
    })

     it("returns true when empty object used as attribute", async () => {
      expect(await attributeIsValid("life_situation_meters", {})).toBe(true)
    })   

    it("returns true when invalid life situation meter key is used as attribute", async () => {
      expect(await attributeIsValid("life_situation_meters", {lorem: [4]})).toBe(true)
    })

    it("returns false when string is used as life situation meter value in attribute object", async () => {
      expect(await attributeIsValid("life_situation_meters", {health: ["4"]})).toBe(false)
    })

    it("returns false invalid attribute is used", async () => {
      expect(await attributeIsValid("life_situation_meters", "4")).toBe(false)
      expect(await attributeIsValid("life_situation_meters", 4)).toBe(false)
      expect(await attributeIsValid("life_situation_meters", [4])).toBe(false)
    })
  })
})