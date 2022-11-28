import { UUID } from "io-ts-types/UUID"

type StorableAttribute = `store:${string}`
type RetrievableAttribute = string
export type MixedAttribute = RetrievableAttribute | StorableAttribute

export type ServiceAttributes = {
  id: UUID
  attributes: MixedAttribute[]
}

export const isRetrievableAttribute = (attribute: MixedAttribute) =>
  !attribute.startsWith("store:") && attribute !== "openid"

export const filterRetrievableAttributes = (
  attributes: MixedAttribute[]
): RetrievableAttribute[] =>
  attributes
    .filter((attribute): attribute is RetrievableAttribute =>
      isRetrievableAttribute(attribute)
    )

export const isStorableAttribute = (attribute: MixedAttribute) =>
  attribute.startsWith("store:")

export const filterStorableAttributes = (
  attributes: MixedAttribute[]
): string[] =>
  attributes
    .filter((attribute): attribute is StorableAttribute =>
      attribute.startsWith("store:")
    )
    .map((attribute) => attribute.replace(/^store:/, ""))

export const ensureOpenIDScope = (scopes: string[]): string[] => {
  if (!scopes.includes("openid")) scopes.unshift("openid")

  return scopes
}
