import useTranslation from "next-translate/useTranslation"
import { useController, UseControllerProps } from "react-hook-form"
import { css } from "styled-components"
import {
  suomifiDesignTokens,
  TextInput,
  TextInputProps,
  Paragraph,
} from "suomifi-ui-components"

const visuallyHiddenStatusText = css`
  .fi-status-text {
    position: absolute;
    left: -99999px;
    top: -99999px;
  }
`

export type InputProps<T> = TextInputProps &
  UseControllerProps<T> & {
    hideStatusText?: boolean
    customError?: string | JSX.Element
  }

export function Input<T extends Record<string, { toString: () => string }>>({
  hideStatusText = false,
  customError,
  ...props
}: InputProps<T>): JSX.Element {
  const { t } = useTranslation("validation")

  const { field, fieldState } = useController(props)

  const { control, defaultValue, onBlur, ...propsWithoutController } = props

  return (
    <>
      <TextInput
        id={props.id ?? props.name}
        value={field.value?.toString() ?? ""}
        onChange={field.onChange}
        onBlur={(ev) => {
          field.onBlur()
          onBlur?.(ev)
        }}
        ref={field.ref}
        status={customError || fieldState.invalid ? "error" : undefined}
        statusText={
          fieldState.error &&
          t(fieldState.error.type, null, {
            fallback: fieldState.error.message,
          })
        }
        css={hideStatusText ? visuallyHiddenStatusText : undefined}
        {...propsWithoutController}
      />
      <Paragraph
        css={{
          color: suomifiDesignTokens.colors.alertBase,
          marginTop: 5,
          fontWeight: "bold",
          fontSize: "14px",
        }}
        marginBottomSpacing="xxs"
      >
        {customError}
      </Paragraph>
    </>
  )
}
