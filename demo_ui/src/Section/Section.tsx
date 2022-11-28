import styled from 'styled-components'
import { Block, BlockProps, suomifiDesignTokens } from 'suomifi-ui-components'

const attributes: BlockProps = {
  padding: 'm',
  variant: 'section',
}

export const Section = styled(Block).attrs(attributes)`
  background-color: ${suomifiDesignTokens.colors.whiteBase};
  border: solid 1px ${suomifiDesignTokens.colors.depthLight1};
  margin: ${suomifiDesignTokens.spacing.l} 0;
`
