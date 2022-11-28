import { runWithLogger, technicalLogger } from "./util/logger"

export async function init(): Promise<void> {
  await runWithLogger(async (): Promise<void> => {
    technicalLogger.info("operationName", "serverInitialization")

    await Promise.all([
      // init tasks go here
    ])
  })
}
