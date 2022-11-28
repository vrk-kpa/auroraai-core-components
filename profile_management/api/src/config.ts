import yaml from "yaml"
import fs from "fs"
import path from "path"

const findPath = (depth = 0): string => {
  const dir = path.join(__dirname, "../".repeat(depth), "config.yml")

  if (fs.existsSync(dir)) {
    return dir
  }

  if (dir === "/") {
    throw Error("config.yml file not found")
  }

  return findPath(depth + 1)
}

const CONFIG_FILE_PATH = findPath()

export const environment =
  (process.env.ENVIRONMENT as keyof Config | undefined) ?? "dev"

export const config = readConfig(environment)

export function readConfig(env: keyof Config): ConfigRow {
  const file = fs.readFileSync(CONFIG_FILE_PATH, "utf-8")
  const configFile: Config = yaml.parse(file)

  return {
    ...configFile.default,
    ...configFile[env],
  }
}

type ConfigRow = Record<string, string | undefined>

interface Config {
  default: ConfigRow
  local: ConfigRow
  localcluster: ConfigRow
  dev: ConfigRow
  qa: ConfigRow
  astest: ConfigRow
  prod: ConfigRow
  ci: ConfigRow
}
