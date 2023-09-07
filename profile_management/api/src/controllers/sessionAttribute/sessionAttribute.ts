import { UUID } from "io-ts-types/UUID"
import { db } from "../../db"
import { generateToken, tokenForTransfer } from "../../util/accessToken"
import { auroraAIServiceController } from "../auroraAIService/auroraAIService"
import {
  deleteExpiredSessionAttributes,
  insertAccessToken,
  insertSessionAttributes,
  selectSessionAttributes,
} from "./sessionAttributeDb"
import { auditLogger, technicalLogger } from "../../util/logger"
import { Attributes } from "shared/schemas"

import { ValidationError } from "../../util/errors/ApiErrors"

export const sessionAttributesController = {
  getSessionAttributes: getSessionAttributes,
  addSessionAttributes: addSessionAttributes,
  removeExpiredSessionAttributes: removeExpiredSessionAttributes,
}

async function getSessionAttributes(accessToken: Buffer): Promise<Attributes> {
  return db.task((t) => selectSessionAttributes(t, accessToken))
}

async function addSessionAttributes(
  ptvServiceChannelId: UUID,
  sessionAttributes: Attributes
): Promise<{ ptvServiceChannelId: UUID; accessToken?: string }> {
  technicalLogger.info("ptvServiceChannelId", ptvServiceChannelId)

  const [auroraAIServiceId, accessToken] = await Promise.all([
    getServiceIdForSessionTransfer(ptvServiceChannelId),
    generateToken(),
  ])

  technicalLogger.info("auroraAIServiceId", auroraAIServiceId)
  auditLogger.info("accessToken", tokenForTransfer(accessToken))

  const supportedAttributes =
    await auroraAIServiceController.getReceivableSessionAttributes(
      auroraAIServiceId
    )

  if (supportedAttributes.length === 0) {
    return {
      ptvServiceChannelId,
    }
  }

  const filteredSessionAttributes = Object.fromEntries(
    Object.entries(sessionAttributes).filter(([attribute]) =>
      supportedAttributes.includes(attribute)
    )
  ) as Attributes

  if (Object.keys(filteredSessionAttributes).length === 0) {
    return {
      ptvServiceChannelId,
    }
  }

  await db.tx(async (tx) => {
    const sessionAttributesId = await insertSessionAttributes(
      tx,
      filteredSessionAttributes
    )

    await insertAccessToken(
      tx,
      accessToken,
      sessionAttributesId,
      auroraAIServiceId
    )
  })

  return {
    ptvServiceChannelId,
    accessToken: tokenForTransfer(accessToken),
  }
}

const getServiceIdForSessionTransfer = async (
  ptvServiceChannelId: UUID
): Promise<UUID> => {
  try {
    return await auroraAIServiceController.getAuroraAIServiceId(
      ptvServiceChannelId
    )
  } catch (error) {
    if (error?.body?.error === "ValidationError") {
      throw new ValidationError(
        `Session transfer not allowed. ${error?.message}`
      )
    }

    throw error
  }
}

async function removeExpiredSessionAttributes(): Promise<void> {
  await db.task((t) => deleteExpiredSessionAttributes(t))
}
