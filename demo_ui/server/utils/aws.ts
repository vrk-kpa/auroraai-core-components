import SecretsManager from 'aws-sdk/clients/secretsmanager'
import { config } from './config'

export const getSecret = async (secretId: string): Promise<string> => {
  const secretsManager = new SecretsManager({ region: config.region })
  const secret = await secretsManager.getSecretValue({ SecretId: secretId }).promise()
  return secret.SecretString || ''
}
