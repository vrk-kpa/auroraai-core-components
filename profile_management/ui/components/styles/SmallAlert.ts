import styled from "styled-components"
import { suomifiDesignTokens } from "suomifi-design-tokens"

type AlertVariant = "error" | "success" | "info" | "infoSecondary"

const colors = {
  error: suomifiDesignTokens.colors.alertLight1,
  success: "#d8f3ed",
  info: suomifiDesignTokens.colors.highlightLight3,
  infoSecondary: suomifiDesignTokens.colors.highlightLight3,
} as { [type in AlertVariant]: string }

const highlightColors = {
  error: suomifiDesignTokens.colors.alertBase,
  success: suomifiDesignTokens.colors.successBase,
  info: suomifiDesignTokens.colors.highlightBase,
  infoSecondary: suomifiDesignTokens.colors.brandBase,
} as { [type in AlertVariant]: string }

export const SmallAlert = styled.div<{
  variant?: AlertVariant
  stripe?: boolean
}>`
  background-color: ${({ variant }): string =>
    variant ? colors[variant] : suomifiDesignTokens.colors.alertLight1};
  border-left: ${({ stripe = true, variant }): string =>
    stripe
      ? `4px solid ${
          variant
            ? highlightColors[variant]
            : suomifiDesignTokens.colors.alertBase
        }`
      : ""};
  padding: ${suomifiDesignTokens.spacing.xs};
  font-weight: bold;
  width: 40%;
  flex-wrap: wrap;
  min-width: 15rem;
  gap: ${suomifiDesignTokens.spacing.s};
  color: ${suomifiDesignTokens.colors.brandBase};
  display: flex;
  justify-content: center;
  align-items: center;
`
