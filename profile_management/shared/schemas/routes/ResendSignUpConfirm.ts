import { EmailAddress } from "../brands/EmailAddress"
import { Nullable } from "../types/Nullable"
import * as t from "io-ts"

export const ResendSignUpConfirmRequest = t.type({
  email: EmailAddress,
  language: Nullable(t.string),
})

export type ResendSignUpConfirmRequest = t.TypeOf<
  typeof ResendSignUpConfirmRequest
>
