import { RequestHandler, Response } from "express"
import { pipe } from "fp-ts/function"
import { fold } from "fp-ts/Either"
import type { ParamsDictionary } from "express-serve-static-core"
import type { Decoder, Errors } from "io-ts"

export const validator = {
  body:
    <T>(
      type: Decoder<T, T>,
      errorHandler?: (errors: Errors, res: Response) => void
    ): RequestHandler<ParamsDictionary, unknown, T> =>
    (req, res, next) =>
      pipe(
        type.decode(req.body),
        fold(
          (errors) =>
            errorHandler
              ? errorHandler(errors, res)
              : res.status(400).send({
                  error: "ValidationError",
                  details: errors
                    .flatMap((error) => error.context.map((ctx) => ctx.key))
                    .filter((key) => key.length > 0),
                }),
          () => next()
        )
      ),

  query:
    <T>(
      type: Decoder<T, T>,
      errorHandler?: (errors: Errors, res: Response) => void
    ): RequestHandler<ParamsDictionary, unknown, unknown, T> =>
    (req, res, next) =>
      pipe(
        type.decode(req.query),
        fold(
          (errors) =>
            errorHandler
              ? errorHandler(errors, res)
              : res.status(400).send({
                  error: "ValidationError",
                  details: errors
                    .flatMap((error) => error.context.map((ctx) => ctx.key))
                    .filter((key) => key.length > 0),
                }),
          () => next()
        )
      ),
}
