import { NextPageContext } from "next"
import getConfig from "next/config"
import { APIError } from "../utils/errors"
import { getHttpClient } from "../api/request"
import { AttributeLocalisation } from "shared/schemas"

const { serverRuntimeConfig } = getConfig()

const host =
  typeof window === "undefined" // undefined window = SSR, use internal host
    ? `${serverRuntimeConfig.config.attributes_management_url}:${serverRuntimeConfig.config.attributes_management_port}`
    : ""

const endpoint = `${host}/attributes-management/v1/localisation`

const getRoutes = (ctx?: NextPageContext) => {
  const handleApiError = (error: APIError) => error
  const request = getHttpClient(endpoint, handleApiError, ctx)

  return {
    getLocalisation: () => request<AttributeLocalisation>("GET", "/"),
  }
}

export const attributesManagementAPI = (
  ctx: NextPageContext | undefined = undefined
) => ({
  ...getRoutes(ctx),
})