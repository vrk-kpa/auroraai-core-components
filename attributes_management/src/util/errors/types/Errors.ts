import * as t from "io-ts"

export const ApiErrorName = t.keyof({
  ValidationError: null,
  NotFoundError: null,
  UnauthorizedError: null,
  ForbiddenError: null,
  TooManyRequestsError: null,
  InternalServerError: null,
  BrowserException: null,
})
export type ApiErrorName = t.TypeOf<typeof ApiErrorName>

export const ApiErrorBody = t.type({
  error: ApiErrorName,
  message: t.string,
})

export type ApiErrorBody = t.TypeOf<typeof ApiErrorBody>
