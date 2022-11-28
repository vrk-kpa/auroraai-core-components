import styled from 'styled-components'
import { suomifiDesignTokens } from 'suomifi-ui-components'

export const ButtonContainer = styled.div`
  margin-top: ${suomifiDesignTokens.spacing.s};
  padding-top: ${suomifiDesignTokens.spacing.s};
  border-top: solid 1px ${suomifiDesignTokens.colors.depthLight1};
  display: flex;
  justify-content: flex-end;
`
