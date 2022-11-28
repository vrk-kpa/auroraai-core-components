import { EmailAddress } from "../brands/EmailAddress"
import { Password } from "../brands/Password"
import { Nullable } from "../types/Nullable"
import * as t from "io-ts"

export const RegisterRequest = t.type({
  email: EmailAddress,
  password: Password,
  language: Nullable(t.string),
  returnUrl: Nullable(t.string),
})

export type RegisterRequest = t.TypeOf<typeof RegisterRequest>
