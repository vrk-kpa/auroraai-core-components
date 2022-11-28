import useTranslation from "next-translate/useTranslation"
import Trans from "next-translate/Trans"
import { HTMLAttributes } from "react"
import { css } from "styled-components"
import { Icon, suomifiDesignTokens } from "suomifi-ui-components"
import * as schemas from "shared/schemas"

const pwBox = css`
  background-color: ${suomifiDesignTokens.colors.whiteBase};
  border: 1px solid ${suomifiDesignTokens.colors.depthLight1};
  border-radius: 2px;
  padding: ${suomifiDesignTokens.spacing.insetM};
  font-size: 15px;
`

const criteriaList = css`
  margin: 0;
  padding: 0;
  list-style-type: none;
  display: flex;
  flex-direction: column;
  gap: ${suomifiDesignTokens.spacing.s};
`

const criteriaListItem = css`
  display: flex;
  align-items: center;
  gap: ${suomifiDesignTokens.spacing.xs};
`

const validationIcon = css`
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
`

const requirements = {
  length: (pw) => pw.length >= 12 && pw.length <= 99,
  minUppercase: (pw) => /[A-Z]/.test(pw),
  minLowercase: (pw) => /[a-z]/.test(pw),
  minNumber: (pw) => /[0-9]/.test(pw),
  minSpecialCharacter: (pw) => schemas.SPECIAL_CHARS.test(pw),
  restrictedCharacters: (pw) =>
    new RegExp(`^([A-Za-z0-9]|${schemas.SPECIAL_CHARS.source})+$`).test(pw),
  allowedSpecialCharacters: (pw) =>
    !new RegExp(
      `[^A-Za-z0-9ÄÖÅäöå${schemas.SPECIAL_CHARS.source.slice(1, -1)}]`
    ).test(pw),
  noUmlauts: (pw) => !/[äöåÄÖÅ]/.test(pw),
} as Record<string, (pw: string) => boolean>

export function PasswordCriteriaBox({
  password,
  ...props
}: {
  password: string
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { t } = useTranslation("common")

  return (
    <div css={pwBox} {...props}>
      <ul css={criteriaList}>
        <div css={{ fontWeight: "bold" }} role="heading">
          {t("passwordCriteria")}
        </div>
        {Object.entries(requirements).map(([requirement, validate]) => (
          <li key={requirement} css={criteriaListItem}>
            {validate(password) ? (
              <Icon
                icon="checkCircle"
                css={validationIcon}
                fill={suomifiDesignTokens.colors.successBase}
                aria-label={t("criterionMet")}
              />
            ) : (
              <Icon
                icon="error"
                css={validationIcon}
                fill={suomifiDesignTokens.colors.alertBase}
                aria-label={t("criterionNotMet")}
              />
            )}

            <div>
              <Trans
                i18nKey={`common:passwordRequirements.${requirement}`}
                components={{
                  pre: (
                    <pre
                      css={{
                        display: "block",
                        margin: 0,
                        marginTop: suomifiDesignTokens.spacing.xxs,
                      }}
                    />
                  ),
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
