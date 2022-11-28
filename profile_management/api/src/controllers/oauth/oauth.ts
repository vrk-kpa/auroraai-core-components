import { db } from "../../db"
import { UUID } from "io-ts-types/UUID"
import {
  deleteAuthorizationCode,
  deleteAuthorizationCodes,
  deleteExpiredAuthorizationCodes,
  deleteExpiredTokenPairs,
  deleteTokenPairsByUserAndService,
  deleteTokenPairByRefreshToken,
  deleteTokenPairByAccessToken,
  insertAuthorizationCode,
  insertTokenPair,
  selectAccessToken,
  selectAccessTokenScopesForUserService,
  selectAuthorizationByCode,
  selectRefreshToken,
  selectRefreshTokenScopesForUserService,
  selectServicesWithAccessTokensByUsername,
  selectServicesWithAuthorizationCodesByUsername,
  selectServicesWithRefreshTokensByUsername,
  updateExpirationTimesToNow,
  deleteTokenPairsByUser,
  deleteAllAuthorizationCodes,
  selectRefreshTokenByAnyToken,
  selectUserTokensByServiceId,
  restoreTokenPairs,
} from "./oauthDb"
import { pseudoRandomBytes } from "crypto"
import {
  OauthTokenRevoke,
  OauthTokenWithAuthorizationCode,
  OauthTokenWithRefreshToken,
} from "../../schemas"
import { getSecret } from "../../util/secrets"
import jwt from "jsonwebtoken"
import jwkToPem from "jwk-to-pem"
import { generateUUIDForOauthClient } from "../../util/uuid"
import {
  InvalidGrantOauthError,
  InvalidScopeOauthError,
} from "../../util/errors/OauthErrors"
import base64url from "base64url"
import { ensureOpenIDScope, ServiceAttributes } from "shared/util/attributes"
import { removeDuplicates } from "../../util/helper"
import { config } from "../../config"
import { deleteAttributeSourcesByServiceId } from "../attribute/attributeDb"
import { Scope } from "shared/schemas"

const decodeBase64Url = (b64url: string) =>
  Buffer.from(base64url.toBase64(b64url), "base64")

export type OAuthTokens = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
  id_token: string
}

export type TokenPair = {
  refreshToken: Buffer
  accessToken: Buffer
  createdAt: Date
  authTime: Date
  refreshExpirationTime: Date
  accessExpirationTime: Date
  refreshTokenScopes: string[]
  accessTokenScopes: []
  auroraAIServiceId: UUID
  username: UUID
}

export const oauthController = {
  createAuthorizationCode,
  createTokenPair,
  getAuthorizationCode,
  getRefreshToken,
  getAccessToken,
  removeExpiredAuthorizationCodes,
  removeAuthorizationCode,
  removeAuthorizationCodes,
  removeExpiredTokenPairs,
  removeAllAuthorizationCodesForUser,
  removeAllTokenPairsForUser,
  removeTokenPairByRefreshToken,
  removeTokenPairsByUserAndService,
  removeTokenPairByAccessToken,
  revokeTokenPair,
  invalidateTokenPair,
  authenticateWithAuthorizationCode,
  authenticateWithRefreshToken,
  getGrantedScopes,
  getAuthorizedServices,
  replaceUserTokens,
  getUserTokensByServiceId,
  restoreUserTokenPairs,
}

async function createAuthorizationCode(
  auroraAIServiceId: UUID,
  username: UUID,
  redirectUri: string | null,
  scopes: string[],
  authTime: number
): Promise<string> {
  const code = pseudoRandomBytes(128)

  await db.task((t) =>
    insertAuthorizationCode(
      t,
      code,
      username,
      auroraAIServiceId,
      redirectUri,
      scopes,
      new Date(authTime * 1000)
    )
  )

  return base64url(code)
}

async function getAuthorizationCode(authorizationCode: string): Promise<{
  username: UUID
  auroraAIServiceId: UUID
  redirectUri: string | null
  scopes: string[]
  authTime: Date
} | null> {
  return await db.task((t) =>
    selectAuthorizationByCode(t, decodeBase64Url(authorizationCode))
  )
}

async function createTokenPair(
  auroraAIServiceId: UUID,
  username: UUID,
  refreshTokenScopes: string[],
  accessTokenScopes: string[],
  authTime: Date
): Promise<{ refreshToken: Buffer; accessToken: Buffer }> {
  const refreshToken = pseudoRandomBytes(128)
  const accessToken = pseudoRandomBytes(128)

  await db.task((t) =>
    insertTokenPair(
      t,
      refreshToken,
      accessToken,
      username,
      auroraAIServiceId,
      refreshTokenScopes,
      accessTokenScopes,
      authTime
    )
  )

  return { refreshToken, accessToken }
}

async function getUserTokensByServiceId(
  username: UUID,
  auroraAIServiceId: UUID
): Promise<TokenPair[] | null> {
  return await db.task((t) =>
    selectUserTokensByServiceId(t, username, auroraAIServiceId)
  )
}

async function restoreUserTokenPairs(tokens: TokenPair[]): Promise<void> {
  await db.task((t) => restoreTokenPairs(t, tokens))
}

async function getRefreshToken(token: string): Promise<{
  token: Buffer
  username: UUID
  auroraAIServiceId: UUID
  expirationTime: Date
  scopes: string[]
  authTime: Date
} | null> {
  return await db.task((t) => selectRefreshToken(t, decodeBase64Url(token)))
}

async function getAccessToken(token: string): Promise<{
  username: UUID
  auroraAIServiceId: UUID
  scopes: string[]
} | null> {
  return await db.task((t) => selectAccessToken(t, decodeBase64Url(token)))
}

async function invalidateTokenPair(refreshToken: Buffer): Promise<void> {
  await db.task((t) => updateExpirationTimesToNow(t, refreshToken))
}

async function removeExpiredAuthorizationCodes(): Promise<void> {
  await db.task((t) => deleteExpiredAuthorizationCodes(t))
}

async function removeAuthorizationCode(code: string): Promise<void> {
  await db.task((t) => deleteAuthorizationCode(t, decodeBase64Url(code)))
}

async function removeAuthorizationCodes(
  username: UUID,
  auroraAIServiceId: UUID
): Promise<void> {
  await db.task((t) => deleteAuthorizationCodes(t, username, auroraAIServiceId))
}

async function removeExpiredTokenPairs(): Promise<void> {
  await db.task((t) => deleteExpiredTokenPairs(t))
}

async function removeTokenPairByRefreshToken(token: string): Promise<void> {
  await db.task((t) => deleteTokenPairByRefreshToken(t, decodeBase64Url(token)))
}

async function removeTokenPairsByUserAndService(
  username: UUID,
  auroraAIServiceId: UUID
): Promise<void> {
  await db.task((t) =>
    deleteTokenPairsByUserAndService(t, username, auroraAIServiceId)
  )
}

async function removeTokenPairByAccessToken(token: string): Promise<void> {
  await db.task((t) => deleteTokenPairByAccessToken(t, decodeBase64Url(token)))
}

async function removeAllTokenPairsForUser(username: UUID): Promise<void> {
  await db.task((t) => deleteTokenPairsByUser(t, username))
}

async function revokeTokenPair(
  revokeRequest: OauthTokenRevoke,
  auroraAIServiceId: UUID
): Promise<null> {
  const tokenInfo = await db.task((t) =>
    selectRefreshTokenByAnyToken(t, decodeBase64Url(revokeRequest.token))
  )

  if (tokenInfo) {
    if (tokenInfo.auroraAIServiceId !== auroraAIServiceId) {
      throw new InvalidGrantOauthError("Token was granted to another client")
    }

    await db.task((t) =>
      Promise.all([
        deleteTokenPairByRefreshToken(t, tokenInfo.refreshToken),
        deleteAttributeSourcesByServiceId(
          t,
          tokenInfo.username,
          tokenInfo.auroraAIServiceId
        ),
      ])
    )
  }

  return null // Force status code 200 over 204
}

async function authenticateWithAuthorizationCode(
  auroraAIServiceId: UUID,
  request: OauthTokenWithAuthorizationCode
): Promise<OAuthTokens> {
  const codeInformation = await oauthController.getAuthorizationCode(
    request.code
  )

  if (!codeInformation) {
    throw new InvalidGrantOauthError("Authorization code not found or expired")
  }

  if (codeInformation.auroraAIServiceId !== auroraAIServiceId) {
    throw new InvalidGrantOauthError(
      "Authorization code has been granted to some other client"
    )
  }

  if (
    codeInformation.redirectUri &&
    codeInformation.redirectUri !== request.redirect_uri
  ) {
    throw new InvalidGrantOauthError("Redirect URIs do not match")
  }

  const authTime = Math.floor(codeInformation.authTime.getTime() / 1000)

  const idToken = await createIdToken(
    codeInformation.username,
    authTime,
    auroraAIServiceId
  )

  await oauthController.removeAuthorizationCode(request.code)

  const { refreshToken, accessToken } = await oauthController.createTokenPair(
    auroraAIServiceId,
    codeInformation.username,
    codeInformation.scopes,
    codeInformation.scopes,
    codeInformation.authTime
  )

  return {
    access_token: base64url(accessToken),
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: base64url(refreshToken),
    scope: codeInformation.scopes.join(" "),
    id_token: idToken,
  }
}

async function authenticateWithRefreshToken(
  auroraAIServiceId: UUID,
  request: OauthTokenWithRefreshToken
): Promise<OAuthTokens> {
  const tokenInfo = await oauthController.getRefreshToken(request.refresh_token)

  if (!tokenInfo) {
    throw new InvalidGrantOauthError("Token not found")
  }

  if (tokenInfo.auroraAIServiceId !== auroraAIServiceId) {
    throw new InvalidGrantOauthError("Token was granted to another client")
  }

  const accessTokenScopes = validateAccessTokenScopes(
    request.scope,
    tokenInfo.scopes
  )

  const authTime = Math.floor(tokenInfo.authTime.getTime() / 1000)
  const idToken = await createIdToken(
    tokenInfo.username,
    authTime,
    auroraAIServiceId
  )

  const { refreshToken, accessToken } = await createTokenPair(
    tokenInfo.auroraAIServiceId,
    tokenInfo.username,
    tokenInfo.scopes,
    accessTokenScopes,
    tokenInfo.authTime
  )

  await invalidateTokenPair(tokenInfo.token)

  return {
    access_token: base64url(accessToken),
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: base64url(refreshToken),
    scope: accessTokenScopes.join(" "),
    id_token: idToken,
  }
}

async function replaceUserTokens(
  username: UUID,
  serviceId: UUID,
  scopes: Scope[]
): Promise<OAuthTokens> {
  await removeTokenPairsByUserAndService(username, serviceId)

  const authTime = new Date()
  const validatedScopes = ensureOpenIDScope(scopes)

  const idToken = await createIdToken(
    username,
    Math.floor(authTime.getTime() / 1000),
    serviceId
  )

  const { refreshToken, accessToken } = await createTokenPair(
    serviceId,
    username,
    validatedScopes,
    validatedScopes,
    authTime
  )

  return {
    access_token: base64url(accessToken),
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: base64url(refreshToken),
    scope: scopes.join(" "),
    id_token: idToken,
  }
}

function validateAccessTokenScopes(
  requestScopes: string | null | undefined,
  refreshTokenScopes: string[]
) {
  if (!requestScopes) {
    return refreshTokenScopes
  }

  // Check that all new scopes are included in the old token scopes.
  // Scopes can be removed during refresh but not added.
  const newScopes = requestScopes.split(" ").filter((scope) => {
    if (scope !== "openid" && !refreshTokenScopes.includes(scope)) {
      throw new InvalidScopeOauthError(
        `Scope ${scope} not within the scopes of the refresh token`
      )
    }
    return true
  })

  ensureOpenIDScope(newScopes)
  return newScopes
}

async function createIdToken(
  username: UUID,
  authTime: number,
  auroraAIServiceId: UUID
) {
  const jwk = JSON.parse(
    (await getSecret("Profile_Management_Oauth_JWK")) ?? "{}"
  )

  return jwt.sign(
    {
      iss: `${config.service_host || "http://localhost:3000"}/oauth`,
      sub: await generateUUIDForOauthClient(username, auroraAIServiceId),
      aud: auroraAIServiceId,
      exp: Math.floor(Date.now() / 1000) + 36000,
      iat: Math.floor(Date.now() / 1000),
      auth_time: authTime,
    },
    jwkToPem(jwk, { private: true }),
    {
      algorithm: jwk.alg ?? "RS256",
      keyid: jwk.kid,
    }
  )
}

async function getGrantedScopes(
  username: UUID,
  clientId: UUID
): Promise<string[]> {
  const [grantedRefreshTokenScopes, grantedAccessTokenScopes] = await db.task(
    (t) =>
      Promise.all([
        selectRefreshTokenScopesForUserService(t, username, clientId),
        selectAccessTokenScopesForUserService(t, username, clientId),
      ])
  )

  return removeDuplicates([
    ...grantedRefreshTokenScopes,
    ...grantedAccessTokenScopes,
  ])
}

async function removeAllAuthorizationCodesForUser(
  username: UUID
): Promise<void> {
  await db.task((t) => deleteAllAuthorizationCodes(t, username))
}

// Get services that user has authenticated to store or retrieve attributes
async function getAuthorizedServices(
  username: UUID
): Promise<ServiceAttributes[]> {
  const services = await db.task((t) =>
    Promise.all([
      selectServicesWithRefreshTokensByUsername(t, username),
      selectServicesWithAccessTokensByUsername(t, username),
      selectServicesWithAuthorizationCodesByUsername(t, username),
    ])
  )

  return removeDuplicates(services.flat())
}
