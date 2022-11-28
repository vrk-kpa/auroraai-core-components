import useTranslation from "next-translate/useTranslation"
import { useState } from "react"
import { css } from "styled-components"
import { suomifiDesignTokens, Checkbox } from "suomifi-ui-components"
import { breakpoints } from "../breakpoints"
import { Input, InputProps } from "./Input"

const passwordContainer = css`
  margin-bottom: ${suomifiDesignTokens.spacing.s};
  position: relative;
  word-break: break-word;

  .show-password-icon {
    position: absolute;
    top: 45px;
    right: 10px;
  }

  @media (max-width: ${breakpoints.sm}) {
    display: block;
  }
`

export function PasswordInput<T>(props: Partial<InputProps<T>>): JSX.Element {
  const { t } = useTranslation()
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)

  return (
    <div css={passwordContainer}>
      <Input
        name={props.name ?? "password"}
        labelText={props.labelText ?? t("common:password")}
        visualPlaceholder={t("common:password").toLowerCase()}
        type={passwordVisible ? "text" : "password"}
        autoComplete={props.autoComplete || "new-password"}
        css={{ flexShrink: 0 }}
        {...(props as unknown)}
      />

      <Checkbox
        id={props.id + "-show-password"}
        checked={passwordVisible}
        onClick={({ checkboxState }) => setPasswordVisible(checkboxState)}
      >
        {t("common:showPassword")}
      </Checkbox>
    </div>
  )
}
