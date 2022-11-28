import { splitToken, createTokenObject, combineTokenParts } from "../../src/util/session"

describe("session util", () => {
  describe("splitToken", () => {
    it("should split string to parts using dot separator", () => {
      expect(splitToken("abc.def.hij").length).toBe(3)
    })
  })

  describe("createTokenObject", () => {
    it("should create Token object from given array of strings", () => {
      const tokenParts = ['abc', 'def', 'hij']
      const result = createTokenObject(tokenParts)
      expect(result).toStrictEqual({header: "abc", payload: "def", signature: "hij"})
    })
  })
    
  describe("combineTokenParts", () => {
    it("should combine Token object contents to single string", () => {
      const token = {header: "abc", payload: "def", signature: "hij"}
      const result = combineTokenParts(token)
      expect(result).toBe("abc.def.hij")
    })
  })
})
