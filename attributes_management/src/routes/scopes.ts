import express, { NextFunction, Request, Response } from "express"
import { attributesSchemaMiddleware } from "../middlewares/attributesSchemaMiddleware"

export const attributeScopesRouter = express.Router()
attributeScopesRouter.use(attributesSchemaMiddleware)

attributeScopesRouter.get(
  "/",
  (req: Request, res: Response, _next: NextFunction) => {
    const schema =
      req.attributesSchema?.definitions.AuroraAIAttributes.properties ?? {}

    const attribute_keys = Object.keys(schema)
    res.json([
      ...attribute_keys,
      ...attribute_keys.map((key) => "store:" + key),
      "openid",
    ])
  }
)
