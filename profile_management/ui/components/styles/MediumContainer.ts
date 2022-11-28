import styled from "styled-components"
import { suomifiDesignTokens } from "suomifi-design-tokens"

export const MediumContainer = styled.div<{ center?: boolean }>`
  width: 100%;
  max-width: 768px;
  padding-left: ${suomifiDesignTokens.spacing.insetXxl};
  padding-right: ${suomifiDesignTokens.spacing.insetXxl};

  margin: ${({ center }): string => (center ? "0 auto" : "0")};
`
