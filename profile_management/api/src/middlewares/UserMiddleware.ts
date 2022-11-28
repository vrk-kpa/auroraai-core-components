import { Request, RequestHandler, Response } from "express"
import * as jwt from "jsonwebtoken"
import {
  GetUserCommand,
  GetUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider"
import { auditLogger } from "../util/logger"
import { encodeTokenObjectToString } from "../util/session"
import Axios from "axios"
import jwkToPem from "jwk-to-pem"
import { config } from "../config"
import { AuthenticatedRequest } from "../util/requestHandler"
import { UUID } from "io-ts-types/UUID"
import {
  setAuthTokens,
  userControllerAuthenticated,
} from "../controllers/user/user"
import { UnauthorizedError } from "../util/errors/ApiErrors"
import { wrapCognitoError } from "../util/error"
import { cognitoClient, userPoolConfiguration } from "../cognito/config"
import { mockUserAuthentication } from "../cognito/clientMock"
import { CognitoError } from "shared/cognito-types"

interface JWKResponse {
  keys: {
    alg: string
    e: string
    kid: string
    kty: "RSA"
    n: string
    use: string
  }[]
}

const issuer = (async () => {
  const { userPoolId } = await userPoolConfiguration

  return `https://cognito-idp.${
    config.region ?? "eu-west-1"
  }.amazonaws.com/${userPoolId}`
})()

const fetchPems = async () => {
  const {
    data: { keys },
  } = await Axios.get<JWKResponse>(`${await issuer}/.well-known/jwks.json`)

  return Object.fromEntries(
    keys.map(({ kid, n, e, kty }) => [
      kid,
      jwkToPem({
        kty,
        n,
        e,
      }),
    ])
  )
}

const pems: Promise<{ [key: string]: string }> =
  config.profile_management_mock_cognito === "true"
    ? Promise.resolve({})
    : fetchPems()

const verifyCognitoJWT = async (token: string) => {
  const cognitoData = jwt.decode(token, { complete: true })

  if (!cognitoData) {
    throw new UnauthorizedError("The cognito token is invalid.")
  }

  if (cognitoData.payload.iss !== (await issuer)) {
    throw new UnauthorizedError("Invalid issuer")
  }

  if (cognitoData.payload.token_use !== "access") {
    throw new UnauthorizedError("Invalid token use")
  }

  const kid = cognitoData.header.kid

  if (!kid) {
    throw new UnauthorizedError("Missing kid")
  }

  const pem = (await pems)[kid]
  if (!pem) {
    throw new UnauthorizedError("Invalid kid")
  }

  return jwt.verify(token, pem, {
    issuer: await issuer,
  })
}

const getCognitoDataWithTokens = async (
  req: Request,
  accessToken: string,
  refreshToken?: string
) => {
  let cognitoVerifiedData: unknown

  try {
    cognitoVerifiedData = await verifyCognitoJWT(accessToken)
  } catch (error) {
    if (refreshToken && error instanceof jwt.TokenExpiredError) {
      const cognitoData = jwt.decode(accessToken, { complete: true })
      const username: string | undefined = cognitoData?.payload?.username

      if (typeof username === "undefined") {
        throw new UnauthorizedError(
          "Unable to refresh session with refresh token"
        )
      }

      const refreshTokenAuthResponse =
        await userControllerAuthenticated.authWithRefreshToken(
          refreshToken,
          username
        )

      if (refreshTokenAuthResponse) {
        cognitoVerifiedData = await verifyCognitoJWT(
          refreshTokenAuthResponse.accessToken
        )

        await setAuthTokens(
          req,
          refreshTokenAuthResponse.accessToken,
          refreshTokenAuthResponse.refreshToken
        )
      } else {
        throw new UnauthorizedError(
          "Unable to refresh session with refresh token"
        )
      }
    } else {
      throw error
    }
  }

  if (
    typeof cognitoVerifiedData !== "object" ||
    !cognitoVerifiedData ||
    Array.isArray(cognitoVerifiedData)
  ) {
    throw new UnauthorizedError("The Cognito token is invalid.")
  }

  const cognitoPayload = cognitoVerifiedData as {
    username: string
    auth_time: number
  }

  if (
    typeof cognitoPayload.username === "undefined" ||
    typeof cognitoPayload.auth_time === "undefined"
  ) {
    throw new UnauthorizedError(
      "The Cognito token does not have the required claims."
    )
  }

  return { cognitoPayload, accessToken, refreshToken }
}

export const UserMiddleware =
  (): RequestHandler =>
  async (req: Request & Partial<AuthenticatedRequest>, __res: Response, next) => {
    if (config.profile_management_mock_cognito === "true") {
      mockUserAuthentication(req)
      return next()
    }

    let accessToken = req.session.access
      ? encodeTokenObjectToString(req.session.access)
      : undefined

    if (!accessToken) {
      return next(
        new UnauthorizedError("AAI access token cookie was not present.")
      )
    }

    auditLogger.info("accessToken", accessToken)

    let refreshToken = req.session.refresh
      ? encodeTokenObjectToString(req.session.refresh)
      : undefined

    auditLogger.info("refreshToken", refreshToken)

    let cognitoPayload: {
      username: string
      auth_time: number
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;({ cognitoPayload, accessToken, refreshToken } =
        await getCognitoDataWithTokens(req, accessToken, refreshToken))
    } catch (e) {
      return next(e)
    }

    auditLogger.info("username", cognitoPayload.username)

    let cachedUserPromise: Promise<GetUserCommandOutput>

    req.cognitoUser = {
      username: cognitoPayload.username as UUID,
      accessToken,
      refreshToken,
      authTime: cognitoPayload.auth_time,
      getUser() {
        if (cachedUserPromise) return cachedUserPromise

        try {
          cachedUserPromise = cognitoClient.send(
            new GetUserCommand({ AccessToken: accessToken })
          )
        } catch (e) {
          throw wrapCognitoError(e as CognitoError, "GetUser")
        }

        return cachedUserPromise
      },
    }

    next()
  }
