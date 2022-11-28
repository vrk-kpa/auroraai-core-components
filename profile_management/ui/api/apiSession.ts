import { GetServerSidePropsContext, NextPageContext } from "next"
import { profileManagementAPI, User } from "./profileManagementApi"
import { removeCookie } from "../utils/cookie"
import getConfig from "next/config"
import { APIError } from "../utils/errors"

const { serverRuntimeConfig } = getConfig()

export function getTokenNames(): { access: string; refresh: string } {
  return {
    access: "access",
    refresh: "refresh",
  }
}

export function getCookieName(): string {
  const cookieName =
    serverRuntimeConfig.config.profile_management_cookie_name ?? ""

  return cookieName
}

export type Refetchable<T> = T | (Partial<T> & { _needsFetch: true })
export type InitialPropsFunction<T> = (context: NextPageContext) => Promise<T>

/**
 * `withRefetchables` loads initial props server-side when called on
 * `getInitialProps`, and on client-side returns a special flag.
 * This should be used along `useAsyncProps`, which will load the
 * props client-side if the flag is present.
 *
 * This is done so that the FCP is as low as possible, i.e. on initial
 * page load the data-fetching has been done on the server already.
 * Conversely, when navigating between pages in the browser, there's
 * no delay as `getInitialProps` doesn't need to finish. This way it's
 * possible to show a loading state when used with `useAsyncProps`.
 */
export const withRefetchables =
  <T>(initialPropsFn?: InitialPropsFunction<T>) =>
  async (context: NextPageContext): Promise<Refetchable<T>> => {
    if (typeof window === "undefined") {
      return (await initialPropsFn?.(context)) ?? ({} as T)
    }

    return { _needsFetch: true } as Refetchable<T>
  }

// This should be called from server-side only!
export const logout = (context: GetServerSidePropsContext): void => {
  const cookieName = getCookieName()

  removeCookie(cookieName, context)
}

/**
 * This helper function is for just getting the current
 * user's data, as this is a very common use-case. All
 * pages that require logging in should use this as
 * they show the current user in the header. In order to
 * avoid unnecessary data fetching, supplying `initialProps`
 * with `user` from `UserContext` is recommended.
 */
export const getUserProps = async (
  { user }: { user?: User },
  ctx?: NextPageContext
): Promise<{ user: User } | APIError> => {
  const userData =
    user ?? (await profileManagementAPI(true, ctx, true).getUser())

  if ("error" in userData) return userData as APIError
  return { user: userData }
}
