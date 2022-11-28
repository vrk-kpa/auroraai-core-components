import { StatusCodes } from "http-status-codes"
import { ApiErrorBody } from "./types/Errors"

export abstract class ApiError extends Error {
  public body: ApiErrorBody
  public abstract httpStatus: number

  protected constructor(public message: string) {
    super(message)
    this.body = { error: "ValidationError", message }
  }
}

export class ValidationError extends ApiError {
  httpStatus = StatusCodes.BAD_REQUEST
  constructor(public message: string) {
    super(message)
    this.body.error = "ValidationError"
  }
}

export class NotFoundError extends ApiError {
  httpStatus = StatusCodes.NOT_FOUND
  constructor(public message: string) {
    super(message)
    this.body.error = "NotFoundError"
  }
}

export class UnauthorizedError extends ApiError {
  httpStatus = StatusCodes.UNAUTHORIZED
  constructor(public message: string) {
    super(message)
    this.body.error = "UnauthorizedError"
  }
}

export class ForbiddenError extends ApiError {
  httpStatus = StatusCodes.FORBIDDEN
  constructor(public message: string) {
    super(message)
    this.body.error = "ForbiddenError"
  }
}

export class TooManyRequestsError extends ApiError {
  httpStatus = StatusCodes.TOO_MANY_REQUESTS
  constructor(public message: string) {
    super(message)
    this.body.error = "TooManyRequestsError"
  }
}

export class InternalServerError extends ApiError {
  httpStatus = StatusCodes.INTERNAL_SERVER_ERROR
  constructor(public message: string) {
    super(message)
    this.body.error = "InternalServerError"
  }
}
