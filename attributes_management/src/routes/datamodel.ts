import express, { NextFunction, Request, Response } from "express"
import { attributesDatamodelMiddleware } from "../middlewares/attributesDatamodelMiddleware"

export const attributesDatamodelRouter = express.Router()
attributesDatamodelRouter.use(attributesDatamodelMiddleware)

attributesDatamodelRouter.get(
  "/",
  (req: Request, res: Response, _next: NextFunction) => {
    res.json(req.attributesDatamodel)
  }
)
