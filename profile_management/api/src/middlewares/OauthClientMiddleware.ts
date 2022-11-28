import { Request, RequestHandler } from "express"
import type { ParamsDictionary } from "express-serve-static-core"
import { isLeft } from "fp-ts/lib/Either"
import { UUID } from "io-ts-types/lib/UUID"
import { ParsedQs } from "qs"
import { auroraAIServiceController } from "../controllers/auroraAIService/auroraAIService"
import { decodeBasicAuthCredentials } from "../util/auth"
import { InvalidClientOauthError } from "../util/errors/OauthErrors"
import { auditLogger } from "../util/logger"
import { OauthClientRequest } from "../util/requestHandler"

export const OauthClientMiddleware =
  (): RequestHandler =>
  async (
    req: Request<
      ParamsDictionary,
      unknown,
      unknown,
      ParsedQs,
      Record<string, unknown>
    > &
      Partial<OauthClientRequest>,
    _,
    next
  ) => {
    try {
      const [authType, authCredentials] = (
        req.headers.authorization ?? ""
      ).split(" ")

      if (authType !== "Basic") {
        return next(new InvalidClientOauthError("Unsupported auth type"))
      }

      const auth = decodeBasicAuthCredentials(authCredentials)

      if (!auth) {
        return next(new InvalidClientOauthError("Unsupported credentials"))
      }

      const [clientId, clientSecret] = auth

      auditLogger.info("clientId", clientId)

      if (isLeft(UUID.decode(clientId))) {
        return next(
          new InvalidClientOauthError("Client ID in credentials is not an UUID")
        )
      }

      const client = await auroraAIServiceController.getOauthClientWithSecret(
        clientId as UUID,
        clientSecret
      )

      if (!client) {
        return next(new InvalidClientOauthError("Client not found"))
      }

      req.clientId = client.id

      next()
    } catch (e) {
      next(e)
    }
  }
