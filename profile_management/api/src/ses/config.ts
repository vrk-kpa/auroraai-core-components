import { config } from "../config"
import { SendEmailCommandInput, SESClient } from "@aws-sdk/client-ses"
import { setMocks } from "./clientMock"

const getSesClient = () => {
  const client = new SESClient({ region: config.region })
  if (config.profile_management_mock_ses === "true") {
    setMocks(client)
  }
  return client
}

export const sesClient = getSesClient()

export const sesConfiguration = (() => {
  const sourceEmailAddress = config.noreply_email_address
  return {
    sourceEmailAddress,
  }
})()

export const generateEmailParams = (
  toAddresses: string[],
  rawMessage: string,
  subject: string
): SendEmailCommandInput => {
  const message = rawMessage.replace(/\n/g, "<br/>").replace(/\u00A0/g, "")
  return {
    Source: sesConfiguration.sourceEmailAddress,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: message,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
  }
}
