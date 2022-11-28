import express from "express"
import { auroraAIServiceController } from "../controllers/auroraAIService/auroraAIService"
import { handleRequest } from "../util/requestHandler"
import { validator } from "../middlewares/ValidatorMiddleware"
import * as t from "io-ts"
import { UUID } from "io-ts-types/UUID"
import { APIKeyMiddleware } from "../middlewares/APIKeyMiddleware"

export const auroraAIServiceRouterV1 = express.Router()

auroraAIServiceRouterV1.use(APIKeyMiddleware())

auroraAIServiceRouterV1.post(
  "/session_transfer_supports",
  validator.body(
    t.type({
      ptv_service_channel_ids: t.union([t.array(UUID), UUID]),
    })
  ),
  handleRequest((req) => {
    const rawServiceChannelIds = req.body.ptv_service_channel_ids
    const ptvServiceChannelIds =
      typeof rawServiceChannelIds === "string"
        ? [rawServiceChannelIds]
        : rawServiceChannelIds

    if (ptvServiceChannelIds.length === 0) {
      return {}
    }

    return auroraAIServiceController.checkIfSessionTransfersAreSupported(
      ptvServiceChannelIds as UUID[]
    )
  })
)
