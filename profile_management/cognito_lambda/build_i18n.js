/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs")
const path = require("path")

const sourceLanguage = require(path.join(
  __dirname,
  "../../locale/af/profileManagementUI.json"
))
const locales = fs
  .readdirSync(path.join(__dirname, "../../locale"), { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .filter((locale) => locale !== "af")
const otherLanguages = locales.map((locale) =>
  require(path.join(
    __dirname,
    `../../locale/${locale}/profileManagementUI.json`
  ))
)

const i18n = {}

for (const key in sourceLanguage.email) {
  i18n[key] = Object.fromEntries(
    locales.map((locale, index) => [locale, otherLanguages[index].email?.[key]])
  )
}

fs.writeFileSync(
  path.join(__dirname, "src/custom_message.i18n.json"),
  JSON.stringify(i18n)
)
