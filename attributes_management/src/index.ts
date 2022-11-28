import "dotenv/config"
import { app } from "./app"
import { runWithLogger, technicalLogger } from "./util/logger"
import { config, environment } from "./config"
import { init } from "./init"

const PORT = parseInt(config.port ?? "7100", 10)

init().then(() => {
  app.listen(PORT, () => {
    runWithLogger(() => {
      technicalLogger.info("operationName", "serverStart")
      technicalLogger.info("environment", environment)
      technicalLogger.info("port", PORT)
    })
  })
})
