const nextTranslate = require("next-translate")
const withPlugins = require("next-compose-plugins")
const { createSecureHeaders } = require("next-secure-headers")
const path = require("path")
const fs = require("fs")
const yaml = require("yaml")

let serverRuntimeConfig = { config: {} }
let publicRuntimeConfig = { config: {} }

const findPath = (depth = 0) => {
  const dir = path.join(__dirname, "../".repeat(depth), "config.yml")

  if (fs.existsSync(dir)) {
    return dir
  }

  if (dir === "/") {
    throw Error("config.yml file not found")
  }

  return findPath(depth + 1)
}

const environment = process.env.ENVIRONMENT ?? "dev"
const file = fs.readFileSync(findPath(), "utf-8")
const configFile = yaml.parse(file)

serverRuntimeConfig = {
  config: {
    ...configFile.default,
    ...configFile[environment],
  },
}

// share selected config values with client-side
publicRuntimeConfig = {
  config: {
    profile_management_secure_cookies:
      serverRuntimeConfig.config.profile_management_secure_cookies,
  },
}

module.exports = withPlugins([nextTranslate], {
  serverRuntimeConfig,
  publicRuntimeConfig,
  experimental: {
    externalDir: true,
    esmExternals: false,
  },

  async headers() {
    return [
      {
        source: "/(.*)?",
        headers: createSecureHeaders({
          frameGuard: "deny",
          referrerPolicy: "same-origin",
        }),
      },
    ]
  },
})
