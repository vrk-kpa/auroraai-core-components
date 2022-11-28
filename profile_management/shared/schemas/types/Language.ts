import * as t from "io-ts"

export const Finnish = t.literal("fi")
export const Swedish = t.literal("sv")
export const English = t.literal("en")
export const Language = t.union([Finnish, Swedish, English])

export type Finnish = t.TypeOf<typeof Finnish>
export type Swedish = t.TypeOf<typeof Swedish>
export type English = t.TypeOf<typeof English>
export type Language = t.TypeOf<typeof Language>

export { LANGUAGES } from "../../constants"

export const TranslatableString = t.record(Language, t.string)

export type TranslatableString = t.TypeOf<typeof TranslatableString>
