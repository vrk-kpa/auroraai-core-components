import { initDb } from "../src/db"
import { config } from "../src/config"
import base64url from "base64url"

export const setupTestDbConnection = (): void => {
  initDb(
    process.env.DB_HOST ?? "",
    parseInt(process.env.DB_PORT ?? "0", 10),
    process.env.DB_NAME ?? "",
    process.env.DB_USER ?? "",
    process.env.DB_PASSWORD ?? ""
  )
}

export const AUTHORIZATION_HEADERS = {
  authorization: `Key ${config.profile_management_recommender_api_key}`,
}

export const buildOauthClientHeader = (
  serviceId: string,
  secret: string
): { authorization: string } => {
  const credentials = Buffer.from([serviceId, secret].join(":")).toString(
    "base64"
  )

  return { authorization: `Basic ${credentials}` }
}

export const buildOauthAccessTokenHeader = (
  accessToken: Buffer
): { authorization: string } => ({
  authorization: `Bearer ${base64url(accessToken)}`,
})
