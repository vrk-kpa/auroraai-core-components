import express from "express"
import { AccessToken } from "../types"
import { sessionAttributesController } from "../controllers/sessionAttribute/sessionAttribute"
import { handleRequest } from "../util/requestHandler"
import { tokenFromTransfer } from "../util/accessToken"
import { auditLogger } from "../util/logger"
import { validator } from "../middlewares/ValidatorMiddleware"
import * as t from "io-ts"
import { UUID } from "io-ts-types/UUID"
import { APIKeyMiddleware } from "../middlewares/APIKeyMiddleware"
import { Attributes } from "shared/schemas"

export const sessionAttributesRouterV1 = express.Router()

sessionAttributesRouterV1.use(APIKeyMiddleware())

sessionAttributesRouterV1.get(
  "/",
  validator.query(
    t.type({
      access_token: AccessToken,
    })
  ),
  handleRequest((req) => {
    const accessToken = req.query.access_token
    auditLogger.info("accessToken", accessToken)

    return sessionAttributesController.getSessionAttributes(
      tokenFromTransfer(accessToken)
    )
  })
)

sessionAttributesRouterV1.post(
  "/",
  validator.body(
    t.type({
      ptvServiceChannelId: UUID,
      sessionAttributes: Attributes,
    })
  ),
  handleRequest((req) =>
    sessionAttributesController.addSessionAttributes(
      req.body.ptvServiceChannelId,
      req.body.sessionAttributes
    )
  )
)
