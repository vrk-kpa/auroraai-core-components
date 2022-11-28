import { EmailAddress } from "../brands/EmailAddress"
import * as t from "io-ts"
import { Password } from "../brands/Password"
import { CognitoCode } from "../brands"
import { Nullable } from "../types/Nullable"

export const ForgotResetRequest = t.type({
  email: EmailAddress,
  token: CognitoCode,
  password: Password,
  notificationLanguage: Nullable(t.string),
})

export type ForgotResetRequest = t.TypeOf<typeof ForgotResetRequest>
