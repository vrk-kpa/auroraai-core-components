/* eslint-disable @typescript-eslint/no-var-requires */
const { pathsToModuleNameMapper } = require("ts-jest/utils")
const { compilerOptions } = require("../tsconfig.json")

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "./tests/setup.ts",

  // Paths mapping: https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/../",
  }),
}
