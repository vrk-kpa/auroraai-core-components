import styled from "styled-components"
import { suomifiDesignTokens } from "suomifi-design-tokens"

type AlertVariant = "error" | "success" | "info"

const colors = {
  error: suomifiDesignTokens.colors.alertLight1,
  success: "#d8f3ed",
  info: suomifiDesignTokens.colors.highlightLight3,
} as { [type in AlertVariant]: string }

const highlightColors = {
  error: suomifiDesignTokens.colors.alertBase,
  success: suomifiDesignTokens.colors.successBase,
  info: suomifiDesignTokens.colors.highlightBase,
} as { [type in AlertVariant]: string }

export const Alert = styled.div<{ variant?: AlertVariant; stripe?: boolean }>`
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
  padding: ${suomifiDesignTokens.spacing.l};
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-wrap: wrap;
  text-align: center;
  gap: ${suomifiDesignTokens.spacing.s};
`
