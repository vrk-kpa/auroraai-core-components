import express from "express"
import { OauthAccessTokenMiddleware } from "../middlewares/OauthAccessTokenMiddleware"
import { validator } from "../middlewares/ValidatorMiddleware"
import * as t from "io-ts"
import {
  InsufficientScopeOauthBearerError,
  InvalidRequestOauthBearerError,
} from "../util/errors/OauthBearerErrors"
import {
  handleOauthClientRequest,
  handleOauthRequest,
} from "../util/requestHandler"
import { auditLogger } from "../util/logger"
import { attributeController } from "../controllers/attribute/attribute"
import { UUID } from "io-ts-types/lib/UUID"
import { OauthClientMiddleware } from "../middlewares/OauthClientMiddleware"
import { getOriginalUUID } from "../util/uuid"

export const attributesRouter = express.Router()

attributesRouter.patch(
  "/",
  OauthAccessTokenMiddleware(),
  (req, res, next) =>
    validator.body(t.array(t.string), () => {
      throw new InvalidRequestOauthBearerError("Not an array of strings")
    })(req, res, next),
  handleOauthRequest((req) => {
    auditLogger.info("attributes", req.body)

    if (
      req.body.some((attr: unknown) => !req.scopes.includes(`store:${attr}`))
    ) {
      throw new InsufficientScopeOauthBearerError(
        "Client does not have granted scopes for storing all of the attributes"
      )
    }

    attributeController.addAttributeSources(
      req.username,
      req.clientId,
      req.body
    )
  })
)

attributesRouter.delete(
  "/",
  OauthClientMiddleware(),
  (req, res, next) =>
    validator.body(
      t.type({ user_attributes: t.array(t.string), user_id: UUID }),
      () => {
        throw new InvalidRequestOauthBearerError("Invalid request body")
      }
    )(req, res, next),
  handleOauthClientRequest(async (req) => {
    // do not check scopes on DELETE; it should always be allowed for
    // services to delete their attributes for a certain user

    const username = await getOriginalUUID(req.body.user_id, req.clientId)

    auditLogger.info("attributes", req.body.user_attributes)
    auditLogger.info("username", username)

    attributeController.removeAttributeSources(
      username,
      req.clientId,
      req.body.user_attributes
    )
  })
)

const getAuthorizedSources = async (
  username: UUID,
  scopes: string[],
  clientId: UUID
) => {
  const sources = await attributeController.getAllAttributeSources(username)

  return Object.fromEntries(
    Object.entries(sources).filter((it): it is [string, UUID[]] => {
      const [attribute, serviceIds] = it
      return (
        serviceIds !== null &&
        scopes.includes(attribute) &&
        !serviceIds.includes(clientId)
      )
    })
  )
}

attributesRouter.get(
  "/all_authorized",
  OauthAccessTokenMiddleware(),
  handleOauthRequest(async (req) => {
    const sources = await getAuthorizedSources(
      req.username,
      req.scopes,
      req.clientId
    )

    auditLogger.info("attributes", Object.keys(sources))

    const attributeValues = await attributeController.getAttributes(
      sources,
      req.username
    )

    auditLogger.info("retrievedAttributes", attributeValues)

    return Object.fromEntries(
      Object.keys(sources).map((attr) => [
        attr,
        {
          status: attr in attributeValues ? "SUCCESS" : "NOT_AVAILABLE",
          value: attributeValues[attr],
        },
      ])
    )
  })
)

attributesRouter.get(
  "/:attribute_name",
  OauthAccessTokenMiddleware(),
  handleOauthRequest(async (req) => {
    const attributeName = req.params.attribute_name
    const attributeList = [attributeName]
    const username = req.username

    auditLogger.info("attributes", attributeList)

    if (attributeList.some((attr) => !req.scopes.includes(attr))) {
      throw new InsufficientScopeOauthBearerError(
        "Client does not have granted scopes for retrieving the attribute"
      )
    }

    const sources = await attributeController.getAttributeSources(
      username,
      attributeList
    )

    const attributeValues = await attributeController.getAttributes(
      Object.fromEntries(
        Object.entries(sources).filter(
          (attrSourcePair): attrSourcePair is [string, UUID[]] =>
            attrSourcePair[1] !== null
        )
      ),
      username
    )

    auditLogger.info("retrievedAttributes", attributeValues)

    const attributes = Object.fromEntries(
      Object.keys(sources).map((attr) => [
        attr,
        {
          status: attr in attributeValues ? "SUCCESS" : "NOT_AVAILABLE",
          value: attributeValues[attr],
        },
      ])
    )

    return { [attributeName]: attributes[attributeName] }
  })
)
