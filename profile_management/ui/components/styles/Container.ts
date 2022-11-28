import styled from "styled-components"
import { suomifiDesignTokens } from "suomifi-design-tokens"

type Size = "wide" | "medium" | "small"

const sizes = {
  small: "640px",
  medium: "768px",
  wide: "1140px",
} as Record<Size, string>

export const Container = styled.div<{ size?: Size; center?: boolean }>`
  width: 100%;
  max-width: ${({ size }): string => sizes[size ?? "wide"]};
  padding-left: ${suomifiDesignTokens.spacing.insetXxl};
  padding-right: ${suomifiDesignTokens.spacing.insetXxl};

  margin: ${({ center }): string => (center ? "0 auto" : "0")};
`
