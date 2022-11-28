import * as t from "io-ts"
import { NonEmptyString } from "io-ts-types/lib/NonEmptyString"
import { Nullable } from "shared/schemas"

export const OauthTokenWithAuthorizationCode = t.type({
  grant_type: t.literal("authorization_code"),
  code: NonEmptyString,
  redirect_uri: Nullable(t.string),
})
export type OauthTokenWithAuthorizationCode = t.TypeOf<
  typeof OauthTokenWithAuthorizationCode
>

export const OauthTokenWithRefreshToken = t.type({
  grant_type: t.literal("refresh_token"),
  refresh_token: NonEmptyString,
  scope: Nullable(t.string),
})
export type OauthTokenWithRefreshToken = t.TypeOf<
  typeof OauthTokenWithRefreshToken
>

export const OauthTokenRevoke = t.type({
  token: NonEmptyString,
})
export type OauthTokenRevoke = t.TypeOf<typeof OauthTokenRevoke>
