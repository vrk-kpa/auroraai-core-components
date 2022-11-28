import express from "express"

import attributesSchema from "../../../../schemas/attributes.json"

export const attributesMetadataRouter = express.Router()

attributesMetadataRouter.get("/", (_req, res, _next) => {
  res.json(attributesSchema)
})

attributesMetadataRouter.get("/:attribute_name", (req, res, _next) => {
  const attributeName = req.params.attribute_name
  res.json(
    (attributesSchema.properties as Record<string, unknown>)[attributeName]
  )
})
