import express from "express"
import { NotFoundError, ValidationError } from "../util/errors/ApiErrors"
import { handleRequest } from "../util/requestHandler"
import { attributeController } from "../controllers/attribute/attribute"
import { userControllerUtils } from "../controllers/user/user"
import { technicalLogger } from "../util/logger"
import { validator } from "../middlewares/ValidatorMiddleware"
import * as t from "io-ts"
import { v4 as uuidv4 } from "uuid"
import { Nullable, Scope, TranslatableString } from "shared/schemas"
import { auroraAIServiceController } from "../controllers/auroraAIService/auroraAIService"
import { UUID } from "io-ts-types/UUID"
import { createClientSecret } from "../util/clientSecret"
import { APIKeyMiddleware } from "../middlewares/APIKeyMiddleware"
import { isIsoDate } from "../util/time"
import { announcementController } from "../controllers/announcement/announcementService"
import * as schemas from "shared/schemas"

export const internalRouter = express.Router()

internalRouter.post(
  "/cron/:action",
  handleRequest(async (req) => {
    const action = req.params.action
    switch (action) {
      case "attribute-deletion-trigger":
        technicalLogger.info("operationName", "retryPendingAttributeDeletions")
        await attributeController.retryPendingAttributeDeletions()
        return
      case "password-expiry-trigger":
        technicalLogger.info("operationName", "expiredPasswordsForceReset")
        await userControllerUtils.expiredPasswordsForceReset()
        await userControllerUtils.clearObsoletePasswordChangeInfo()
        return
      default:
        throw new NotFoundError(`${action} is not a valid action`)
    }
  })
)

internalRouter.post(
  "/add_service",
  APIKeyMiddleware(),
  validator.body(
    t.type({
      name: t.type({ fi: t.string, sv: t.string, en: t.string }),
      provider: t.type({ fi: t.string, sv: t.string, en: t.string }),
      description: t.type({ fi: t.string, sv: t.string, en: t.string }),
      ptvServiceChannelId: Nullable(UUID),
      sessionTransferReceivableAttributes: Nullable(t.array(t.string)),
      link: Nullable(t.type({ fi: t.string, sv: t.string, en: t.string })),
      allowedScopes: Nullable(t.array(Scope)),
      allowedRedirectUris: Nullable(t.array(t.string)),
      defaultRedirectUri: Nullable(t.string),
      dataProviderUrl: Nullable(t.string),
    })
  ),
  handleRequest(async (req) => {
    const {
      provider,
      name,
      description,
      ptvServiceChannelId,
      sessionTransferReceivableAttributes,
      link,
      allowedScopes,
      allowedRedirectUris,
      defaultRedirectUri,
      dataProviderUrl,
    } = req.body
    const generatedServiceId = uuidv4() as UUID
    const secret = createClientSecret()
    await auroraAIServiceController.addService(
      generatedServiceId,
      ptvServiceChannelId as UUID,
      sessionTransferReceivableAttributes as string[],
      name,
      link as TranslatableString,
      allowedScopes as Scope[],
      allowedRedirectUris as string[],
      defaultRedirectUri as string,
      dataProviderUrl as string,
      provider as TranslatableString,
      description,
      secret
    )

    return {
      clientId: generatedServiceId,
      clientSecret: secret,
      provider,
      name,
      description,
      ptvServiceChannelId,
    }
  })
)

internalRouter.post(
  "/create_service_secret",
  APIKeyMiddleware(),
  validator.body(t.type({ serviceId: UUID })),
  handleRequest(async (req) => {
    const { serviceId } = req.body
    const secret = createClientSecret()
    await auroraAIServiceController.setServiceSecret(serviceId, secret)
    return { clientId: serviceId, clientSecret: secret }
  })
)

internalRouter.post(
  "/announcement",
  APIKeyMiddleware(),
  validator.body(schemas.AnnouncementRequest),
  handleRequest(async (req) => {
    const {
      announcementTitle,
      announcementDescription,
      announcementStart,
      announcementEnd,
    } = req.body

    if (!isIsoDate(announcementStart) || !isIsoDate(announcementEnd)) {
      throw new ValidationError(
        "announcement_start and announcement_end should be ISO dates."
      )
    }

    const start = new Date(announcementStart)
    const end = new Date(announcementEnd)

    const concurrentAnnouncements = (
      await announcementController.getAnnouncementsBetweenDates(start, end)
    ).length

    if (concurrentAnnouncements > 0) {
      throw new ValidationError(
        "Announcement already present between specified timestamps"
      )
    }

    if (start > end) {
      throw new ValidationError("Start time must not be later than end time.")
    }

    await announcementController.addAnnouncement(
      announcementTitle,
      announcementDescription,
      start,
      end
    )

    return { success: true }
  })
)

internalRouter.get(
  "/announcement",
  APIKeyMiddleware(),
  handleRequest(async (req) => {
    const activeOnly = Object.keys(req.query).includes("active")
    if (activeOnly) {
      return await announcementController.getActiveAnnouncements()
    }
    return await announcementController.getAnnouncements()
  })
)

internalRouter.delete(
  "/announcement/:id",
  APIKeyMiddleware(),
  handleRequest(async (req) => {
    const id = req.params.id as UUID
    if (!(await announcementController.getAnnouncement(id))) {
      throw new ValidationError("Invalid id")
    }
    await announcementController.removeAnnouncement(id)
    return { success: true }
  })
)

internalRouter.patch(
  "/announcement/:id",
  APIKeyMiddleware(),
  validator.body(schemas.AnnouncementRequest),
  handleRequest(async (req) => {
    const id = req.params.id as UUID
    const {
      announcementTitle,
      announcementDescription,
      announcementStart,
      announcementEnd,
    } = req.body
    if (!(await announcementController.getAnnouncement(id))) {
      throw new ValidationError("Invalid id")
    }

    const start = new Date(announcementStart)
    const end = new Date(announcementEnd)

    await announcementController.modifyAnnouncement(
      id,
      announcementTitle,
      announcementDescription,
      start,
      end
    )
    return { success: true }
  })
)
