import { mockClient } from "aws-sdk-client-mock"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

export function setMocks(client: SESClient): void {
  mockClient(client)
    .on(SendEmailCommand)
    .resolves({})
    // reject (throw exception) other commands
    .rejects("SES mock client called with unknown command")
}
