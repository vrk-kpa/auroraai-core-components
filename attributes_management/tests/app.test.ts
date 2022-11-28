import supertest from "supertest"
import { app } from "../src/app"

const request = supertest(app)

describe("attributes-management app", () => {
  it("returns 404 for undefined urls", async () => {
    for (const url of [
      "/foo",
      "/attributes-management/v99/schema",
      "/attributes-management/v1/foo",
    ]) {
      const { status } = await request.get(url).type("json")
      expect(status).toEqual(404)
    }
  })
})
