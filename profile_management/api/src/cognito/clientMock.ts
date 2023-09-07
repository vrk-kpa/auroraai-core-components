import {
  AdminGetUserCommand,
  AdminResetUserPasswordCommand,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  DeleteUserCommand,
  DescribeUserPoolClientCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  GetUserCommandOutput,
  InitiateAuthCommand,
  ListUsersCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  UpdateUserAttributesCommand,
  VerifyUserAttributeCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { mockClient } from "aws-sdk-client-mock"
import { Request } from "express"
import { AuthenticatedRequest } from "../util/requestHandler"
import { UUID } from "io-ts-types/UUID"
import { sign } from "jsonwebtoken"

type Payload = {
  [key: string]: string | undefined
}

const key = "mock-cognito"
const createToken = (content: Payload): string => sign(content, key)

const mockUserEmail = "mock.user@mock.fi"
const mockUserId = "56622d65-4a7e-482c-82e3-34688b16a383"
const mockUserAccessToken = createToken({ key: "mock-cognito-access-token" })
const mockUserRefreshToken = createToken({ key: "mock-cognito-refresh-token" })

export function setMocks(client: CognitoIdentityProviderClient): void {
  const mockUserResponse = {
    Username: mockUserId,
    UserAttributes: [{ Name: "email", Value: mockUserEmail }],
  }
  const mockAuthResultResponse = {
    AuthenticationResult: {
      AccessToken: mockUserAccessToken,
      RefreshToken: mockUserRefreshToken,
    },
  }
  mockClient(client)
    // resolve ListUsers to empty list, it's only used when checking if email is available
    .on(ListUsersCommand)
    .resolves({ Users: [{ Username: mockUserId }] })
    .on(GetUserCommand)
    .resolves(mockUserResponse)
    .on(InitiateAuthCommand)
    .resolves(mockAuthResultResponse)
    .on(UpdateUserAttributesCommand)
    .callsFake((input) => ({
      CodeDeliveryDetailsList: [{ Destination: input.UserAttributes[0].Value }],
    }))
    .on(ForgotPasswordCommand)
    .resolves({ CodeDeliveryDetails: { Destination: mockUserEmail } })
    .on(VerifyUserAttributeCommand)
    .resolves({})
    .on(ChangePasswordCommand)
    .resolves({})
    .on(DeleteUserCommand)
    .resolves({})
    .on(ConfirmForgotPasswordCommand)
    .resolves({})
    .on(RespondToAuthChallengeCommand)
    .resolves(mockAuthResultResponse)
    .on(SignUpCommand)
    .callsFake((input) => ({
      CodeDeliveryDetails: { Destination: input.Username },
      UserConfirmed: true,
    }))
    .on(ConfirmSignUpCommand)
    .resolves({})
    .on(ResendConfirmationCodeCommand)
    .callsFake((input) => ({
      CodeDeliveryDetails: { Destination: input.Username },
    }))
    .on(AdminResetUserPasswordCommand)
    .resolves({})
    .on(AdminGetUserCommand)
    .resolves({})
    .on(DescribeUserPoolClientCommand)
    .resolves({})
    .on(AdminUpdateUserAttributesCommand)
    .resolves({})
    // reject (throw exception) other commands
    .rejects("Cognito mock client called with unknown command")
}

export function mockUserAuthentication(
  req: Request & Partial<AuthenticatedRequest>
): void {
  req.cognitoUser = {
    username: mockUserId as UUID,
    accessToken: "DUMMY_ACCESS_TOKEN",
    refreshToken: mockUserRefreshToken,
    authTime: Math.floor(Date.now() / 1000),
    getUser: () =>
      Promise.resolve({
        Username: mockUserId,
        UserAttributes: [
          {
            Name: "email",
            Value: mockUserEmail,
          },
        ],
      } as GetUserCommandOutput),
  }

  return
}
