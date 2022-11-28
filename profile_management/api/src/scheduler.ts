import cron from "node-cron"
import { sessionAttributesController } from "./controllers/sessionAttribute/sessionAttribute"
import { attributeController } from "./controllers/attribute/attribute"
import { oauthController } from "./controllers/oauth/oauth"
import { runWithLogger, technicalLogger } from "./util/logger"
import { userControllerUtils } from "./controllers/user/user"

const EVERY_MIDNIGHT = "0 0 * * *"

export function initScheduledTasks(): void {
  cron.schedule(EVERY_MIDNIGHT, () => {
    runWithLogger(async () => {
      technicalLogger.info("operationName", "removeExpiredSessionAttributes")
      await sessionAttributesController.removeExpiredSessionAttributes()
    })

    runWithLogger(async () => {
      technicalLogger.info("operationName", "removeExpiredAuthorizationCodes")
      await oauthController.removeExpiredAuthorizationCodes()
    })

    runWithLogger(async () => {
      technicalLogger.info("operationName", "removeExpiredRefreshTokens")
      await oauthController.removeExpiredTokenPairs()
    })

    runWithLogger(async () => {
      technicalLogger.info("operationName", "retryPendingAttributeDeletions")
      await attributeController.retryPendingAttributeDeletions()
    })

    runWithLogger(async () => {
      technicalLogger.info("operationName", "expiredPasswordsForceReset")
      await userControllerUtils.expiredPasswordsForceReset()
      await userControllerUtils.clearObsoletePasswordChangeInfo()
    })
  })
}
