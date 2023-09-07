import { db } from "../../db"
import {
  insertService,
  selectAllowedScopes,
  selectAuroraAIServicesByPTVServiceChannelIds,
  selectOauthClientByID,
  selectOauthClientByIDAndSecret,
  selectReceivableSessionAttributesByAuroraAIServiceId,
  selectServiceAllowedScopes,
  selectServiceDataProviderUrl,
  selectServiceInformationById,
  selectServiceNameAndLinkByIds,
  selectServiceNameByIds,
  updateServiceSecret,
} from "./auroraAIServiceDb"
import { UUID } from "io-ts-types/UUID"
import { TranslatableString, Scope } from "shared/schemas"
import { transformRawTranslatableToObject } from "../../util/helper"
import Axios from "axios"
import { auditLogger, technicalLogger } from "../../util/logger"
import { NotFoundError, ValidationError } from "../../util/errors/ApiErrors"
import { getSecret } from "../../util/secrets"
import jwt from "jsonwebtoken"
import jwkToPem from "jwk-to-pem"
import { generateUUIDForOauthClient } from "../../util/uuid"
import { config } from "../../config"
import { insertAttributeDeletion } from "../attribute/attributeDb"
import { OAuthTokens } from "../oauth/oauth"

export const auroraAIServiceController = {
  getAuroraAIServiceId: getAuroraAIServiceId,
  checkIfSessionTransfersAreSupported: checkIfSessionTransfersAreSupported,
  getReceivableSessionAttributes: getReceivableSessionAttributes,
  getServiceInformation: getServiceInformation,
  getServiceAllowedScopes: getServiceAllowedScopes,
  contactServiceForAttributes: contactServiceForAttributes,
  getOauthClient: getOauthClient,
  getOauthClientWithSecret: getOauthClientWithSecret,
  getServiceNames: getServiceNames,
  getServiceNamesAndLinks: getServiceNamesAndLinks,
  getAllowedScopes: getAllowedScopes,
  requestServiceToDeleteAttributes: requestServiceToDeleteAttributes,
  replaceTokens: replaceTokens,
  addService: addService,
  setServiceSecret: setServiceSecret,
}

async function getAuroraAIServiceId(ptvServiceChannelId: UUID): Promise<UUID> {
  const auroraAIServices = await db.task((t) =>
    selectAuroraAIServicesByPTVServiceChannelIds(t, [ptvServiceChannelId])
  )

  if (auroraAIServices.length === 0) {
    throw new ValidationError(
      `PTV-service-channel ${ptvServiceChannelId} is not registered to any AuroraAI service.`
    )
  }

  return auroraAIServices[0].auroraAIServiceId
}

async function checkIfSessionTransfersAreSupported(
  ptvServiceChannelIds: UUID[]
): Promise<Record<UUID, boolean>> {
  const supportedPTVServiceChannelIds = await db.task((t) =>
    selectAuroraAIServicesByPTVServiceChannelIds(t, ptvServiceChannelIds)
  )

  const supportedPTVServiceChannelIdsSet = new Set(
    supportedPTVServiceChannelIds.map(
      ({ ptvServiceChannelId }) => ptvServiceChannelId
    )
  )

  return Object.fromEntries(
    ptvServiceChannelIds.map(
      (ptvServiceChannelId) =>
        [
          ptvServiceChannelId,
          supportedPTVServiceChannelIdsSet.has(ptvServiceChannelId),
        ] as [UUID, boolean]
    )
  )
}

async function getReceivableSessionAttributes(
  auroraAIServiceId: UUID
): Promise<string[]> {
  return db.task((t) =>
    selectReceivableSessionAttributesByAuroraAIServiceId(t, auroraAIServiceId)
  )
}

async function getServiceInformation(auroraAIServiceId: UUID): Promise<{
  provider: TranslatableString
  name: TranslatableString
  type: TranslatableString
  location: TranslatableString
  description: TranslatableString
  link: TranslatableString
}> {
  const service = await db.task((t) =>
    selectServiceInformationById(t, auroraAIServiceId)
  )

  return {
    provider: transformRawTranslatableToObject("provider", service),
    name: transformRawTranslatableToObject("name", service),
    type: transformRawTranslatableToObject("type", service),
    location: transformRawTranslatableToObject("location", service),
    description: transformRawTranslatableToObject("description", service),
    link: transformRawTranslatableToObject("link", service),
  }
}

async function getOauthClient(auroraAIServiceId: UUID): Promise<{
  id: UUID
  allowedScopes: string[]
  allowedRedirectUris: string[]
  defaultRedirectUri?: string
  oauthClientSecret?: string
  name: TranslatableString
} | null> {
  const client = await db.task((t) =>
    selectOauthClientByID(t, auroraAIServiceId)
  )

  if (!client) {
    return null
  }

  return {
    id: client.id,
    allowedScopes: client.allowedScopes,
    allowedRedirectUris: client.allowedRedirectUris,
    defaultRedirectUri: client.defaultRedirectUri,
    oauthClientSecret: client.oauthClientSecret,
    name: transformRawTranslatableToObject("name", client),
  }
}

async function getOauthClientWithSecret(
  auroraAIServiceId: UUID,
  oauthClientSecret: string
): Promise<{
  id: UUID
  allowedScopes: string[]
  allowedRedirectUris: string[]
  defaultRedirectUri?: string
  oauthClientSecret?: string
  name: TranslatableString
} | null> {
  const client = await db.task((t) =>
    selectOauthClientByIDAndSecret(t, auroraAIServiceId, oauthClientSecret)
  )

  if (!client) {
    return null
  }

  return {
    id: client.id,
    allowedScopes: client.allowedScopes,
    allowedRedirectUris: client.allowedRedirectUris,
    defaultRedirectUri: client.defaultRedirectUri,
    name: transformRawTranslatableToObject("name", client),
  }
}

const getDataProviderUrl = async (auroraAIServiceId: UUID) => {
  const dataProviderUrl = await db.task((t) =>
    selectServiceDataProviderUrl(t, auroraAIServiceId)
  )

  if (!dataProviderUrl) throw Error("Failed to get data provider url.")

  return `${dataProviderUrl.replace(/\/$/, "")}`
}

async function getServiceAllowedScopes(
  auroraAIServiceId: UUID
): Promise<Scope[]> {
  const allowedScopes = await db.task((t) =>
    selectServiceAllowedScopes(t, auroraAIServiceId)
  )

  if (!allowedScopes) throw Error("Failed to get allowed scopes.")

  return allowedScopes
}

async function createJwt(
  username: UUID,
  auroraAIServiceId: UUID,
  url: string,
  attributes: string[] = []
) {
  const jwk = JSON.parse(
    (await getSecret("Profile_Management_Oauth_JWK")) ?? "{}"
  )

  const payload = {
    iss: `${config.service_host || "http://localhost:3000"}/oauth`,
    sub: await generateUUIDForOauthClient(username, auroraAIServiceId),
    aud: url,
    exp: Math.floor(Date.now() / 1000) + 60,
    scope: attributes.join(" "),
  }

  auditLogger.info("jwtPayload", payload)

  return jwt.sign(payload, jwkToPem(jwk, { private: true }), {
    algorithm: jwk.alg ?? "RS256",
    keyid: jwk.kid,
  })
}

async function contactServiceForAttributes(
  auroraAIServiceId: UUID,
  attributes: string[],
  username: UUID
): Promise<Record<string, unknown> | undefined> {
  try {
    const baseUrl = await getDataProviderUrl(auroraAIServiceId)
    const token = await createJwt(
      username,
      auroraAIServiceId,
      baseUrl,
      attributes
    )
    const url = `${baseUrl}/auroraai/profile-management/v1/user_attributes`

    auditLogger.info("contactedDataProviders", [
      { auroraAIServiceId, url, attributes },
    ])

    auditLogger.info("username", username)

    const response = await Axios.get(url, {
      validateStatus: () => true,
      timeout: 5000,
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    return Object.fromEntries(
      Object.entries(response.data).filter(
        ([key, value]) => attributes.includes(key) && value !== null
      )
    )
  } catch (e) {
    auditLogger.error(e)
    return undefined
  }
}

async function requestServiceToDeleteAttributes(
  username: UUID,
  auroraAIServiceId: UUID,
  scheduledRetryOnFailure: boolean
): Promise<boolean> {
  const baseUrl = await getDataProviderUrl(auroraAIServiceId)
  const token = await createJwt(username, auroraAIServiceId, baseUrl)
  const url = `${baseUrl}/auroraai/profile-management/v1/user_attributes`

  auditLogger.info("contactedDataProviders", [
    { auroraAIServiceId, url, attributes: [] },
  ])

  auditLogger.info("username", username)

  let retryAttempts = 3
  let success = false

  while (retryAttempts--) {
    const { status } = await Axios.delete(url, {
      validateStatus: () => true,
      timeout: 5000,
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    if (status === 200) {
      success = true
      break
    } else if (status >= 500) {
      // 5XX responses
      if (retryAttempts)
        // wait 500ms between attempts
        await new Promise((resolve) => setTimeout(resolve, 500))
      else if (scheduledRetryOnFailure)
        await db.task((t) =>
          insertAttributeDeletion(t, [{ username, auroraAIServiceId }])
        )
    } else {
      technicalLogger.error(`Invalid status code ${status}`)
      break
    }
  }
  return success
}

async function getServiceNames(
  auroraAIServiceIds: UUID[]
): Promise<Record<UUID, TranslatableString>> {
  const names = await db.task((t) =>
    selectServiceNameByIds(t, auroraAIServiceIds)
  )

  return Object.fromEntries(
    names.map(({ id, ...rest }) => [
      id,
      transformRawTranslatableToObject("name", rest),
    ])
  )
}

async function getServiceNamesAndLinks(
  auroraAIServiceIds: UUID[]
): Promise<
  Record<UUID, { name: TranslatableString; link: TranslatableString }>
> {
  const names = await db.task((t) =>
    selectServiceNameAndLinkByIds(t, auroraAIServiceIds)
  )

  return Object.fromEntries(
    names.map(({ id, ...rest }) => [
      id,
      {
        name: transformRawTranslatableToObject("name", rest),
        link: transformRawTranslatableToObject("link", rest),
      },
    ])
  )
}

async function getAllowedScopes(): Promise<string[]> {
  return db.task((t) => selectAllowedScopes(t))
}

async function replaceTokens(
  username: UUID,
  serviceId: UUID,
  tokens: OAuthTokens
): Promise<void> {
  const baseUrl = await getDataProviderUrl(serviceId)
  const jwt = await createJwt(username, serviceId, baseUrl)
  const url = `${baseUrl}/auroraai/profile-management/v1/token`

  await Axios.post(url, tokens, {
    timeout: 5000,
    headers: {
      authorization: `Bearer ${jwt}`,
    },
  })
}

async function addService(
  serviceId: UUID,
  ptvServiceChannelId: UUID,
  sessionTransferReceivableAttributes: string[],
  name: TranslatableString,
  link: TranslatableString,
  allowedScopes: Scope[],
  allowedRedirectUris: string[],
  defaultRedirectUri: string,
  dataProviderUrl: string,
  provider: TranslatableString,
  description: TranslatableString,
  secret: string
): Promise<void> {
  await db.task((t) =>
    insertService(
      t,
      serviceId,
      ptvServiceChannelId,
      sessionTransferReceivableAttributes,
      provider,
      name,
      link,
      allowedScopes,
      allowedRedirectUris,
      defaultRedirectUri,
      dataProviderUrl,
      description,
      secret
    )
  )
}

async function setServiceSecret(
  serviceId: UUID,
  secret: string
): Promise<void> {
  const rows = await db.task((t) => updateServiceSecret(t, serviceId, secret))
  if (!rows) throw new NotFoundError("Service not found")
}
