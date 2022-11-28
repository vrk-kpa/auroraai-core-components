import express from "express"
import { errorHandler } from "./util/error"
import { uiRouter } from "./routes/ui"
import { sessionAttributesRouterV1 } from "./routes/sessionAttributes"
import { auroraAIServiceRouterV1 } from "./routes/auroraAIService"
import cors from "cors"
import helmet from "helmet"
import { loggerMiddleware } from "./util/logger"
import { handleRequest } from "./util/requestHandler"
import { userRouterV1 } from "./routes/user"
import { oauthRouter } from "./routes/oauth"
import { attributesRouter } from "./routes/attributes"
import { internalRouter } from "./routes/internal"
import { configRouter } from "./routes/config"
import { attributesMetadataRouter } from "./routes/attributesMetadata"
import { config } from "./config"

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

app.use("/", uiRouter)
app.use("/v1/session_attributes", sessionAttributesRouterV1)
app.use("/v1/aurora_ai_services", auroraAIServiceRouterV1)
app.use("/v1/user", userRouterV1)
app.use("/oauth", oauthRouter)
app.use("/profile-management/v1/user_attributes", attributesRouter)

if (config.feature_flags?.includes("attributes_metadata_api")) {
  app.use(
    "/profile-management/v1/user_attributes_metadata",
    attributesMetadataRouter
  )
}

app.use(
  "/healthcheck",
  handleRequest(() => "OK")
)
app.use("/config", configRouter)
app.use("/internal", internalRouter)

app.use(errorHandler)
