import express from "express"
import { NextFunction, Request, Response } from "express"
import { attributesSchemaMiddleware } from "../middlewares/attributesSchemaMiddleware"
import $RefParser from "@apidevtools/json-schema-ref-parser"
import { technicalLogger } from "../util/logger"
import { NotFoundError } from "../util/errors/ApiErrors"

export const attributesSchemaRouter = express.Router()
attributesSchemaRouter.use(attributesSchemaMiddleware)

attributesSchemaRouter.get(
  "/:attribute_name",
  async (req: Request, res: Response, next: NextFunction) => {
    const attributeName = req.params.attribute_name

    try {
      const inlineSchema = await $RefParser.dereference(
        req.attributesSchema as $RefParser.JSONSchema
      )
      const attributeSchema = (
        inlineSchema?.definitions?.AuroraAIAttributes as $RefParser.JSONSchema
      )?.properties?.[attributeName]

      if (!attributeSchema) {
        return next(
          new NotFoundError(`No schema found for "${attributeName}".`)
        )
      }

      res.json(attributeSchema)
    } catch (err) {
      technicalLogger.error(err)
      next(err)
    }
  }
)

attributesSchemaRouter.get(
  "/",
  (req: Request, res: Response, _next: NextFunction) => {
    res.json(req.attributesSchema)
  }
)
