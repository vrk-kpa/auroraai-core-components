import { StatusCodes } from "http-status-codes"
import { OauthErrorBody } from "shared/schemas/types/Errors"

export abstract class OauthError extends Error {
  public body: OauthErrorBody
  public abstract httpStatus: number

  protected constructor(
    public message: string,
    error_description?: string,
    error_uri?: string
  ) {
    super(message)
    this.body = {
      error: "invalid_request",
      error_description,
      error_uri,
    }
  }
}

export class UnauthorizedClientOauthError extends OauthError {
  httpStatus = StatusCodes.FORBIDDEN

  constructor(
    public message: string,
    error_description?: string,
    error_uri?: string
  ) {
    super(message, error_description, error_uri)
    this.body.error = "unauthorized_client"
  }
}

export class InvalidClientOauthError extends OauthError {
  httpStatus = StatusCodes.BAD_REQUEST

  constructor(
    public message: string,
    error_description?: string,
    error_uri?: string
  ) {
    super(message, error_description, error_uri)
    this.body.error = "invalid_client"
  }
}

export class InvalidGrantOauthError extends OauthError {
  httpStatus = StatusCodes.BAD_REQUEST

  constructor(
    public message: string,
    error_description?: string,
    error_uri?: string
  ) {
    super(message, error_description, error_uri)
    this.body.error = "invalid_grant"
  }
}

export class InvalidRequestOauthError extends OauthError {
  httpStatus = StatusCodes.BAD_REQUEST

  constructor(
    public message: string,
    error_description?: string,
    error_uri?: string
  ) {
    super(message, error_description, error_uri)
    this.body.error = "invalid_request"
  }
}

export class InvalidScopeOauthError extends OauthError {
  httpStatus = StatusCodes.BAD_REQUEST

  constructor(
    public message: string,
    error_description?: string,
    error_uri?: string
  ) {
    super(message, error_description, error_uri)
    this.body.error = "invalid_scope"
  }
}
