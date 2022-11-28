import { Nullable } from "../types/Nullable"
import * as t from "io-ts"
import { RedirectURI } from "../brands"
import { UUID } from "io-ts-types/UUID"
import { Scope } from "../types/Scope"

export const InitOauthAuthorization = t.type({
  clientId: UUID,
  redirectUri: Nullable(RedirectURI),
  scopes: t.array(Scope),
  consentRequired: t.boolean,
})

export type InitOauthAuthorization = t.TypeOf<typeof InitOauthAuthorization>
