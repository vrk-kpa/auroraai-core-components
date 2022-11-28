import * as t from "io-ts"
import { Scope } from "../types"
import { UUID } from "io-ts-types/UUID"

export const ScopeChangeRequest = t.type({
  serviceId: UUID,
  scopes: t.array(Scope),
})

export type ScopeChangeRequest = t.TypeOf<typeof ScopeChangeRequest>
