import supertest from "supertest"
import { app } from "../../../src/app"
import { db } from "../../../src/db"
import { USERINFO_SUB_REGEX, VALID_OAUTH_ACCESS_TOKEN } from "../../constants"
import {
  buildOauthAccessTokenHeader,
  setupTestDbConnection,
} from "../../helpers"

const request = supertest(app)

afterAll(() => db.$pool.end())

beforeAll(setupTestDbConnection)

describe("access token-authenticated OAuth: userinfo", () => {
  it("returns a valid sub when called with access token", async () => {
    const { status, body } = await request
      .get("/oauth/userinfo")
      .set(buildOauthAccessTokenHeader(VALID_OAUTH_ACCESS_TOKEN))
      .type("json")

    expect(status).toEqual(200)
    expect(body.sub).toMatch(USERINFO_SUB_REGEX)
  })
})
