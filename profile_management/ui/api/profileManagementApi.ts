import { NextPageContext } from "next"
import getConfig from "next/config"
import { StatusCodes } from "http-status-codes"

import { redirect } from "../utils/redirect"
import { ChallengeResponse } from "shared/cognito-types"
import * as schemas from "shared/schemas"
import { RedirectURI, TranslatableString } from "shared/schemas"
import { getHttpClient } from "./request"
import { APIError } from "../utils/errors"
import { Config } from "../schemas"

const { serverRuntimeConfig } = getConfig()

const userEndpoint =
  typeof window === "undefined"
    ? `${
        serverRuntimeConfig.config.profile_management_api_url ??
        "http://profile-management-api"
      }/v1/user` // undefined window = SSR, use internal host
    : "/api"

const configEndpoint =
  typeof window === "undefined"
    ? `${
        serverRuntimeConfig.config.profile_management_api_url ??
        "http://profile-management-api"
      }/config` // undefined window = SSR, use internal host
    : "/api/config"

const getAuthenticatedRoutes = (
  ctx?: NextPageContext,
  logoutOnError?: boolean
) => {
  const handleApiError = (error: APIError) =>
    processAPIError(error, ctx, logoutOnError)

  const request = getHttpClient(userEndpoint, handleApiError, ctx)

  return {
    getUser: () => request<User>("GET", "/me"),
    getConnectedServices: () =>
      request<schemas.ConnectedService[]>("GET", "/services"),

    changePassword: (data: schemas.ChangePasswordRequest) =>
      request<{ success: true; passwordExpirationDate: string }>(
        "POST",
        "/change_password",
        {
          body: JSON.stringify(data),
        }
      ),

    changeEmail: (data: schemas.ChangeEmailRequest) =>
      request<{ codeDeliveredTo: string | null }>("POST", "/change_email", {
        body: JSON.stringify(data),
      }),

    changeScopes: (data: schemas.ScopeChangeRequest) =>
      request<{ success: string | null }>("POST", "/scope_change_request", {
        body: JSON.stringify(data),
      }),

    verifyEmailChange: (data: schemas.VerifyEmailChangeRequest) =>
      request<{ success: true }>("POST", "/change_email_verify", {
        body: JSON.stringify(data),
      }),

    getServicesBlockingDeletion: () => {
      type BlockingServicesResponseType = {
        retrievable: TranslatableString[]
        storable: { link: TranslatableString; name: TranslatableString }[]
      }
      return request<BlockingServicesResponseType>(
        "GET",
        "/services_blocking_deletion"
      )
    },

    deactivateAllServices: () => request("POST", "/deactivate_all_services"),

    deleteUser: () => request<{ success: true }>("DELETE", "/me"),
  }
}

export interface User {
  authTime: number
  email: string
  passwordExpirationDate: string
}

export type AuthResponse = (ChallengeResponse & { poolId: string }) | null

const getAnonymousRoutes = (ctx?: NextPageContext, logoutOnError?: boolean) => {
  const handleApiError = (error: APIError) => {
    return logoutOnError ? processAPIError(error, ctx, logoutOnError) : error
  }
  const request = getHttpClient(userEndpoint, handleApiError, ctx)
  const configRequest = getHttpClient(configEndpoint, handleApiError, ctx)

  return {
    initiateAuth: (data: schemas.InitiateAuthRequest) =>
      request<AuthResponse>("POST", "/initiate_auth", {
        body: JSON.stringify(data),
      }),

    respondToAuthChallenge: (data: schemas.RespondToAuthChallengeRequest) =>
      request<AuthResponse>("POST", "/respond_to_auth_challenge", {
        body: JSON.stringify(data),
      }),

    signUp: (data: schemas.RegisterRequest) => {
      type SignupResponseType =
        | { codeDeliveredTo: string | null }
        | { confirmed: boolean }

      return request<SignupResponseType>("POST", "/sign_up", {
        body: JSON.stringify(data),
      })
    },

    checkEmailAvailability: (email: string) =>
      request<boolean>("GET", "/email_available", {
        params: { email },
      }),

    confirmSignUp: (data: schemas.ConfirmSignUpRequest) =>
      request<{ success: true }>("POST", "/sign_up_confirm", {
        body: JSON.stringify(data),
      }),

    resendConfirmSignUp: (data: schemas.ResendSignUpConfirmRequest) =>
      request<{ codeDeliveredTo: string | null }>(
        "POST",
        "/sign_up_resend_confirm",
        { body: JSON.stringify(data) }
      ),

    forgotPassword: (data: schemas.ForgotRequest) =>
      request<{ codeDeliveredTo: string | null }>("POST", "/forgot_password", {
        body: JSON.stringify(data),
      }),

    resetPassword: (data: schemas.ForgotResetRequest) =>
      request<{ success: true }>("POST", "/reset_password", {
        body: JSON.stringify(data),
      }),

    initOauthAuthorize: (data: schemas.InitOauthAuthorization) => {
      type InitOauthResponseType =
        | {
            client: { id: string; name: TranslatableString }
            redirectUri: RedirectURI
            sources: Record<string, TranslatableString[]>
          }
        | { code: string; redirectUri: RedirectURI }
      return request<InitOauthResponseType>("POST", "/authorize_init", {
        body: JSON.stringify(data),
      })
    },

    oauthAuthorize: (data: schemas.OauthAuthorize) =>
      request<{ code: string }>("POST", "/authorize", {
        body: JSON.stringify(data),
      }),

    oauthDeactivate: (data: schemas.OauthDeactivate) =>
      request("POST", "/deactivate", {
        body: JSON.stringify(data),
      }),

    getConfig: () => configRequest<Config>("GET", "/"),
  }
}

type AnonymousRoutes = ReturnType<typeof getAnonymousRoutes>
type AuthenticatedRoutes = ReturnType<typeof getAuthenticatedRoutes>

type API<T> = T extends true
  ? AnonymousRoutes & AuthenticatedRoutes
  : AnonymousRoutes

export const profileManagementAPI = <T extends boolean>(
  isLoggedIn: T = false as T,
  ctx: NextPageContext | undefined = undefined,
  logoutOnError = false
): API<T> =>
  ({
    ...getAnonymousRoutes(ctx, logoutOnError),
    ...(isLoggedIn ? getAuthenticatedRoutes(ctx, logoutOnError) : {}),
  } as API<T>)

const processAPIError = (
  apiError: APIError,
  context?: NextPageContext,
  forceLogout?: boolean
): APIError => {
  const status = apiError.httpStatus
  if (forceLogout || status === StatusCodes.UNAUTHORIZED) {
    const logoutParams = new URLSearchParams({
      return: context?.asPath ?? "",
    }).toString()

    redirect(`/logout?${logoutParams}`, context, StatusCodes.TEMPORARY_REDIRECT)
  }

  return apiError
}
