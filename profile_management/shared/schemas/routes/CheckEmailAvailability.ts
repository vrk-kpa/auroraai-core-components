import { EmailAddress } from "../brands/EmailAddress"
import * as t from "io-ts"

export const CheckEmailAvailabilityRequest = t.type({
  email: EmailAddress,
})

export type CheckEmailAvailabilityRequest = t.TypeOf<
  typeof CheckEmailAvailabilityRequest
>
