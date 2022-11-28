import express from "express"
import path from "path"

export const uiRouter = express.Router()

uiRouter.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../public", "index.html"))
})
