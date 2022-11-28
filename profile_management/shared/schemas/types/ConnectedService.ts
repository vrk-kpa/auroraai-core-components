import * as t from "io-ts"
import { UUID } from "io-ts-types/UUID"
import { TranslatableString } from "./Language"
import { Scope } from "./Scope"

export const StorableAttributeArray = t.array(
  t.interface({
    name: t.string,
    isStored: t.boolean,
  })
)

export const RetrievableAttributeArray = t.array(
  t.interface({ name: t.string })
)

export const RetrievableAttributesSources = t.record(t.string, t.array(t.string))

export const ConnectedService = t.interface({
  id: UUID,
  provider: TranslatableString,
  name: TranslatableString,
  type: TranslatableString,
  location: TranslatableString,
  description: TranslatableString,
  retrievableAttributes: RetrievableAttributeArray,
  storableAttributes: StorableAttributeArray,
  retrievableAttributesSources: RetrievableAttributesSources,
  link: TranslatableString,
  allowedScopes: t.array(Scope),
})

export type StorableAttributeArray = t.TypeOf<typeof StorableAttributeArray>
export type RetrievableAttributeArray = t.TypeOf<
  typeof RetrievableAttributeArray
    >
export type RetrievableAttributesSources = t.TypeOf<typeof RetrievableAttributesSources>
export type ConnectedService = t.TypeOf<typeof ConnectedService>