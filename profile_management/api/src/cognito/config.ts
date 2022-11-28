import { config } from "../config"
import {
  CognitoIdentityProviderClient,
  ListUserPoolClientsCommand,
  ListUserPoolsCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { setMocks } from "./clientMock"

function getCognitoClient() {
  const client = new CognitoIdentityProviderClient({
    region: config.region,
  })
  if (config.profile_management_mock_cognito === "true") {
    setMocks(client)
  }
  return client
}

export const cognitoClient = getCognitoClient()
export const userPoolConfiguration = (async () => {
  const defaultConfig = {
    userPoolId: config.profile_management_cognito_user_pool_id ?? "",
    userPoolClientId:
      config.profile_management_cognito_user_pool_client_id ?? "",
  }

  if (
    config.profile_management_cognito_user_pool_id &&
    config.profile_management_cognito_user_pool_client_id
  ) {
    return defaultConfig
  }

  const { UserPools } = await cognitoClient.send(
    new ListUserPoolsCommand({ MaxResults: 10 })
  )
  const userPoolId = UserPools?.find(
    (pool) => pool.Name === "profile_management"
  )?.Id

  if (!userPoolId) {
    return defaultConfig
  }

  const { UserPoolClients } = await cognitoClient.send(
    new ListUserPoolClientsCommand({
      MaxResults: 10,
      UserPoolId: userPoolId,
    })
  )
  const userPoolClientId = UserPoolClients?.find(
    (client) => client.ClientName === "ui_client"
  )?.ClientId

  if (!userPoolClientId) {
    return defaultConfig
  }

  return {
    userPoolId,
    userPoolClientId,
  }
})()
