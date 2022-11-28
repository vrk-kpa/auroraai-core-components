import useTranslation from "next-translate/useTranslation"
import React from "react"
import { InlineAlert, suomifiDesignTokens } from "suomifi-ui-components"
import { Container } from "./styles/Container"
import { MediumContainer } from "./styles/MediumContainer"

export function EnvironmentAlert({
  environment,
}: {
  environment: string
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Container
      center
      size="wide"
      style={{ marginTop: suomifiDesignTokens.spacing.l }}
    >
      <MediumContainer center>
        <InlineAlert status="warning" labelText={t("infoMessages:attention")}>
          {t("infoMessages:environmentMessage", {
            environment: environment.toUpperCase(),
          })}
        </InlineAlert>
      </MediumContainer>
    </Container>
  )
}
