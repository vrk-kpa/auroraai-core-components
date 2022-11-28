import { Icon, suomifiDesignTokens } from "suomifi-ui-components"
import { Alert } from "./styles/Alert"
import Trans from "next-translate/Trans"
import NextLink from "next/link"

export function PasswordExpiredAlert(): JSX.Element {
  return (
    <Alert
      id="password-expired-alert"
      css={{
        marginBottom: suomifiDesignTokens.spacing.s,
      }}
    >
      <div>
        <Icon
          icon="error"
          fill={suomifiDesignTokens.colors.alertBase}
          css={{
            width: "1.5rem",
            height: "1.5rem",
          }}
        />
      </div>

      <span>
        <Trans
          i18nKey={`error:AccountError.PasswordResetRequiredException`}
          components={{
            a: <NextLink href="/forgot" />,
          }}
        />
      </span>
    </Alert>
  )
}
