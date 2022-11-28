import { loggerMiddleware } from "./util/logger"
import helmet = require("helmet")
import { attributesSchemaRouter } from "./routes/schema"
import { errorHandler } from "./util/error"
import cors = require("cors")
import express from "express"
import { attributeScopesRouter } from "./routes/scopes"
import { attributesDatamodelRouter } from "./routes/datamodel"
import { attributesLocalisationRouter } from "./routes/localisation"

export const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(loggerMiddleware)

app.use(cors())
app.use(helmet.noSniff())
app.use(
  helmet.frameguard({
    action: "DENY",
  })
)
app.use(helmet.hidePoweredBy())
app.use("/attributes-management/v1/schema", attributesSchemaRouter)
app.use("/attributes-management/v1/datamodel", attributesDatamodelRouter)
app.use("/attributes-management/v1/scopes", attributeScopesRouter)
app.use("/attributes-management/v1/localisation", attributesLocalisationRouter)
app.use("/healthcheck", () => "OK")

app.use(errorHandler)
