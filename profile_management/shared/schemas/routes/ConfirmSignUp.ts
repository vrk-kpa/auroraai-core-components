import { EmailAddress } from "../brands/EmailAddress"
import { Nullable } from "../types/Nullable"
import * as t from "io-ts"
import { CognitoCode } from "../brands"

export const ConfirmSignUpRequest = t.type({
  email: EmailAddress,
  confirmationCode: CognitoCode,
  language: Nullable(t.string),
})

export type ConfirmSignUpRequest = t.TypeOf<typeof ConfirmSignUpRequest>
