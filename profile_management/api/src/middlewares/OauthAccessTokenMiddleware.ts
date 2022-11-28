import { Request, RequestHandler } from "express"
import { oauthController } from "../controllers/oauth/oauth"
import type { ParamsDictionary } from "express-serve-static-core"
import { ParsedQs } from "qs"
import { OauthRequest } from "../util/requestHandler"
import { auditLogger } from "../util/logger"
import {
  InsufficientScopeOauthBearerError,
  InvalidRequestOauthBearerError,
  InvalidTokenOauthBearerError,
} from "../util/errors/OauthBearerErrors"

export const OauthAccessTokenMiddleware =
  (scope?: string): RequestHandler =>
  async (
    req: Request<
      ParamsDictionary,
      unknown,
      unknown,
      ParsedQs,
      Record<string, unknown>
    > &
      Partial<OauthRequest>,
    _,
    next
  ) => {
    try {
      if (!req.headers["authorization"]) {
        return next(
          new InvalidRequestOauthBearerError(
            "Authorization header was not present."
          )
        )
      }

      const [type, credentials] = req.headers["authorization"].split(" ")

      auditLogger.info("accessToken", credentials)

      if (type !== "Bearer") {
        return next(
          new InvalidRequestOauthBearerError(
            `Unsupported authorization type: ${type}.`
          )
        )
      }

      const accessToken = await oauthController.getAccessToken(credentials)

      if (!accessToken) {
        return next(
          new InvalidTokenOauthBearerError("The access token has expired.")
        )
      }

      auditLogger.info("clientId", accessToken.auroraAIServiceId)
      auditLogger.info("username", accessToken.username)

      if (scope && !accessToken.scopes.includes(scope)) {
        return next(
          new InsufficientScopeOauthBearerError(
            "The access token does not have the required scope to access this route"
          )
        )
      }

      req.username = accessToken.username
      req.scopes = accessToken.scopes
      req.clientId = accessToken.auroraAIServiceId

      next()
    } catch (e) {
      next(e)
    }
  }
