import type * as configType from "../config"

const config = jest.createMockFromModule<typeof configType>("../config")

config.config.mock_cognito = "false"

module.exports = config
