import "dotenv/config"
import { app } from "./app"
import { runWithLogger, technicalLogger } from "./util/logger"
import { config, environment } from "./config"
import { init } from "./init"

const PORT = parseInt(config.profile_management_api_port ?? "7000", 10)
const MOCK_COGNITO = config.profile_management_mock_cognito === "true"

init().then(() => {
  const server = app.listen(PORT, () => {
    runWithLogger(() => {
      technicalLogger.info("operationName", "serverStart")
      technicalLogger.info("environment", environment)
      technicalLogger.info("port", PORT)
      technicalLogger.info("mockCognito", MOCK_COGNITO)
    })
  })
  server.keepAliveTimeout = 95 * 1000 // 95 seconds. This must be bigger than the ALB idle_timeout
})
