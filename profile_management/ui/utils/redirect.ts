import Router from "next/router"
import { Language } from "shared/schemas"
import { locales } from "../i18n"
import { GetServerSidePropsContext, NextPageContext } from "next"

const getLocale = (
  context?: GetServerSidePropsContext | NextPageContext,
  preferredLocale?: Language
) => {
  let locale =
    preferredLocale ??
    context?.locale ??
    (typeof window === "undefined"
      ? undefined
      : window.location.pathname.split("/")[1])

  if (!locale || !locales.includes(locale)) {
    locale = "fi"
  }

  return locale
}

const getLocation = (destination: string, locale: string) =>
  destination.startsWith("/") && (locale !== "fi" || destination === "/")
    ? `${locale ? `/${locale}` : ""}${destination}`
    : destination

export const getLocalisedPath = (
  destination: string,
  context?: GetServerSidePropsContext | NextPageContext,
  preferredLocale?: Language
) => {
  const locale = getLocale(context, preferredLocale)
  return getLocation(destination, locale)
}

export const redirect = (
  destination: string,
  context?: GetServerSidePropsContext | NextPageContext,
  statusCode = 302,
  preferredLocale?: Language
): void => {
  const location = getLocalisedPath(destination, context, preferredLocale)

  if (context?.res) {
    context.res.writeHead(statusCode, { Location: location })
    context.res.end()
  } else {
    Router.replace(location)
  }
}

export const redirectToExternal = (
  destination: string,
  context?: GetServerSidePropsContext | NextPageContext,
  statusCode = 302,
  preferredLocale?: Language
): void => {
  const location = getLocalisedPath(destination, context, preferredLocale)

  if (context?.res) {
    context.res.writeHead(statusCode, { Location: location })
    context.res.end()
  } else {
    window.location.replace(location)
  }
}
