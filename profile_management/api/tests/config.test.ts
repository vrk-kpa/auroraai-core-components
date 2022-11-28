import { readConfig } from "../src/config"

describe("config", () => {
  it("production should never have profile_management_mock_cognito === true", () => {
    expect(readConfig("prod").profile_management_mock_cognito).not.toBe("true")
  })

  it("production should always have profile_management_secure_cookies === true", () => {
    expect(readConfig("prod").profile_management_secure_cookies).toBe("true")
  })
})
