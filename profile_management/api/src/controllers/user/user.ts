import { db } from "../../db"
import {
  AdminGetUserCommand,
  AdminResetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AuthFlowType,
  ChangePasswordCommand,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  DeleteUserCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  InitiateAuthCommand,
  ListUsersCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider"
import { SendEmailCommand } from "@aws-sdk/client-ses"
import { wrapCognitoError } from "../../util/error"
import { createHmac } from "crypto"
import jwt from "jsonwebtoken"
import jwkToPem from "jwk-to-pem"
import { ChallengeResponse, CognitoError } from "shared/cognito-types"
import * as schemas from "shared/schemas"
import {
  EmailAddress,
  Language,
  RetrievableAttributeArray,
  StorableAttributeArray,
  TranslatableString,
  ScopeChangeRequest,
  Scope,
} from "shared/schemas"
import { getSecret } from "../../util/secrets"
import { oauthController, TokenPair } from "../oauth/oauth"
import { UUID } from "io-ts-types/UUID"
import { auroraAIServiceController } from "../auroraAIService/auroraAIService"
import { auditLogger, technicalLogger } from "../../util/logger"
import { createAndDecodeTokenObjectFromString } from "../../util/session"
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../util/errors/ApiErrors"
import { removeDuplicates } from "../../util/helper"
import {
  ensureOpenIDScope,
  filterRetrievableAttributes,
  filterStorableAttributes,
  MixedAttribute,
  ServiceAttributes,
} from "shared/util/attributes"
import { attributeController } from "../attribute/attribute"
import {
  deletePasswordSetDates,
  selectAttributeSourceServicesByUsername,
  selectPasswordChangeInfo,
  selectUserPasswordChangeInfo,
  selectUsersWithPasswordUnchangedSince,
  upsertPasswordSetDate,
} from "./userDb"
import { Request } from "express"
import { cognitoClient, userPoolConfiguration } from "../../cognito/config"
import { config } from "../../config"
import { calcPasswordValidUntil, getShortDate } from "../../util/time"
import { RequestCognitoUser } from "../../util/requestHandler"
import { generateSecretHash } from "../../util/cognito"
import { generateEmailParams, sesClient } from "../../ses/config"
import { CustomMessage, translations } from "../../util/translation"

/**
 * User controller functionalities that do not require authentication
 */
export const userControllerAnonymous = {
  emailAvailable,
  initiateAuth,
  respondToAuthChallenge,
  signUp,
  signUpResendConfirm,
  signUpConfirm,
  forgotPassword,
  resetPassword,
}

/**
 * User controller functionalities that require authentication
 */
export const userControllerAuthenticated = {
  getConnectedServices,
  getUserProfile,
  changePassword,
  changeEmail,
  changeEmailVerify,
  initOauthAuthorization,
  oauthAuthorize,
  authWithRefreshToken,
  oauthDeactivate,
  getServicesBlockingDeletion,
  deactivateAllServices,
  deleteUser,
  removeService,
  requestScopeChange,
}

/**
 * Utility functions
 */
export const userControllerUtils = {
  expiredPasswordsForceReset,
  clearObsoletePasswordChangeInfo,
}

async function getConnectedServices(
  username: UUID
): Promise<schemas.ConnectedService[]> {
  // authenticatedServices are allowed to store or retrieve some attributes
  // sourceServices have actually stored some attribute value(s)
  const [authenticatedServices, sourceServices] = await db.task((t) =>
    Promise.all([
      oauthController.getAuthorizedServices(username),
      selectAttributeSourceServicesByUsername(t, username),
    ])
  )

  return Promise.all(
    removeDuplicates([...authenticatedServices, ...sourceServices], "id").map(
      async (service) => {
        const serviceInformation =
          await auroraAIServiceController.getServiceInformation(service.id)

        const allowedScopes =
          await auroraAIServiceController.getServiceAllowedScopes(service.id)

        const sources = getAttributeSources(sourceServices)

        const allAttributes = {
          stored: getAttributesById(sourceServices, service.id),
          authenticated: getAttributesById(authenticatedServices, service.id),
        }

        const filteredAttributes = {
          retrievable: getRetrievableAttributes(allAttributes),
          storable: getStorableAttributes(allAttributes),
        }

        return {
          id: service.id,
          ...serviceInformation,
          allowedScopes: allowedScopes,
          retrievableAttributes: filteredAttributes.retrievable,
          storableAttributes: filteredAttributes.storable,
          retrievableAttributesSources: sources,
        }
      }
    )
  )
}

const getAttributesById = (services: ServiceAttributes[], id: UUID) =>
  services.find((it) => it.id === id)?.attributes ?? []

const getRetrievableAttributes = (attributes: {
  stored: MixedAttribute[]
  authenticated: MixedAttribute[]
}): RetrievableAttributeArray =>
  removeDuplicates(filterRetrievableAttributes(attributes.authenticated)).map(
    (attributeName) => ({ name: attributeName })
  )

const getStorableAttributes = (attributes: {
  stored: MixedAttribute[]
  authenticated: MixedAttribute[]
}): StorableAttributeArray =>
  removeDuplicates(filterStorableAttributes(attributes.authenticated)).map(
    (attributeName) => ({
      name: attributeName,
      isStored: attributes.stored.includes(attributeName),
    })
  )

function getAttributeSources(sourceServices: ServiceAttributes[]) {
  const sources: Record<string, string[]> = {}

  sourceServices.forEach((source) =>
    source.attributes.forEach((attr) => {
      sources[attr] = !sources[attr]
        ? [source.id]
        : [...sources[attr], source.id]
    })
  )

  return sources
}

async function emailAvailable({
  email,
}: schemas.CheckEmailAvailabilityRequest): Promise<boolean> {
  const { Users } = await cognitoClient.send(
    new ListUsersCommand({
      AttributesToGet: [],
      Filter: `email = "${
        email?.toString()?.replace(/\\/g, "\\\\").replace(/"/g, '\\"') ?? ""
      }"`,
      UserPoolId: (await userPoolConfiguration).userPoolId,
    })
  )

  return Users?.length === 0
}

async function getUserNameByEmail(email: string): Promise<UUID> {
  const { Users } = await cognitoClient.send(
    new ListUsersCommand({
      AttributesToGet: [],
      UserPoolId: (await userPoolConfiguration).userPoolId,
      Filter: `email = "${
        email?.toString()?.replace(/\\/g, "\\\\").replace(/"/g, '\\"') ?? ""
      }"`,
      Limit: 1,
    })
  )
  if (!Users || !Users.length) {
    throw {
      name: "UserNotFoundException",
      message: `User ${email} was not found`,
    } as CognitoError
  }
  return Users[0].Username as UUID
}

async function getUserStatus(username: UUID): Promise<string> {
  try {
    const { UserStatus } = await cognitoClient.send(
      new AdminGetUserCommand({
        UserPoolId: (await userPoolConfiguration).userPoolId,
        Username: username,
      })
    )
    return UserStatus ?? "unknown"
  } catch (e) {
    auditLogger.error(e)
    const error = e as CognitoError
    if (error.name === "UserNotFoundException") return "NOT_FOUND"
    return "unknown"
  }
}

async function getAllUsers(): Promise<UserType[]> {
  let paginationToken = ""
  const users: UserType[] = []
  do {
    const { Users, PaginationToken } = await cognitoClient.send(
      new ListUsersCommand({
        UserPoolId: (await userPoolConfiguration).userPoolId,
        ...(paginationToken && { PaginationToken: paginationToken }),
      })
    )
    paginationToken = PaginationToken || ""
    if (Users) users.push(...Users)
  } while (paginationToken)
  return users
}

async function initiateAuth({
  username: email,
  srpA,
}: schemas.InitiateAuthRequest): Promise<
  | {
      accessToken: string
      refreshToken?: string
    }
  | (ChallengeResponse & { poolId: string })
> {
  try {
    const { userPoolId, userPoolClientId } = await userPoolConfiguration
    const username = await getUserNameByEmail(email)
    const init = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_SRP_AUTH,
        AuthParameters: {
          USERNAME: username,
          SRP_A: srpA,
          SECRET_HASH: await generateSecretHash(
            userPoolId,
            userPoolClientId,
            username
          ),
        },
        ClientId: userPoolClientId,
      })
    )

    if (init.AuthenticationResult?.AccessToken) {
      return {
        accessToken: init.AuthenticationResult.AccessToken,
        refreshToken: init.AuthenticationResult.RefreshToken,
      }
    }

    let challengeParameters = {}

    if (init.ChallengeParameters) {
      if (init.ChallengeName === "PASSWORD_VERIFIER") {
        challengeParameters = {
          userId: init.ChallengeParameters.USER_ID_FOR_SRP,
          salt: init.ChallengeParameters.SALT,
          srpB: init.ChallengeParameters.SRP_B,
          secretBlock: init.ChallengeParameters.SECRET_BLOCK,
        }
      }
    }

    return {
      challengeName: init.ChallengeName,
      challengeParameters,
      session: init.Session,
      poolId: (await userPoolConfiguration).userPoolId,
    } as ChallengeResponse & { poolId: string }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "InitiateAuth")
  }
}

async function respondToAuthChallenge({
  challenge,
  session,
}: schemas.RespondToAuthChallengeRequest): Promise<
  | {
      accessToken: string
      refreshToken?: string
    }
  | (ChallengeResponse & { poolId: string })
> {
  try {
    let ChallengeResponses = {}

    const { userPoolId, userPoolClientId } = await userPoolConfiguration
    if (challenge.type === "PASSWORD_VERIFIER") {
      ChallengeResponses = {
        USERNAME: challenge.parameters.username,
        PASSWORD_CLAIM_SECRET_BLOCK: challenge.parameters.secretBlock,
        TIMESTAMP: challenge.parameters.timestamp,
        PASSWORD_CLAIM_SIGNATURE: challenge.parameters.signature,
        SECRET_HASH: await generateSecretHash(
          userPoolId,
          userPoolClientId,
          challenge.parameters.username
        ),
      }
    } else {
      throw new ValidationError("Invalid challenge")
    }

    const challengeResponse = await cognitoClient.send(
      new RespondToAuthChallengeCommand({
        ClientId: userPoolClientId,
        ChallengeName: challenge.type,
        Session: session ?? undefined,
        ChallengeResponses,
      })
    )

    if (challengeResponse.AuthenticationResult?.AccessToken) {
      return {
        accessToken: challengeResponse.AuthenticationResult.AccessToken,
        refreshToken: challengeResponse.AuthenticationResult.RefreshToken,
      }
    }

    return {
      challengeName: challengeResponse.ChallengeName,
      challengeParameters: challengeResponse.ChallengeParameters,
      session: challengeResponse.Session,
      poolId: (await userPoolConfiguration).userPoolId,
    } as ChallengeResponse & { poolId: string }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "RespondToAuthChallenge")
  }
}

async function signUp({
  email,
  password,
  language,
  returnUrl,
}: schemas.RegisterRequest): Promise<
  { codeDeliveredTo: string | null } | { confirmed: boolean }
> {
  try {
    const userLanguage = language || "fi"
    const userReturnUrl = returnUrl || ""
    const { userPoolId, userPoolClientId } = await userPoolConfiguration
    const signUpResponse = await cognitoClient.send(
      new SignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
        SecretHash: await generateSecretHash(
          userPoolId,
          userPoolClientId,
          email
        ),
        ClientMetadata: {
          language: userLanguage as string,
          returnUrl: encodeURIComponent(userReturnUrl),
          serverMetadata: encodeAndSignServerMetadata(
            { frontendOrigin: process.env.SERVICE_HOST },
            (await getSecret(
              "Profile_Management_Server_Metadata_readonly_key"
            )) ?? ""
          ),
        },
      })
    )

    const cognitoUsername = await getUserNameByEmail(email)
    await db.task((t) =>
      upsertPasswordSetDate(t, cognitoUsername, userLanguage)
    )

    if (signUpResponse.CodeDeliveryDetails) {
      return {
        codeDeliveredTo: signUpResponse.CodeDeliveryDetails.Destination ?? null,
      }
    }

    return {
      confirmed: Boolean(signUpResponse.UserConfirmed),
    }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "SignUp")
  }
}

async function signUpResendConfirm({
  email,
  language,
}: schemas.ResendSignUpConfirmRequest): Promise<{
  codeDeliveredTo: string | null
}> {
  const { userPoolId, userPoolClientId } = await userPoolConfiguration
  const resendResponse = await cognitoClient.send(
    new ResendConfirmationCodeCommand({
      ClientId: userPoolClientId,
      SecretHash: await generateSecretHash(userPoolId, userPoolClientId, email),
      Username: email,
      ClientMetadata: {
        language: language ?? "fi",
        serverMetadata: encodeAndSignServerMetadata(
          { frontendOrigin: process.env.SERVICE_HOST },
          (await getSecret(
            "Profile_Management_Server_Metadata_readonly_key"
          )) ?? ""
        ),
      },
    })
  )

  return {
    codeDeliveredTo: resendResponse.CodeDeliveryDetails?.Destination ?? null,
  }
}

async function signUpConfirm({
  email,
  confirmationCode,
  language,
}: schemas.ConfirmSignUpRequest): Promise<{
  success: boolean
}> {
  try {
    const { userPoolId, userPoolClientId } = await userPoolConfiguration
    await cognitoClient.send(
      new ConfirmSignUpCommand({
        ClientId: userPoolClientId,
        SecretHash: await generateSecretHash(
          userPoolId,
          userPoolClientId,
          email
        ),
        Username: email,
        ConfirmationCode: confirmationCode,
        ClientMetadata: {
          language: language ?? "fi",
          serverMetadata: encodeAndSignServerMetadata(
            { frontendOrigin: process.env.SERVICE_HOST },
            (await getSecret(
              "Profile_Management_Server_Metadata_readonly_key"
            )) ?? ""
          ),
        },
      })
    )

    return {
      success: true,
    }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "SignUpConfirm")
  }
}

async function forgotPassword({
  email,
  language,
}: schemas.ForgotRequest): Promise<{
  codeDeliveredTo: string | null
}> {
  try {
    const { userPoolId, userPoolClientId } = await userPoolConfiguration
    const forgotPasswordResponse = await cognitoClient.send(
      new ForgotPasswordCommand({
        ClientId: userPoolClientId,
        SecretHash: await generateSecretHash(
          userPoolId,
          userPoolClientId,
          email
        ),
        Username: email,
        ClientMetadata: {
          language: language ?? "fi",
          serverMetadata: encodeAndSignServerMetadata(
            { frontendOrigin: process.env.SERVICE_HOST },
            (await getSecret(
              "Profile_Management_Server_Metadata_readonly_key"
            )) ?? ""
          ),
        },
      })
    )

    return {
      codeDeliveredTo:
        forgotPasswordResponse.CodeDeliveryDetails?.Destination ?? null,
    }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "ForgotPassword")
  }
}

async function resetPassword({
  email,
  password,
  token,
  notificationLanguage,
}: schemas.ForgotResetRequest): Promise<{
  success: boolean
}> {
  try {
    const { userPoolId, userPoolClientId } = await userPoolConfiguration
    await cognitoClient.send(
      new ConfirmForgotPasswordCommand({
        ClientId: userPoolClientId,
        SecretHash: await generateSecretHash(
          userPoolId,
          userPoolClientId,
          email
        ),
        Username: email,
        ConfirmationCode: token,
        Password: password,
      })
    )

    const cognitoUsername = await getUserNameByEmail(email)
    const userLanguage = notificationLanguage || "fi"
    await db.task((t) =>
      upsertPasswordSetDate(t, cognitoUsername, userLanguage)
    )

    return {
      success: true,
    }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "ResetPassword")
  }
}

async function getUserPasswordExpirationDate(username: UUID): Promise<string> {
  const passwordValidDays = Number(config.user_pwd_expiry_days)
  const passwordSetInfo = await db.task((t) =>
    selectUserPasswordChangeInfo(t, username as UUID)
  )
  if (passwordSetInfo) {
    const passwordValidUntil = passwordSetInfo.setTime
    passwordValidUntil.setDate(passwordValidUntil.getDate() + passwordValidDays)
    return getShortDate(passwordValidUntil)
  } else return "n/a"
}

type UserResponse = {
  authTime: number
  email: string
  passwordExpirationDate: string
}

async function getUserProfile(user: RequestCognitoUser): Promise<UserResponse> {
  const userData = await user.getUser()
  const passwordExpirationDate = await getUserPasswordExpirationDate(
    userData.Username as UUID
  )
  return {
    authTime: user.authTime,
    email:
      userData.UserAttributes?.find(({ Name }) => Name === "email")?.Value ??
      "unknown",
    passwordExpirationDate,
  }
}

async function changePassword(
  token: string,
  {
    oldPassword,
    newPassword,
    notificationLanguage,
  }: schemas.ChangePasswordRequest
): Promise<{ success: boolean; passwordExpirationDate: string }> {
  try {
    await cognitoClient.send(
      new ChangePasswordCommand({
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
        AccessToken: token,
      })
    )

    const user = await cognitoClient.send(
      new GetUserCommand({ AccessToken: token })
    )

    const username = user.Username as UUID
    await db.task((t) =>
      upsertPasswordSetDate(t, username, notificationLanguage || "fi")
    )

    return {
      success: true,
      passwordExpirationDate: calcPasswordValidUntil(new Date()),
    }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "ChangePassword")
  }
}

async function expiredPasswordsForceReset(): Promise<void> {
  const passwordValidDays = Number(config.user_pwd_expiry_days)
  const users = await db.task((t) =>
    selectUsersWithPasswordUnchangedSince(t, passwordValidDays)
  )

  // perform reset for users in CONFIRMED state only
  const userStatuses = await Promise.all(
    users.map(async (user) => getUserStatus(user.username))
  )
  const confirmedUsers = users.filter((_, i) => userStatuses[i] === "CONFIRMED")

  await Promise.allSettled(
    confirmedUsers.map(async (user) =>
      cognitoClient.send(
        new AdminResetUserPasswordCommand({
          UserPoolId: (await userPoolConfiguration).userPoolId,
          Username: user.username as UUID,
          ClientMetadata: {
            customEvent: "CustomMessage_PasswordExpiry",
            language: user.notificationLanguage,
            serverMetadata: encodeAndSignServerMetadata(
              { frontendOrigin: process.env.SERVICE_HOST },
              (await getSecret(
                "Profile_Management_Server_Metadata_readonly_key"
              )) ?? ""
            ),
          },
        })
      )
    )
  ).catch((err) => {
    auditLogger.error(err)
  })
}

async function clearObsoletePasswordChangeInfo(): Promise<void> {
  const passwordChangeInfo = await db.task((t) => selectPasswordChangeInfo(t))
  const users = await getAllUsers()
  const deletedUsers = passwordChangeInfo
    .filter((info) => !users.find((user) => user.Username === info.username))
    .map((info) => info.username)
  await db.task((t) => deletePasswordSetDates(t, deletedUsers))
}

async function changeEmail({
  email,
  newEmail,
  language,
}: schemas.ChangeEmailRequest): Promise<{ success: boolean }> {
  try {
    const messageKey = "CustomMessage_InitiateEmailChange" as CustomMessage
    const userLanguage = language as Language
    const translation =
      (language && translations[messageKey]?.[userLanguage]) ??
      translations[messageKey]?.fi ??
      translations[messageKey]?.sv ??
      translations[messageKey]?.en
    if (!translation)
      throw new Error(
        `Unable to find translations for ${messageKey} in lang: ${userLanguage}`
      )

    const payload = {
      email,
      newEmail,
    }
    const jwk = JSON.parse(
      (await getSecret("Profile_Management_Oauth_JWK")) ?? "{}"
    )
    const token = jwt.sign(payload, jwkToPem(jwk, { private: true }), {
      // create a JWT token that expires in 24h for verification purposes
      algorithm: jwk.alg ?? "RS256",
      keyid: jwk.kid,
      expiresIn: config.email_verify_token_validity,
    })

    const url =
      config.service_host +
      (userLanguage !== "fi" ? `/${userLanguage}` : "") +
      `/settings/change-email/verify/${token}`
    const message = translation.message.replace("{{url}}", url)
    await sesClient.send(
      new SendEmailCommand(
        generateEmailParams([newEmail], message, translation.subject)
      )
    )
    return {
      success: true,
    }
  } catch (e) {
    auditLogger.error(e)
    throw e
  }
}

async function changeEmailVerify({
  token,
}: schemas.VerifyEmailChangeRequest): Promise<{ success: boolean }> {
  try {
    // verify provided token
    const { email, newEmail } = await verifyEmailChangeToken(token)

    // check if the user already verified the change or the email was occupied in the meantime
    if (!(await emailAvailable({ email: newEmail }))) {
      throw new UnauthorizedError("Email has already been verified")
    }

    // throw if current email is available (=user submitted parallel requests with different emails)
    if (await emailAvailable({ email })) {
      throw new UnauthorizedError("Current email is no longer valid")
    }

    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: (await userPoolConfiguration).userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: "email",
            Value: newEmail,
          },
          {
            Name: "email_verified",
            Value: "true",
          },
        ],
      })
    )
    return {
      success: true,
    }
  } catch (e) {
    throw wrapCognitoError(e as CognitoError, "ChangeEmailVerify")
  }
}

async function verifyEmailChangeToken(
  token: string
): Promise<{ newEmail: EmailAddress; email: EmailAddress }> {
  try {
    const jwk = JSON.parse(
      (await getSecret("Profile_Management_Oauth_JWK")) ?? "{}"
    )
    const { email, newEmail } = jwt.verify(
      token,
      jwkToPem(jwk, { private: true }),
      {
        algorithms: [jwk.alg, "RS256"],
      }
    ) as jwt.JwtPayload
    return { email, newEmail }
  } catch (e) {
    throw new ValidationError("Invalid token")
  }
}

const globalAllowedRedirectUris: string[] =
  config.profile_management_global_allowed_redirect_uris
    ? [config.profile_management_global_allowed_redirect_uris]
    : []

async function validateAuthorizationRequest(
  clientId: UUID,
  requestedScopes: string[],
  requestedRedirectUri?: string
) {
  const client = await auroraAIServiceController.getOauthClient(clientId)

  if (!client || !client.defaultRedirectUri || !client.oauthClientSecret) {
    throw new NotFoundError("Client not found", {
      code: "invalid_request",
      context: "Oauth",
    })
  }

  if (
    requestedScopes.some(
      (scope) => scope !== "openid" && !client.allowedScopes.includes(scope)
    )
  ) {
    throw new UnauthorizedError("Unauthorized scope included", {
      code: "invalid_scope",
      context: "Oauth",
    })
  }

  const redirectUri = requestedRedirectUri ?? client.defaultRedirectUri

  if (
    ![...client.allowedRedirectUris, ...globalAllowedRedirectUris].includes(
      redirectUri
    )
  ) {
    throw new UnauthorizedError("Redirect URI is not allowed", {
      code: "invalid_request",
      context: "Oauth",
    })
  }

  return { client, redirectUri }
}

async function initOauthAuthorization(
  username: UUID,
  authTime: number,
  request: schemas.InitOauthAuthorization
): Promise<
  | {
      code: string
      redirectUri: string
    }
  | {
      client: {
        id: UUID
        name: {
          fi: string
          sv: string
          en: string
        }
      }
      redirectUri: string
      sources: Record<string, TranslatableString[] | undefined>
    }
> {
  const { client, redirectUri } = await validateAuthorizationRequest(
    request.clientId,
    request.scopes,
    request.redirectUri ?? undefined
  )

  if (!request.consentRequired) {
    const grantedScopes = await oauthController.getGrantedScopes(
      username,
      client.id
    )

    if (request.scopes.every((scope) => grantedScopes.includes(scope))) {
      return {
        code: await oauthController.createAuthorizationCode(
          client.id,
          username,
          redirectUri,
          request.scopes,
          authTime
        ),
        redirectUri,
      }
    }
  }

  const sources = await attributeController.getAttributeSources(
    username,
    request.scopes
  )

  const sourceIds = Object.values(sources)
    .flat()
    .filter((source): source is UUID => source !== null)

  const sourceNames: Record<string, TranslatableString> =
    sourceIds.length > 0
      ? await auroraAIServiceController.getServiceNames(
          removeDuplicates(sourceIds)
        )
      : {}

  return {
    client: {
      id: client.id,
      name: client.name,
    },
    redirectUri,
    sources: Object.fromEntries(
      Object.entries(sources).map(([attr, sourceList]) => [
        attr,
        sourceList?.map((sourceId) => sourceNames[sourceId]),
      ])
    ),
  }
}

async function oauthAuthorize(
  request: schemas.OauthAuthorize,
  username: UUID,
  authTime: number
): Promise<{
  code: string
}> {
  const { client, redirectUri } = await validateAuthorizationRequest(
    request.clientId,
    request.scopes,
    request.redirectUri ?? undefined
  )

  const scopes = request.scopes

  ensureOpenIDScope(scopes)

  return {
    code: await oauthController.createAuthorizationCode(
      client.id,
      username,
      redirectUri,
      scopes,
      authTime
    ),
  }
}

async function authWithRefreshToken(
  refreshToken: string,
  username: string
): Promise<{
  accessToken: string
  refreshToken: string | undefined
} | null> {
  try {
    const { userPoolId, userPoolClientId } = await userPoolConfiguration
    const initAuthResponse = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: await generateSecretHash(
            userPoolId,
            userPoolClientId,
            username
          ),
        },
        ClientId: userPoolClientId,
      })
    )

    const authResult = initAuthResponse.AuthenticationResult

    return authResult && authResult.AccessToken
      ? {
          accessToken: authResult.AccessToken,
          refreshToken: authResult.RefreshToken,
        }
      : null
  } catch (e) {
    auditLogger.error(e)
    return null
  }
}

async function oauthDeactivate(
  request: schemas.OauthDeactivate,
  username: UUID
): Promise<void> {
  await oauthController.removeAuthorizationCodes(
    username,
    request.auroraAIServiceId
  )

  await oauthController.removeTokenPairsByUserAndService(
    username,
    request.auroraAIServiceId
  )

  await attributeController.removeAttributeSourcesByServiceId(
    username,
    request.auroraAIServiceId
  )
  await auroraAIServiceController.requestServiceToDeleteAttributes(
    username,
    request.auroraAIServiceId,
    true
  )
}

async function getServicesBlockingDeletion(username: UUID): Promise<{
  retrievable: {
    fi: string
    sv: string
    en: string
  }[]
  storable: {
    name: TranslatableString
    link: TranslatableString
  }[]
}> {
  const [authenticatedServices, connectedServices] = await db.task((t) =>
    Promise.all([
      oauthController.getAuthorizedServices(username),
      selectAttributeSourceServicesByUsername(t, username),
    ])
  )

  const authenticatedServiceIds = authenticatedServices.map(({ id }) => id)
  const connectedServiceIds = connectedServices.map(({ id }) => id)

  const allServiceIds = removeDuplicates([
    ...authenticatedServiceIds,
    ...connectedServiceIds,
  ])

  const serviceInfo: Record<
    string,
    { name: TranslatableString; link: TranslatableString }
  > =
    allServiceIds.length > 0
      ? await auroraAIServiceController.getServiceNamesAndLinks(allServiceIds)
      : {}

  return {
    retrievable: removeDuplicates(authenticatedServiceIds).map(
      (id) => serviceInfo[id].name
    ),
    storable: removeDuplicates(connectedServiceIds).map(
      (id) => serviceInfo[id]
    ),
  }
}

async function deactivateAllServices(username: UUID): Promise<void> {
  await oauthController.removeAllAuthorizationCodesForUser(username)
  await oauthController.removeAllTokenPairsForUser(username)
}

async function deleteUser(
  token: string,
  username: UUID
): Promise<{ success: boolean }> {
  const [authenticatedServices, connectedServices] = await db.task((t) =>
    Promise.all([
      oauthController.getAuthorizedServices(username),
      selectAttributeSourceServicesByUsername(t, username),
    ])
  )

  const userServices = removeDuplicates(
    [...authenticatedServices, ...connectedServices],
    "id"
  )

  for (const { id } of userServices) {
    await attributeController.removeAttributeSourcesByServiceId(username, id)
    await auroraAIServiceController.requestServiceToDeleteAttributes(
      username,
      id,
      true
    )
  }

  await db.task((t) => deletePasswordSetDates(t, [username]))

  await cognitoClient.send(
    new DeleteUserCommand({
      AccessToken: token,
    })
  )

  return {
    success: true,
  }
}

async function removeService(
  request: schemas.RemoveService,
  username: UUID
): Promise<void> {
  await attributeController.removeAttributeSourcesByServiceId(
    username,
    request.auroraAIServiceId
  )
  await auroraAIServiceController.requestServiceToDeleteAttributes(
    username,
    request.auroraAIServiceId,
    true
  )
}

async function requestScopeChange(
  username: UUID,
  body: ScopeChangeRequest
): Promise<void> {
  const { serviceId, scopes } = body
  const existingTokenPairs = (await oauthController.getUserTokensByServiceId(
    username,
    serviceId
  )) as TokenPair[]

  const tokens = await oauthController.replaceUserTokens(
    username,
    serviceId,
    scopes
  )

  await auroraAIServiceController
    .replaceTokens(username, serviceId, tokens)
    .catch(async (err) => {
      // if call to service fails, restore original token pairs to DB
      technicalLogger.error(err)
      await oauthController.removeTokenPairsByUserAndService(
        username,
        serviceId
      )
      await oauthController.restoreUserTokenPairs(existingTokenPairs)
      throw err
    })

  // handle deleted scopes
  const currentScopes: Scope[] = [
    ...new Set(
      existingTokenPairs.map((tokenPair) => tokenPair.accessTokenScopes).flat()
    ),
  ]

  const removedScopes: Scope[] = currentScopes.filter(
    (scope) => !scopes.includes(scope)
  )

  if (removedScopes.length) {
    const removedAttributes = removedScopes.map((scope) => {
      const prefixSplit = scope.split(":")
      return prefixSplit[1] || prefixSplit[0]
    })
    await attributeController.removeAttributeSources(
      username,
      serviceId,
      removedAttributes
    )
  }
}

export function getTokenNames(): { access: string; refresh: string } {
  return {
    access: "access",
    refresh: "refresh",
  }
}

export function getCookieName(): string {
  const env = process.env.ENVIRONMENT
  const envPostfix = env === "prod" ? "" : `-${env}`
  const cookieName = `${config.profile_management_cookie_name}${envPostfix}`

  return cookieName
}

export async function setAuthTokens(
  req: Request,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  req.session.access = createAndDecodeTokenObjectFromString(accessToken)

  if (refreshToken) {
    req.session.refresh = createAndDecodeTokenObjectFromString(refreshToken)
  }

  await req.session.save()
}

export function destroySession(req: Request): void {
  req.session.destroy()
}

/**
 * "Server metadata" is data transferred via the
 * clientMetadata property in Cognito commands.
 * While all requests go through our servers, it's
 * technically possible for a 3rd party to use
 * the public Cognito API with our user pool ID. By
 * adding HMAC we can transfer data from our server
 * to the email customization Lambda which it can
 * trust in (e.g., the frontend origin).
 *
 * The user pool ID cannot be considered a secret
 * because it is used client-side in generating SRP
 * signatures and the pool ID is included in all
 * Cognito emails' headers.
 */
function encodeAndSignServerMetadata(
  metadata: { frontendOrigin?: string },
  key: string
) {
  const data = JSON.stringify(metadata)

  return JSON.stringify({
    hmac: createHmac("sha1", Buffer.from(key)).update(data).digest("hex"),
    data,
  })
}
