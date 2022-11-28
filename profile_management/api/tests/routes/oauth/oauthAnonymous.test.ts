import supertest from "supertest"
import { app } from "../../../src/app"
import { db } from "../../../src/db"
import { setupTestDbConnection } from "../../helpers"
import { JWKsList, OpenIDConfiguration } from "../../schemas"
import reporter from "io-ts-reporters"

const request = supertest(app)

afterAll(() => db.$pool.end())

beforeAll(setupTestDbConnection)

const JWKS_PATH = "/oauth/.well-known/jwks.json"

describe("anonymous OAuth", () => {
  it("returns a valid OpenID configuration", async () => {
    const { status, body } = await request.get(
      "/oauth/.well-known/openid-configuration"
    )

    expect(status).toBe(200)

    const errors = reporter.report(OpenIDConfiguration.decode(body))
    expect(errors).toEqual([])

    expect(new URL(body.jwks_uri).pathname).toBe(JWKS_PATH)
  })

  it("returns a valid list of JWKs", async () => {
    const { status, body } = await request.get(JWKS_PATH)

    expect(status).toBe(200)

    const errors = reporter.report(JWKsList.decode(body))
    expect(errors).toEqual([])
  })
})
