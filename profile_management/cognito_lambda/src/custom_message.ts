import { CustomMessageTriggerHandler } from "aws-lambda"
import rawCustomHandlerTranslations from "./custom_message.i18n.json"
import { createHmac } from "crypto"
import type { Language } from "shared/schemas/types/Language"
import { LANGUAGES } from "shared/constants"

type CustomMessage =
  | "CustomMessage_SignUp"
  | "CustomMessage_AdminCreateUser"
  | "CustomMessage_ResendCode"
  | "CustomMessage_ForgotPassword"
  | "CustomMessage_UpdateUserAttribute"
  | "CustomMessage_VerifyUserAttribute"
  | "CustomMessage_PasswordExpiry"
  | "CustomMessage_Authentication"

const customHandlerTranslations = rawCustomHandlerTranslations as unknown as {
  [key in CustomMessage]: {
    [language in Language]: {
      subject: string
      message: string
    }
  }
}

const pages = {
  CustomMessage_SignUp:
    "/register/confirm/{{code}}?email={{email}}&returnUrl={{returnUrl}}",
  CustomMessage_ForgotPassword: "/forgot/reset/{{code}}?email={{email}}",
  CustomMessage_UpdateUserAttribute: "/settings/change-email/verify/{{code}}",
  CustomMessage_ResendCode: "/register/confirm/{{code}}?email={{email}}",
  CustomMessage_PasswordExpiry: "/forgot?email={{email}}&code={{code}}",
} as {
  [key in CustomMessage]: string
}

export const handler: CustomMessageTriggerHandler = async (
  event,
  _context,
  callback
) => {
  const {
    triggerSource,
    request: {
      clientMetadata,
      codeParameter,
      usernameParameter,
      userAttributes,
    },
    response,
    userName,
  } = event

  let language = clientMetadata?.language as Language | undefined

  if (!language || !LANGUAGES.includes(language)) language = "fi"

  const customEvent = clientMetadata?.customEvent
  let trigger = customEvent
    ? (customEvent as CustomMessage)
    : (triggerSource as CustomMessage)

  let translations

  console.info(`Received custom message trigger ${trigger}`)
  translations =
    (language && customHandlerTranslations[trigger]?.[language]) ??
    customHandlerTranslations[trigger]?.fi ??
    customHandlerTranslations[trigger]?.sv ??
    customHandlerTranslations[trigger]?.en

  let serverMetadata = {} as {
    frontendOrigin?: string
  }

  if (clientMetadata?.serverMetadata && process.env.SERVER_METADATA_KEY) {
    try {
      const { hmac, data } = JSON.parse(clientMetadata?.serverMetadata)

      if (
        hmac ===
        createHmac("sha1", Buffer.from(process.env.SERVER_METADATA_KEY))
          .update(data)
          .digest("hex")
      ) {
        serverMetadata = JSON.parse(data)
      }
    } catch (e) {}
  }

  if (translations) {
    const page = (language !== "fi" ? `/${language}` : "") + pages[trigger]

    if (page) {
      const returnUrl = clientMetadata?.returnUrl || ""
      const url = `${
        serverMetadata.frontendOrigin ?? "https://auroraai.suomi.fi"
      }${page
        .replace("{{code}}", codeParameter)
        .replace(
          "{{email}}",
          encodeURIComponent(
            usernameParameter ?? userAttributes.email ?? userName
          )
        )
        .replace("{{returnUrl}}", returnUrl)}`

      response.emailSubject = translations.subject
      response.emailMessage = translations.message
        .replace("{{url}}", url)
        .replace(/\n/g, "<br/>")
        .replace(/\u00A0/g, "") // remove no-break spaces causing Cognito to throw an error
    } else {
      console.error(`Unable to find page for trigger ${trigger}`)
    }
  } else {
    console.error(
      `Unable to find translations for trigger ${trigger} (language: ${language})`
    )
  }

  callback(null, event)
}
