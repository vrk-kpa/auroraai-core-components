import * as t from "io-ts"
import { UUID } from "io-ts-types/lib/UUID"
import { RedirectURI } from "../brands"
import { Nullable } from "../types"
import { Scope } from "../types/Scope"

export const OauthAuthorize = t.type({
  clientId: UUID,
  scopes: t.array(Scope),
  redirectUri: Nullable(RedirectURI),
})

export type OauthAuthorize = t.TypeOf<typeof OauthAuthorize>
