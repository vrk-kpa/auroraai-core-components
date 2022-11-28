import * as t from "io-ts"
import { NonEmptyString } from "io-ts-types/NonEmptyString"
import { omit } from "./utils/omit"
import * as schemas from "shared/schemas"
import { Nullable } from "shared/schemas"
import { RedirectURI } from "shared/schemas"
import { UUID } from "io-ts-types/UUID"

export const LoginForm = t.type({
  email: NonEmptyString,
  password: NonEmptyString,
})
export type LoginForm = t.TypeOf<typeof LoginForm>

export const RegisterForm = t.type(
  omit(schemas.RegisterRequest.props, "language", "returnUrl")
)
export type RegisterForm = t.TypeOf<typeof RegisterForm>

export const ForgotForm = t.type(omit(schemas.ForgotRequest.props, "language"))
export type ForgotForm = t.TypeOf<typeof ForgotForm>

export const ForgotResetForm = t.type({
  passwordConfirm: NonEmptyString,
  ...omit(schemas.ForgotResetRequest.props, "email", "token"),
})

export type ForgotResetForm = t.TypeOf<typeof ForgotResetForm>

export const ChangeEmailForm = t.type(
  omit(schemas.ChangeEmailRequest.props, "language", "newEmail")
)
export type ChangeEmailForm = t.TypeOf<typeof ChangeEmailForm>

export const ChangePasswordForm = t.type({
  newPasswordConfirm: NonEmptyString,
  ...omit(schemas.ChangePasswordRequest.props, "notificationLanguage"),
})

export type ChangePasswordForm = t.TypeOf<typeof ChangePasswordForm>

export const OauthAuthorizationRequest = t.type({
  response_type: t.literal("code"),
  client_id: UUID,
  redirect_uri: Nullable(RedirectURI),
  scope: Nullable(t.string),
  state: Nullable(t.string),
})
export type OauthAuthorizationRequest = t.TypeOf<
  typeof OauthAuthorizationRequest
>

export const Config = t.type({
  environment: t.string,
  announcements: t.array(
    t.type({
      id: UUID,
      ...omit(schemas.AnnouncementRequest.props),
    })
  ),
})

export type Config = t.TypeOf<typeof Config>
