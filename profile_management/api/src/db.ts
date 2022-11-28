import pgPromise from "pg-promise"
import { config } from "./config"
import { auditLogger, runWithLogger, technicalLogger } from "./util/logger"
import pg, { DynamicPassword } from "pg-promise/typescript/pg-subset"
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds"
import { getSignerAuthToken } from "./dbSigner"

export const pgp = pgPromise({
  query({ query }) {
    if (process.env.ENVIRONMENT !== "prod") {
      auditLogger.info("sqlQueries", [
        typeof query === "string" ? query : JSON.stringify(query),
      ])
    }
  },
})

export let db: pgPromise.IDatabase<unknown, pg.IClient>
export const initDb = (
  host: string,
  port: number,
  database: string,
  user: string,
  password: DynamicPassword
): void => {
  try {
    technicalLogger.info("dbPort", port)
    technicalLogger.info("dbName", database)
    technicalLogger.info("dbHost", host)

    db = pgp({
      host,
      port,
      database,
      user,
      password,
      ssl: getSSLConfig(),
    })
  } catch (error) {
    technicalLogger.error(error)
    throw error
  }
}

export async function getDbEndpoint(
  dbName: string,
  region: string
): Promise<string> {
  if (config.profile_management_db_host) {
    return config.profile_management_db_host
  }

  const rds = new RDSClient({ region })
  const { DBInstances } = await rds.send(new DescribeDBInstancesCommand({}))

  const dbInstance = DBInstances?.find(({ DBName }) => DBName === dbName)
  const endPointAddress = dbInstance?.Endpoint?.Address

  if (endPointAddress) {
    return endPointAddress
  } else {
    throw new Error(`No DB instances found with name ${dbName}`)
  }
}

function getSSLConfig(): boolean | pg.ISSLConfig | undefined {
  return config.profile_management_db_ssl === "true"
    ? { rejectUnauthorized: false }
    : undefined
}

export async function getAuthToken(
  dbAuthEndpoint: string,
  port: number,
  username: string,
  region: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    runWithLogger(() => {
      technicalLogger.info("operationName", "dbAuthentication")

      const defaultPassword = config.profile_management_db_password
      if (defaultPassword) {
        auditLogger.info("dbPassword", defaultPassword)
        resolve(defaultPassword)
      }

      getSignerAuthToken({
        hostname: dbAuthEndpoint,
        port,
        username,
        region,
      })
        .then((token) => {
          auditLogger.info("dbPassword", token)
          resolve(token)
        })
        .catch((error) => {
          auditLogger.error(error)
          reject(error)
        })
    })
  })
}
