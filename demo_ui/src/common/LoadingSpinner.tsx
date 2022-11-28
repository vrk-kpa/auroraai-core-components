import { suomifiDesignTokens } from 'suomifi-ui-components'
import FadeLoader from 'react-spinners/FadeLoader'
import styled from 'styled-components'

const Container = styled.div`
  margin-top: ${suomifiDesignTokens.spacing.m};
  margin-bottom: ${suomifiDesignTokens.spacing.m};
  display: flex;
  flex-direction: column;
  align-items: center;
`

export function LoadingSpinner({ msg }: { msg?: string }): JSX.Element {
  return (
    <Container id='loading-spinner' aria-live='polite' aria-busy='true'>
      <FadeLoader color={suomifiDesignTokens.colors.highlightBase} loading={true} />
      <span role='status'>{msg ?? 'Ladataan...'}</span>
    </Container>
  )
}
