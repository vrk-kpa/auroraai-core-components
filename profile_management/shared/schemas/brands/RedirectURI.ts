import { withMessage } from "io-ts-types/withMessage"
import * as t from "io-ts"

export interface RedirectURIBrand {
  readonly RedirectURI: unique symbol
}

export const RedirectURI = withMessage(
  t.brand(
    t.string,
    (s: string): s is t.Branded<string, RedirectURIBrand> => {
      try {
        const { protocol } = new URL(s)
        return ["http:", "https:"].includes(protocol.toLowerCase())
      } catch (e) {
        return false
      }
    },
    "RedirectURI"
  ),
  () => "Invalid redirect URI"
)

export type RedirectURI = t.TypeOf<typeof RedirectURI>
