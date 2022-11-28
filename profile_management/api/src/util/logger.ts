import { AsyncLocalStorage } from "async_hooks"
import { Request, Response, NextFunction } from "express"
import * as uuid from "uuid"
import { stringifyError } from "./error"
import { endTimer, getTimestamp, startTimer } from "./time"
import { concatOrCreateArray, isEmptyObject } from "./helper"
import { config, environment } from "../config"

/**
 * Changing AuditLog interface requires changing log description in the wiki.
 * Remember to add "muutettu" label into it.
 */
interface AuditLog {
  accessToken?: string
  refreshToken?: string
  sqlQueries?: string[]
  httpBody?: string
  queryString?: string
  errors?: string[]
  dbPassword?: string
  username?: string
  apiKey?: string
  attributes?: string[]
  clientId?: string
  retrievedAttributes?: Record<string, unknown>
  contactedDataProviders?: {
    auroraAIServiceId: string
    url: string
    attributes: string[]
  }[]
  jwtPayload?: {
    iss: string
    sub: string
    aud: string
    exp: number
    scope: string
  }
}

/**
 * Changing TechnicalLog interface requires changing log description in the wiki.
 * Remember to add "muutettu" label into it.
 */
interface TechnicalLog {
  environment?: string
  httpPath?: string
  httpMethod?: string
  httpStatusCode?: number
  durationMs?: number
  operationName?:
    | "serverInitialization"
    | "dbAuthentication"
    | "serverStart"
    | "removeExpiredSessionAttributes"
    | "removeExpiredAuthorizationCodes"
    | "removeExpiredRefreshTokens"
    | "removeExpiredAccessTokens"
    | "retryPendingAttributeDeletions"
    | "expiredPasswordsForceReset"
  host?: string
  port?: number
  dbHost?: string
  dbPort?: number
  dbName?: string
  ptvServiceChannelId?: string
  auroraAIServiceId?: string
  mockCognito?: boolean
  errors?: string[]
}

/**
 * IMPORTANT
 * Store.logs keys are used to identify the type of log so do not change them
 * without changing the log template in Confluence.
 */
type Store = {
  requestId: string
  timestamp: string
  logs: {
    audit: AuditLog
    technical: TechnicalLog
  }
}

type LogRow = Omit<Store, "logs"> & {
  type: keyof Store["logs"]
  logs: Store["logs"][keyof Store["logs"]]
}

export const logStore = new AsyncLocalStorage<Store>()

class Logger<T extends keyof Store["logs"]> {
  constructor(private type: T) {}

  info<K extends keyof Store["logs"][T], V extends Store["logs"][T][K]>(
    key: K,
    value: V
  ) {
    const store = logStore.getStore()

    if (store && Array.isArray(value)) {
      type V = typeof value

      store.logs[this.type][key] = concatOrCreateArray(
        store.logs[this.type][key] as V,
        value
      ) as V
    } else if (store) {
      store.logs[this.type][key] = value
    } else {
      // What to do if this fails? This can happen when out of context.
    }
  }

  error(error: unknown) {
    const store = logStore.getStore()
    if (store) {
      store.logs[this.type].errors = concatOrCreateArray(
        store.logs[this.type].errors,
        stringifyError(error)
      )
    } else {
      // What to do if this fails? This can happen when out of context.
    }
  }
}

/**
 * AuditLogger is used to log sensitive data.
 * Sensitive data is for example email addresses
 * and session ids.
 *
 * TechnicalLogger is used to log the opposite.
 */
export const auditLogger = new Logger("audit")
export const technicalLogger = new Logger("technical")

export function getStore(): Store {
  return {
    requestId: uuid.v4(),
    timestamp: getTimestamp(),
    logs: {
      audit: {},
      technical: {},
    },
  }
}

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = startTimer()
  const store: Store = getStore()
  const logRequest =
    process.env.LOG_REQUESTS !== undefined
      ? process.env.LOG_REQUESTS == "true"
      : config.log_requests === "true"

  store.logs.audit = {
    queryString: req.originalUrl.split(/\?(.*)/)[1] ?? undefined,
    httpBody: JSON.stringify(req.body, ["email", "language"]) || "",
  }
  store.logs.technical = {
    httpPath: req.path,
    httpMethod: req.method,
    httpStatusCode: -1,
    durationMs: -1,
    mockCognito: config.profile_management_mock_cognito === "true",
  }

  res.on("close", async () => {
    store.logs.technical.durationMs = endTimer(start)
    store.logs.technical.httpStatusCode = res.statusCode

    if (logRequest) {
      await sendLogs(store)
    }
  })

  return logStore.run(store, () => next())
}

/**
 * Use `runWithLogger` when logging operations that
 * are not in `loggerMiddleware`'s context
 */
export async function runWithLogger(
  func: () => Promise<void> | void
): Promise<void> {
  const store = getStore()
  await logStore.run(store, async () => {
    try {
      await func()
    } catch (error) {
      technicalLogger.error(error)
    } finally {
      sendLogs(store)
    }
  })
}

function sendLogs(store: Store): void {
  Object.keys(store.logs).forEach((type) => {
    const logRow = takeOnlyLogsWithType(store, type as keyof Store["logs"])

    if (isEmptyObject(logRow.logs)) {
      return
    }
    log(logRow, {
      isError: Boolean(logRow.logs.errors && logRow.logs.errors.length > 0),
    })
  })
}

function takeOnlyLogsWithType(store: Store, type: keyof Store["logs"]): LogRow {
  const { logs, ...coreLogs } = store

  return {
    ...coreLogs,
    type,
    logs: logs[type],
  }
}

function log(logRow: unknown, options?: { isError: boolean }) {
  if (environment === "local") {
    options?.isError
      ? console.error(JSON.stringify(logRow, null, 2))
      : console.log(JSON.stringify(logRow, null, 2))
  } else {
    options?.isError
      ? console.error(JSON.stringify(logRow))
      : console.log(JSON.stringify(logRow))
  }
}
