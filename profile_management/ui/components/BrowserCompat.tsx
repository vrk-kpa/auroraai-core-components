import useTranslation from "next-translate/useTranslation"
import { Icon, suomifiDesignTokens } from "suomifi-ui-components"
import { Alert } from "./styles/Alert"
import { MediumContainer } from "./styles/MediumContainer"

export function BrowserCompat(): JSX.Element {
  const isUnsupportedBrowser =
    typeof window !== "undefined" &&
    (typeof BigInt === "undefined" || typeof window.crypto === "undefined")

  const { t } = useTranslation("error")

  return (
    <div>
      {isUnsupportedBrowser && (
        <Alert
          id="browser-compatibility-alert-unsupported"
          css={{
            marginBottom: suomifiDesignTokens.spacing.s,
          }}
          stripe={false}
        >
          <Icon
            icon="error"
            fill={suomifiDesignTokens.colors.alertBase}
            css={{
              width: "1.5rem",
              height: "1.5rem",
            }}
          />

          {t("UnsupportedFeaturesError")}
        </Alert>
      )}

      <noscript>
        <Alert
          id="browser-compatibility-alert"
          css={{
            marginBottom: suomifiDesignTokens.spacing.s,
          }}
          stripe={false}
        >
          <Icon
            icon="error"
            fill={suomifiDesignTokens.colors.alertBase}
            css={{
              width: "1.5rem",
              height: "1.5rem",
            }}
          />
          <MediumContainer
            css={{ textAlign: "left", fontSize: "16px", lineHeight: "24px" }}
          >
            {t("NoScriptError")}
          </MediumContainer>
        </Alert>

        <style>{`
        form {
            opacity: 0.5;
            pointer-events: none;
            cursor: not-allowed;
        }

        button, input {
            opacity: 0.5;
            pointer-events: none;
            cursor: not-allowed;
        }

        form button, form input {
            opacity: 1;
        }
        `}</style>
      </noscript>
    </div>
  )
}
