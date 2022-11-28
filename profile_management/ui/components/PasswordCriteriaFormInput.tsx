import { css } from "styled-components"
import { suomifiDesignTokens } from "suomifi-ui-components"
import { breakpoints } from "../breakpoints"
import { InputProps } from "./Input"
import { PasswordInput } from "../components/PasswordInput"

const passwordContainer = css`
  margin-bottom: ${suomifiDesignTokens.spacing.s};
  position: relative;
  word-break: break-word;

  @media (max-width: ${breakpoints.sm}) {
    display: block;
  }
`
const passwordCriteriaArrow = css`
  position: absolute;
  right: calc(-${suomifiDesignTokens.spacing.m} - 1px);
  z-index: 100;
  top: 42px;

  ::before,
  ::after {
    right: 100%;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }

  ::before {
    border-right-color: ${suomifiDesignTokens.colors.depthLight1};
    border-width: 13px;
  }

  ::after {
    border-right-color: ${suomifiDesignTokens.colors.whiteBase};
    border-width: 12px;
    margin-top: 1px;
  }

  @media (max-width: ${breakpoints.md}) {
    display: none;
  }
`

export function PasswordCriteriaFormInput<T>(
  props: Partial<InputProps<T>>
): JSX.Element {
  return (
    <div css={passwordContainer}>
      <PasswordInput
        autoComplete={props.autoComplete ?? "new-password"}
        css={{ flexShrink: 0 }}
        {...(props as unknown)}
      />

      <div css={passwordCriteriaArrow} />
    </div>
  )
}
