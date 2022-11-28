import { getSecret } from './aws'
import { config } from './config'

const recommenderApiAuthSecretName = 'demo_ui_recommender_auth'

const isBasicAuthRequired = () => config.require_api_auth == 'true'

export const constructAuthorizationHeader = async (): Promise<string> => {
  if (isBasicAuthRequired()) {
    const authorization = await getSecret(recommenderApiAuthSecretName)
    return `Basic ${Buffer.from(authorization, 'utf-8').toString('base64')}`
  }
  return ''
}
