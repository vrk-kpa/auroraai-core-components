import { RequestHandler, Request, Response, NextFunction } from "express"
import { GetUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider"
import type { ParamsDictionary, Query } from "express-serve-static-core"
import { UUID } from "io-ts-types/UUID"
import { ForbiddenError } from "./errors/ApiErrors"

type CustomHandlerResponse<R> = R | Promise<R>
type CustomRequestHandler<
  ResponseBody = unknown,
  RequestProps = unknown,
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query
> = (
  _req: Request<P, ResBody, ReqBody, ReqQuery> & RequestProps,
  _res: Response,
  _next?: NextFunction
) => CustomHandlerResponse<ResponseBody>

const createRequestHandler =
  <CustomRequestProps>(requiredRequestKeys?: (keyof CustomRequestProps)[]) =>
  <ResBody, ReqBody, ReqQuery>(
    handler: CustomRequestHandler<
      unknown,
      CustomRequestProps,
      ParamsDictionary,
      ResBody,
      ReqBody,
      ReqQuery
    >
  ): RequestHandler<ParamsDictionary, ResBody, ReqBody, ReqQuery> =>
  async (req, res, next) => {
    try {
      if (
        requiredRequestKeys &&
        requiredRequestKeys.some((key) => !(key in req))
      ) {
        throw new ForbiddenError("Request is missing keys")
      }

      const result = await handler(
        req as Request<ParamsDictionary, ResBody, ReqBody, ReqQuery> &
          CustomRequestProps,
        res
      )
      if (result === undefined) {
        res.sendStatus(204)
        return
      } else {
        res.json(result as ResBody)
      }
    } catch (error) {
      if (next) {
        next(error)
      } else {
        throw error
      }
    }
  }

export interface RequestCognitoUser {
  username: UUID
  getUser: () => Promise<GetUserCommandOutput>

  accessToken: string
  refreshToken?: string

  authTime: number
}

export interface AuthenticatedRequest {
  cognitoUser: RequestCognitoUser
}

export interface OauthRequest {
  username: UUID
  scopes: string[]
  clientId: UUID
}

export interface OauthClientRequest {
  clientId: UUID
}

export const handleRequest = createRequestHandler()
export const handleAuthenticatedRequest =
  createRequestHandler<AuthenticatedRequest>(["cognitoUser"])

export const handleOauthRequest = createRequestHandler<OauthRequest>([
  "clientId",
  "scopes",
  "username",
])

export const handleOauthClientRequest =
  createRequestHandler<OauthClientRequest>(["clientId"])
