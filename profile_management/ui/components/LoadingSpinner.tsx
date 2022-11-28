import useTranslation from "next-translate/useTranslation"
import { suomifiDesignTokens } from "suomifi-ui-components"
import FadeLoader from "react-spinners/FadeLoader"
import { Container } from "./styles/Container"

export function LoadingSpinner({ msg }: { msg?: string }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Container
      id="loading-spinner"
      aria-live="polite"
      aria-busy="true"
      css={{
        marginBottom: suomifiDesignTokens.spacing.s,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <FadeLoader
        color={suomifiDesignTokens.colors.highlightBase}
        loading={true}
      />
      <span role="status">{msg ? t(msg) : t("common:loading")}</span>
    </Container>
  )
}
