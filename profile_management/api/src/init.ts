import { config } from "./config"
import { getAuthToken, getDbEndpoint, initDb } from "./db"
import { initScheduledTasks } from "./scheduler"
import { runWithLogger, technicalLogger } from "./util/logger"

export async function init(): Promise<void> {
  await runWithLogger(async (): Promise<void> => {
    technicalLogger.info("operationName", "serverInitialization")

    const database = config.profile_management_db_name ?? ""
    const username = config.profile_management_db_user ?? ""
    const port = parseInt(config.profile_management_db_port ?? "-1", 10)
    const region = config.region ?? ""

    const dbEndpointAddress = await getDbEndpoint(database, region)

    await Promise.all([
      initDb(
        dbEndpointAddress,
        parseInt(config.profile_management_db_port ?? "-1", 10),
        database,
        username,
        () => getAuthToken(dbEndpointAddress, port, username, region)
      ),
      initScheduledTasks(),
    ])
  })
}
