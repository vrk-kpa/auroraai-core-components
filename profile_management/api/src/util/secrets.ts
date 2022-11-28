import { config } from "../config"
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager"

export async function getSecret(name: string): Promise<string | undefined> {
  if (config[`profile_management_secret_${name}`]) {
    return config[`profile_management_secret_${name}`]
  }

  const sm = new SecretsManagerClient({ region: config.region })

  const secretValue = await sm.send(
    new GetSecretValueCommand({
      SecretId: name,
    })
  )

  return secretValue.SecretString
}
