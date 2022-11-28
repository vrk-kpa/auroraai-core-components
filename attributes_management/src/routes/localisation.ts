import express, { NextFunction, Request, Response } from "express"
import { attributesDatamodelMiddleware } from "../middlewares/attributesDatamodelMiddleware"
import { NotFoundError } from "../util/errors/ApiErrors"

export const attributesLocalisationRouter = express.Router()
attributesLocalisationRouter.use(attributesDatamodelMiddleware)

attributesLocalisationRouter.get(
  "/",
  (req: Request, res: Response, _next: NextFunction) => {
    res.json(req.attributesLocalisation)
  }
)

attributesLocalisationRouter.get(
  "/:attribute_name",
  (req: Request, res: Response, next: NextFunction) => {
    const attributeName = req.params.attribute_name
    if (!(attributeName in (req?.attributesLocalisation ?? {}))) {
      return next(
        new NotFoundError(`Localisation not found for ${attributeName}.`)
      )
    }

    res.json(req.attributesLocalisation?.[attributeName])
  }
)
