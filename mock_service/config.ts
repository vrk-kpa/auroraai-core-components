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

export const config = readConfig()

function readConfig(): EnvironmentConfig {
  const file = fs.readFileSync(CONFIG_FILE_PATH, "utf-8")
  const configFile: Config = yaml.parse(file)

  return {
    ...configFile.default,
    ...configFile[environment],
  }
}

export type MockInstanceConfig = {
  mock_service_port?: string
  client_id?: string
  stored_attributes?: string[]
  remote_attributes?: string[]
}

type EnvironmentConfig = {
  auroraai_host?: string,
  jwt_audience?: string,
  profile_management_api_url?: string,
  instance1_config: MockInstanceConfig,
  instance2_config: MockInstanceConfig
}

interface Config {
  default: EnvironmentConfig
  local: EnvironmentConfig
  localcluster: EnvironmentConfig
  dev: EnvironmentConfig
  qa: EnvironmentConfig
  astest: EnvironmentConfig
  prod: EnvironmentConfig
  ci: EnvironmentConfig
}
