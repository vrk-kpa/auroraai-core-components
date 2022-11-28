import { RequestHandler } from "express"
import { getSecret } from "../util/secrets"
import { auditLogger } from "../util/logger"
import { UnauthorizedError } from "../util/errors/ApiErrors"
import { config } from "../config"

const getApiKeys = async () => {
  if (config.profile_management_recommender_api_key)
    return [config.profile_management_recommender_api_key]
  const apiKeySecretNames = [
    "Profile_Management_Recommender_Api_key",
    "Profile_Management_Internal_Api_key",
  ]
  return await Promise.all(
    apiKeySecretNames.map((secretName) => getSecret(secretName))
  )
}

export const APIKeyMiddleware = (): RequestHandler => async (req, _, next) => {
  if (!req.headers["authorization"]) {
    return next(new UnauthorizedError("Authorization header was not present."))
  }

  const [type, credentials] = req.headers["authorization"].split(" ")

  auditLogger.info("apiKey", credentials)

  if (type !== "Key") {
    return next(
      new UnauthorizedError(`Unsupported authorization type: ${type}.`)
    )
  }

  const apiKeys = await getApiKeys()
  if (!apiKeys.includes(credentials)) {
    return next(new UnauthorizedError("The given API key is invalid."))
  }

  next()
}
