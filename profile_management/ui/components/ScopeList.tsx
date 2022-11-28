import type { Translate } from "next-translate"
import useTranslation from "next-translate/useTranslation"
import { Language, TranslatableString } from "shared/schemas"
import { css } from "styled-components"
import { Checkbox, suomifiDesignTokens } from "suomifi-ui-components"
import {
  isRetrievableAttribute,
  isStorableAttribute,
} from "../../shared/util/attributes"

const scopeList = css`
  display: flex;
  flex-direction: column;
  gap: ${suomifiDesignTokens.spacing.s};
  margin: ${suomifiDesignTokens.spacing.m} 0;
  padding: 0;
  list-style-type: none;
`

const getHintText = (
  t: Translate,
  lang: Language,
  scope: string,
  serviceName: string,
  sources?: Record<string, TranslatableString[]>
): string | undefined => {
  // loading
  if (!sources) return undefined

  // sources have loaded but scope can't be found
  if (!(scope in sources)) return t("notAvailable", { serviceName })

  // special case if there's just 1 source, i.e. available in source[s] x[, y]
  const availableInKey =
    sources[scope].length === 1 ? "availableIn" : "availableInMultiple"

  // adds the suffix "and in x other services" if there's more than 3 services
  const suffix =
    sources[scope].length > 3
      ? ` ${t("andInXMore", { count: sources[scope].length - 3 })}`
      : ""

  return `${t(availableInKey, {
    serviceNames: sources[scope]
      .slice(0, 3)
      .map((source) => source[lang])
      .join(", "),
  })}${suffix}`
}

const getIsStoredText = (
  scope: string,
  isStored: (scope: string) => boolean,
  t: Translate
) => {
  return isStored(scope.replace(/^store:/, ""))
    ? ` (${t("given")})`
    : ` (${t("notGiven")})`
}

export function ScopeList({
  type,
  scopes,
  onScopeModified,
  sources,
  serviceName,
  serviceId,
  isStored,
  attributeLocalisation,
}: {
  type?: "checkbox" | "bullet"
  scopes: Record<string, boolean>
  onScopeModified: (scope: string, included: boolean) => void
  sources?: Record<string, TranslatableString[]>
  serviceName: string
  serviceId: string
  isStored?: (scope: string) => boolean
  attributeLocalisation: Record<string, any>
}): JSX.Element {
  const { t, lang } = useTranslation("attributes")

  const translateScope = (scope: string) => {
    const trimmedScope = scope.replace(/^store:/, "")
    return attributeLocalisation[trimmedScope]?.name?.[lang] ?? trimmedScope
  }

  return (
    <ul css={type === "bullet" ? "" : scopeList}>
      {Object.entries(scopes).map(([scope, checked]) => (
        <li key={scope}>
          {type && type === "bullet" ? (
            <span>{translateScope(scope)} </span>
          ) : (
            <Checkbox
              id={`${serviceId}-${scope.replace(/^store:/, "")}-checkbox`}
              checked={checked}
              onClick={({ checkboxState }) =>
                onScopeModified(scope, checkboxState)
              }
            >
              {translateScope(scope)}

              {isStorableAttribute(scope) &&
                isStored &&
                getIsStoredText(scope, isStored, t)}

              {isRetrievableAttribute(scope) &&
                sources &&
                ` (${getHintText(
                  t,
                  lang as Language,
                  scope,
                  serviceName,
                  sources
                )})`}
            </Checkbox>
          )}
        </li>
      ))}
    </ul>
  )
}
