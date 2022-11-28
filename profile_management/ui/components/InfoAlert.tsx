import useTranslation from "next-translate/useTranslation"
import { Icon, suomifiDesignTokens } from "suomifi-ui-components"
import { Alert } from "./styles/Alert"

type InfoMessage = {
  key: string
  param?: string | number
}

export function InfoAlert({
  msg,
  includeIcon,
}: {
  msg: InfoMessage
  includeIcon?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Alert
      id={`${msg.key}-info-alert`}
      variant="info"
      css={{
        marginBottom: suomifiDesignTokens.spacing.s,
      }}
    >
      {includeIcon && (
        <Icon
          icon="info"
          fill={suomifiDesignTokens.colors.highlightLight1}
          css={{
            width: "1.5rem",
            height: "1.5rem",
          }}
        />
      )}

      <span>
        {msg.param
          ? t(`infoMessages:${msg.key}`, { param: msg.param })
          : t(`infoMessages:${msg.key}`)}
      </span>
    </Alert>
  )
}
