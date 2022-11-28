import cookie from "cookie" // to parse Cookie headers
import { GetServerSidePropsContext, NextPageContext } from "next"
import { ServerResponse } from "http"

export const parseCookieValue = (
  cookieName: string,
  cookieHeader: string
): string | undefined => cookie.parse(cookieHeader)[cookieName]

export const setCookiesServerSide = (
  ctx: NextPageContext,
  headerValues: string[]
): void =>
  headerValues.forEach((it) => appendToHeader(ctx.res, "set-cookie", it))

export const getCookieServerSide = (
  name: string,
  ctx: NextPageContext
): string | undefined =>
  ctx.req ? parseCookieValue(name, ctx.req.headers.cookie ?? "") : undefined

export const removeCookie = (
  name: string,
  ctx: GetServerSidePropsContext
): void => {
  const secure = name.startsWith("__Host") ? "Secure;" : ""
  const expires = `Expires=${new Date(0).toUTCString()};`
  const newValue = `${name}=;Path=/;HttpOnly;${expires}${secure}`

  appendToHeader(ctx.res, "set-cookie", newValue)
}

const appendToHeader = (
  res: ServerResponse | undefined,
  headerName: string,
  headerValue: string
) => {
  const oldHeaderValue = res?.getHeader(headerName)
  if (oldHeaderValue === undefined || typeof oldHeaderValue === "number") {
    res?.setHeader(headerName, [headerValue])
  } else if (!Array.isArray(oldHeaderValue)) {
    res?.setHeader(headerName, [oldHeaderValue, headerValue])
  } else {
    res?.setHeader(headerName, [...oldHeaderValue, headerValue])
  }
}
