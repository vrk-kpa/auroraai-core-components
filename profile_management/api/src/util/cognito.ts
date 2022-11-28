import { DescribeUserPoolClientCommand } from "@aws-sdk/client-cognito-identity-provider"
import { cognitoClient } from "../cognito/config"
import crypto from "crypto"

const getClientSecret = async (userPoolId: string, userClientId: string) => {
  const { UserPoolClient } = await cognitoClient.send(
    new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: userClientId,
    })
  )
  return UserPoolClient?.ClientSecret || ""
}

export const generateSecretHash = async (
  userPoolId: string,
  userPoolClientId: string,
  username: string
) => {
  const clientSecret = await getClientSecret(userPoolId, userPoolClientId)
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + userPoolClientId)
    .digest("base64")
}
