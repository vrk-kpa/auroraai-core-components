import styled from "styled-components"
import { Button } from "suomifi-ui-components"

export const DangerButton = styled(Button)`
  background: linear-gradient(0deg, hsl(3, 59%, 42%) 0%, hsl(3, 59%, 48%) 100%);

  :hover {
    background: linear-gradient(
      0deg,
      hsl(3, 59%, 48%) 0%,
      hsl(3, 59%, 54%) 100%
    );
  }

  :active {
    background: hsl(3, 59%, 42%);
  }
`
