import { PropsWithChildren } from "react"
import { css } from "styled-components"
import { suomifiDesignTokens } from "suomifi-ui-components"
import { breakpoints } from "../breakpoints"
import { PasswordCriteriaBox } from "./PasswordCriteriaBox"

const formInputContainer = css`
  display: flex;

  @media (max-width: ${breakpoints.md}) {
    flex-direction: column;
  }
`

const passwordCriteria = css`
  flex-grow: 1;
  margin-left: ${suomifiDesignTokens.spacing.m};

  @media (max-width: ${breakpoints.md}) {
    margin-left: 0;
    margin-bottom: ${suomifiDesignTokens.spacing.m};
  }
`

export function PasswordCriteriaForm({
  children,
  password,
}: PropsWithChildren<{ password: string }>): JSX.Element {
  return (
    <div css={formInputContainer}>
      <div>{children}</div>

      <PasswordCriteriaBox password={password} css={passwordCriteria} />
    </div>
  )
}
