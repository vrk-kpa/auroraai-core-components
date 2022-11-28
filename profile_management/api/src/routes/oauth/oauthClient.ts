import express from "express"
import { oauthController } from "../../controllers/oauth/oauth"
import { OauthClientMiddleware } from "../../middlewares/OauthClientMiddleware"
import { validator } from "../../middlewares/ValidatorMiddleware"
import {
  OauthTokenRevoke,
  OauthTokenWithAuthorizationCode,
  OauthTokenWithRefreshToken,
} from "../../schemas"
import { InvalidRequestOauthError } from "../../util/errors/OauthErrors"
import { handleOauthClientRequest } from "../../util/requestHandler"
import * as t from "io-ts"
import { auroraAIServiceController } from "../../controllers/auroraAIService/auroraAIService"

export const oauthClientRouter = express.Router()

oauthClientRouter.use(OauthClientMiddleware())

oauthClientRouter.post(
  "/token",
  validator.body(
    t.union([OauthTokenWithAuthorizationCode, OauthTokenWithRefreshToken]),
    () => {
      throw new InvalidRequestOauthError("Invalid token request")
    }
  ),
  handleOauthClientRequest((req) => {
    if (req.body.grant_type === "authorization_code") {
      return oauthController.authenticateWithAuthorizationCode(
        req.clientId,
        req.body
      )
    } else if (req.body.grant_type === "refresh_token") {
      return oauthController.authenticateWithRefreshToken(
        req.clientId,
        req.body
      )
    }

    throw new InvalidRequestOauthError("Invalid grant type")
  })
)

oauthClientRouter.post(
  "/revoke",
  validator.body(OauthTokenRevoke, () => {
    throw new InvalidRequestOauthError("Invalid token request")
  }),
  handleOauthClientRequest((req) =>
    oauthController.revokeTokenPair(req.body, req.clientId)
  )
)

oauthClientRouter.get(
  "/client_info",
  handleOauthClientRequest((req) =>
    auroraAIServiceController.getServiceInformation(req.clientId)
  )
)
