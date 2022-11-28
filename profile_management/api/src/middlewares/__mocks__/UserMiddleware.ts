import type { AuthenticatedRequest } from "../../util/requestHandler"
import type * as userMiddlewareType from "../UserMiddleware"
import type { Request } from "express"
import { UUID } from "io-ts-types/lib/UUID"

type Writeable<T> = { -readonly [P in keyof T]: T[P] }

const middleware =
  jest.createMockFromModule<Writeable<typeof userMiddlewareType>>(
    "../UserMiddleware"
  )

middleware.UserMiddleware =
  () => (req: Request & Partial<AuthenticatedRequest>, _, next) => {
    req.cognitoUser = {
      username: req.headers.username as UUID,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      authTime: Math.floor(Date.now() / 1000),
      getUser: () =>
        Promise.resolve({
          Username: req.headers.authorization,
          UserAttributes: [
            {
              Name: "email",
              Value: "test@example.com",
            },
          ],
          $metadata: {},
        }),
    }

    next()
  }

module.exports = middleware
