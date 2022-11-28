import { NextFunction, Request, Response } from "express"
import axios from "axios"
import { config } from "../config"
import NodeCache from "node-cache"
import { InternalServerError } from "../util/errors/ApiErrors"
import { AttributesSchema } from "../../types/AttributesSchema"
import { pipe } from "fp-ts/function"
import { fold } from "fp-ts/Either"

const cache = new NodeCache({ stdTTL: 3600 })

export const clearCache = (): void => {
  cache.del("attributesSchema")
}

const updateAttributesSchemaCache = async () => {
  const url = `${config.datamodel_api_url}?${config.json_schema_query}`
  const response = await axios.get(url)
  const schema = validateSchema(response.data)
  cache.set("attributesSchema", schema)
  return schema
}

const validateSchema = (schema: never): AttributesSchema =>
  pipe(
    AttributesSchema.decode(schema),
    fold(
      () => {
        throw new InternalServerError("Got invalid schema from Y-alusta")
      },
      () => schema as AttributesSchema
    )
  )

export const attributesSchemaMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  req.attributesSchema = cache.get("attributesSchema") as
    | AttributesSchema
    | undefined

  if (typeof req.attributesSchema === "undefined") {
    try {
      req.attributesSchema = await updateAttributesSchemaCache()
    } catch (e) {
      return next(e)
    }
  }
  return next()
}
