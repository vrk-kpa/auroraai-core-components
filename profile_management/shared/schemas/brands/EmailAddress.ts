import { withMessage } from "io-ts-types/withMessage"
import * as t from "io-ts"

export interface EmailAddressBrand {
  readonly EmailAddress: unique symbol
}

export const EmailAddress = withMessage(
  t.brand(
    t.string,
    (s: string): s is t.Branded<string, EmailAddressBrand> => isValidEmail(s),
    "EmailAddress"
  ),
  (input) =>
    `Email address value must be a valid email address${
      input ? ", got " + input : ""
    }`
)

export const isValidEmail = (email: string) =>
  email.includes("@") && /.+\..+$/.test(email.split("@").pop() ?? "") // ensure email has @ and host is *.*

export type EmailAddress = t.TypeOf<typeof EmailAddress>
