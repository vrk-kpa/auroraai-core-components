import rawTranslations from "../i18n.json"
import type { Language } from "shared/schemas/types/Language"

export type CustomMessage =
  | "CustomMessage_SignUp"
  | "CustomMessage_AdminCreateUser"
  | "CustomMessage_ResendCode"
  | "CustomMessage_ForgotPassword"
  | "CustomMessage_UpdateUserAttribute"
  | "CustomMessage_VerifyUserAttribute"
  | "CustomMessage_PasswordExpiry"
  | "CustomMessage_Authentication"
  | "CustomMessage_InitiateEmailChange"

export const translations = rawTranslations as unknown as {
  [key in CustomMessage]: {
    [language in Language]: {
      subject: string
      message: string
    }
  }
}
