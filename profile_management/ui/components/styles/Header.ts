import styled from "styled-components"
import { suomifiDesignTokens } from "suomifi-ui-components"

export const Header = styled.header`
  padding: 15px;
  border-top: 4px solid ${suomifiDesignTokens.colors.brandBase};
  background-color: ${suomifiDesignTokens.colors.whiteBase};
  border-bottom: 1px solid ${suomifiDesignTokens.colors.depthLight1};
  display: flex;
  justify-content: center;
  width: 100%;
`
