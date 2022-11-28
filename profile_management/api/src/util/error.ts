import { ErrorRequestHandler } from "express"
import { StatusCodes } from "http-status-codes"
import { auditLogger } from "./logger"
import { CognitoError } from "shared/cognito-types"
import {
  ApiError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from "./errors/ApiErrors"
import { OauthError } from "./errors/OauthErrors"
import { OauthBearerError } from "./errors/OauthBearerErrors"
import {
  ApiErrorCognitoCode,
  ApiErrorDetails,
  CognitoErrorContext,
} from "shared/schemas/types/Errors"

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  auditLogger.error(error)

  if (error instanceof ApiError || error instanceof OauthError) {
    res.status(error.httpStatus)
    res.json(error.body)
  } else if (error instanceof OauthBearerError) {
    res.header(
      "WWW-Authenticate",
      `Bearer error="${error.oauthError}"${
        error.description ? `, error_description="${error.description}"` : ""
      }`
    )
    res.sendStatus(error.httpStatus)
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR)
    res.json({ error: "InternalServerError" })
  }
}

export const stringifyError = (error: unknown): string =>
  JSON.stringify(error, Object.getOwnPropertyNames(error))

export const wrapCognitoError = <T extends CognitoError>(
  error: T,
  context: CognitoErrorContext
): T | ApiError => {
  if (!isCognitoError(error)) {
    return error
  }

  if (
    error.name === "NotAuthorizedException" &&
    error.message === "Password attempts exceeded"
  ) {
    return new TooManyRequestsError("Exhausted password attempts", {
      code: "PasswordAttemptsExhaustedException",
      context,
    })
  }

  switch (error.name) {
    case "PasswordResetRequiredException":
      return cognitoErrorToApiError(
        error.name,
        error.message,
        context,
        ForbiddenError
      )

    case "LimitExceededException":
    case "TooManyRequestsException":
      return cognitoErrorToApiError(
        error.name,
        error.message,
        context,
        TooManyRequestsError
      )

    case "NotAuthorizedException":
      return cognitoErrorToApiError(
        context === "ChangePassword" ? "WrongPasswordException" : error.name,
        error.message,
        context,
        UnauthorizedError
      )

    case "UserNotConfirmedException":
      return cognitoErrorToApiError(
        error.name,
        error.message,
        context,
        UnauthorizedError
      )

    case "UserNotFoundException":
      switch (context) {
        case "InitiateAuth":
          return cognitoErrorToApiError(
            "NotAuthorizedException",
            error.message,
            context,
            UnauthorizedError
          )
        case "SignUp":
          return new InternalServerError(
            "Unexpected: user not found error in signup."
          )
        default:
          return cognitoErrorToApiError(
            error.name,
            error.message,
            context,
            NotFoundError
          )
      }

    case "AliasExistsException":
      return cognitoErrorToApiError(
        context === "SignUpConfirm"
          ? "EmailAlreadyVerifiedException"
          : error.name,
        error.message,
        context,
        ValidationError
      )

    case "InvalidPasswordException":
    case "UsernameExistsException":
    case "CodeMismatchException":
    case "ExpiredCodeException":
    case "InvalidParameterException":
      return cognitoErrorToApiError(
        error.name,
        error.message,
        context,
        ValidationError
      )

    default:
      return error
  }
}

const isCognitoError = <T extends CognitoError>(error: T) =>
  typeof error === "object" && error && "name" in error && "message" in error

type TargetErrorType = new (
  message: string,
  details?: ApiErrorDetails
) => ApiError

const cognitoErrorToApiError = (
  code: ApiErrorCognitoCode,
  message: string | undefined,
  context: CognitoErrorContext,
  TargetError: TargetErrorType = ValidationError
): ApiError =>
  new TargetError(message ?? "Cognito error", {
    code,
    context,
  })
