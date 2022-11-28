import { suomifiDesignTokens } from "suomifi-ui-components"
import { Alert } from "./styles/Alert"
import Trans from "next-translate/Trans"
import NextLink from "next/link"

export function PasswordExpiringAlert({
  count,
}: {
  count: number
}): JSX.Element {
  return (
    <Alert
      id="password-expiring-alert"
      variant="info"
      css={{
        marginBottom: suomifiDesignTokens.spacing.s,
      }}
    >
      <span>
        <Trans
          i18nKey={
            count == 0
              ? "infoMessages:passwordExpiringToday"
              : "infoMessages:passwordExpiring"
          }
          values={{
            param: count,
          }}
        />{" "}
        <Trans
          i18nKey={"infoMessages:changePassword"}
          components={{
            a: <NextLink href="/settings/change-password" />,
          }}
        />
      </span>
    </Alert>
  )
}
