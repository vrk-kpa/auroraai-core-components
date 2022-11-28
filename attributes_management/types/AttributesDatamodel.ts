import * as t from "io-ts"

interface GraphBrand {
  readonly Graph: unique symbol
}

const RecordArray = t.array(t.UnknownRecord)
type RecordArray = t.TypeOf<typeof RecordArray>

// A json-ld graph array that contains a node with AuroraAI attributes
const Graph = t.brand(
  RecordArray,
  (a: RecordArray): a is t.Branded<RecordArray, GraphBrand> =>
    a.some((it) => it?.["@id"] === "aurora-att:AuroraAIAttributes"),
  "Graph"
)

export const AttributesDatamodel = t.type({
  "@graph": Graph,
})
export type AttributesDatamodel = t.TypeOf<typeof AttributesDatamodel>
