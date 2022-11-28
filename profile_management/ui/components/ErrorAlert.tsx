import useTranslation from "next-translate/useTranslation"
import { isRight } from "fp-ts/Either"
import { ApiErrorCognitoDetails } from "shared/schemas/types/Errors"
import { Icon, suomifiDesignTokens } from "suomifi-ui-components"
import { APIError } from "../utils/errors"
import { Alert } from "./styles/Alert"

export function ErrorAlert({ error }: { error: APIError }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Alert
      id="error-alert"
      css={{
        marginBottom: suomifiDesignTokens.spacing.s,
      }}
    >
      <Icon
        icon="error"
        fill={suomifiDesignTokens.colors.alertBase}
        css={{
          width: "1.5rem",
          height: "1.5rem",
        }}
      />

      {isRight(ApiErrorCognitoDetails.decode(error.details))
        ? t(`error:AccountError.${error.details?.code}`)
        : t(`error:${error.error}`)}
    </Alert>
  )
}
