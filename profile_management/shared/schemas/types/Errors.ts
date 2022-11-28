import * as t from "io-ts"
import { AllCognitoErrorNames } from "../../cognito-types"
import { Nullable } from "./Nullable"

export const OauthErrorName = t.keyof({
  unauthorized_client: null,
  invalid_client: null,
  invalid_grant: null,
  invalid_request: null,
  invalid_scope: null,
})
export type OauthErrorName = t.TypeOf<typeof OauthErrorName>

export const OauthErrorBody = t.type({
  error: OauthErrorName,
  error_description: Nullable(t.string),
  error_uri: Nullable(t.string),
})
export type OauthErrorBody = t.TypeOf<typeof OauthErrorBody>


export const ApiErrorName = t.keyof({
  ValidationError: null,
  NotFoundError: null,
  UnauthorizedError: null,
  ForbiddenError: null,
  TooManyRequestsError: null,
  InternalServerError: null,
  BrowserException: null
})
export type ApiErrorName = t.TypeOf<typeof ApiErrorName>

export const CognitoErrorContext = t.keyof({
  ChangeEmail: null,
  ChangeEmailVerify: null,
  ChangePassword: null,
  GetUser: null,
  ForgotPassword: null,
  InitiateAuth: null,
  ResetPassword: null,
  RespondToAuthChallenge: null,
  SignUp: null,
  SignUpConfirm: null,
})
export type CognitoErrorContext = t.TypeOf<typeof CognitoErrorContext>


export const ApiErrorCognitoCode = t.union([
  AllCognitoErrorNames,
  t.literal("PasswordAttemptsExhaustedException"),
  t.literal("EmailAlreadyVerifiedException"),
  t.literal("WrongPasswordException")

])
export type ApiErrorCognitoCode = t.TypeOf<typeof ApiErrorCognitoCode>

export const ApiErrorCognitoDetails = t.type({
  code: ApiErrorCognitoCode,
  context: CognitoErrorContext
})
export type ApiErrorCognitoDetails = t.TypeOf<typeof ApiErrorCognitoDetails>

export const ApiErrorOauthDetails = t.type({
  code: t.union([
    OauthErrorName, 
    t.literal("login_required"),
    t.literal("consent_required")
  ]),
  context: t.literal("Oauth")
})
export type ApiErrorOauthDetails = t.TypeOf<typeof ApiErrorOauthDetails>

export const ApiErrorDetails = t.union([ApiErrorCognitoDetails, ApiErrorOauthDetails])
export type ApiErrorDetails = t.TypeOf<typeof ApiErrorDetails>

export const ApiErrorBody = t.intersection([
  t.partial({
    error_uri: t.string,
    details: ApiErrorDetails
  }),

  t.type({
    error: ApiErrorName,
    message: t.string,
  })
])
export type ApiErrorBody = t.TypeOf<typeof ApiErrorBody>
