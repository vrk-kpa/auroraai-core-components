export abstract class OauthBearerError extends Error {
  public abstract oauthError: OauthBearerErrorName
  public abstract httpStatus: number

  constructor(public message: string, public description?: string) {
    super(message)
  }
}

type OauthBearerErrorName =
  | "invalid_request"
  | "invalid_token"
  | "insufficient_scope"

export class InvalidRequestOauthBearerError extends OauthBearerError {
  oauthError: OauthBearerErrorName = "invalid_request"
  httpStatus = 400
}

export class InvalidTokenOauthBearerError extends OauthBearerError {
  oauthError: OauthBearerErrorName = "invalid_token"
  httpStatus = 401
}

export class InsufficientScopeOauthBearerError extends OauthBearerError {
  oauthError: OauthBearerErrorName = "insufficient_scope"
  httpStatus = 403
}
