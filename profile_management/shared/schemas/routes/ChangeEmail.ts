import { EmailAddress } from "../brands/EmailAddress"
import { Nullable } from "../types/Nullable"
import * as t from "io-ts"

export const ChangeEmailRequest = t.type({
  email: EmailAddress,
  language: Nullable(t.string),
  newEmail: EmailAddress,
})

export type ChangeEmailRequest = t.TypeOf<typeof ChangeEmailRequest>
