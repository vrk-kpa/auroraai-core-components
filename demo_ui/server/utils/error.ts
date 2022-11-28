import { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.error(error)
  res.status(500).json({ error: error?.message || 'unknown error' })
}
