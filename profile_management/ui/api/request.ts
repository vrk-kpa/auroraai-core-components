import { NextPageContext } from "next"
import { setCookiesServerSide } from "../utils/cookie"
import { StatusCodes } from "http-status-codes"

import axios, { AxiosError, AxiosResponse, Method } from "axios"
import { isRight } from "fp-ts/Either"
import { APIError } from "../utils/errors"
import * as errorSchemas from "shared/schemas/types/Errors"

/**
 * Returns extra headers based on the current environment.
 * For SSR, get cookies from browser request.
 * For browsers, the x-csrf-token header is added to make CSRF work.
 * With SSR the internal API is called directly (which doesn't validate
 * CSRF) which is why SSR requests don't include this header.
 */
const getExtraHeaders = (ctx?: NextPageContext): Record<string, string> => {
  if (typeof window === "undefined") {
    const cookie = ctx?.req?.headers.cookie
    return cookie ? { cookie } : {}
  } else {
    return {
      "x-csrf-token": (window as { csrfToken?: string }).csrfToken ?? "",
    }
  }
}

type RequestOptions = {
  params?: Record<string, string>
  headers?: Record<string, string>
  body?: string
}

type ApiErrorHandler = (error: APIError) => APIError

export const getHttpClient =
  (endpoint: string, errorHandlerFn: ApiErrorHandler, ctx?: NextPageContext) =>
  <T = null>(
    method: Method,
    url: string,
    options: RequestOptions = {}
  ): Promise<T | APIError> => {
    if (options.body) {
      options.headers = {
        "content-type": "application/json",
        ...options.headers,
      }
    }
    return axios
      .request({
        method,
        url: `${endpoint}${url}`,
        params: options.params,
        headers: {
          ...options.headers,
          ...getExtraHeaders(ctx),
        },
        data: options.body,
        responseType: "json",
      })
      .then(processResponse(ctx))
      .catch((error) => errorHandlerFn(handleAxiosError(error)))
  }

const handleAxiosError = (axiosError: AxiosError): APIError => {
  console.error(axiosError.toJSON())

  const response = axiosError.response as AxiosResponse | undefined

  if (isRight(errorSchemas.ApiErrorBody.decode(response?.data))) {
    return {
      httpStatus: response?.status,
      ...(response?.data as errorSchemas.ApiErrorBody),
    }
  }

  return {
    httpStatus: StatusCodes.INTERNAL_SERVER_ERROR,
    message: "Request failed.",
    error: "InternalServerError",
  }
}

const processResponse = (ctx?: NextPageContext) => (res: AxiosResponse) => {
  if (ctx?.res) {
    setCookiesServerSide(ctx, res.headers["set-cookie"] ?? [])
  }

  if (res.status === StatusCodes.NO_CONTENT) {
    return null
  }

  return res.data
}
