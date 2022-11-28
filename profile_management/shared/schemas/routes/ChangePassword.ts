import * as t from "io-ts"
import * as tt from "io-ts-types/NonEmptyString"
import { Password } from "../brands/Password"
import { Nullable } from "../types/Nullable"

export const ChangePasswordRequest = t.type({
  oldPassword: tt.NonEmptyString,
  newPassword: Password,
  notificationLanguage: Nullable(t.string),
})

export type ChangePasswordRequest = t.TypeOf<typeof ChangePasswordRequest>
