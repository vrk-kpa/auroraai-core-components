import * as t from "io-ts"

export const AttributesSchema = t.type({
  definitions: t.type({
    AuroraAIAttributes: t.type({
      properties: t.UnknownRecord,
    }),
  }),
})
export type AttributesSchema = t.TypeOf<typeof AttributesSchema>
