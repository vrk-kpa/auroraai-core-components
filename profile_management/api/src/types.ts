import { withMessage } from "io-ts-types/withMessage"
import * as t from "io-ts"

const ACCESS_TOKEN_PATTERN = /^[0-9a-f]{64}$/i

export interface AccessTokenBrand {
  readonly AccessToken: unique symbol
}

export const AccessToken = withMessage(
  t.brand(
    t.string,
    (s: string): s is t.Branded<string, AccessTokenBrand> =>
      ACCESS_TOKEN_PATTERN.test(s),
    "AccessToken"
  ),
  (input) => `Access token invalid, got: ${input}`
)

export type Token = { header: string; payload: string; signature: string }

export type AccessToken = t.TypeOf<typeof AccessToken>
