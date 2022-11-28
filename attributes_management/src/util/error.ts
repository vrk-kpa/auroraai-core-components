import { ErrorRequestHandler } from "express"
import { StatusCodes } from "http-status-codes"
import { auditLogger } from "./logger"
import { ApiError } from "./errors/ApiErrors"

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  auditLogger.error(error)

  if (error instanceof ApiError) {
    res.status(error.httpStatus)
    res.json(error.body)
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR)
    res.json({ error: "InternalServerError" })
  }
}

export const stringifyError = (error: unknown): string =>
  JSON.stringify(error, Object.getOwnPropertyNames(error))
