import { EmailAddress } from "../brands/EmailAddress"
import { Nullable } from "../types/Nullable"
import * as t from "io-ts"

export const ForgotRequest = t.type({
  email: EmailAddress,
  language: Nullable(t.string),
})

export type ForgotRequest = t.TypeOf<typeof ForgotRequest>
