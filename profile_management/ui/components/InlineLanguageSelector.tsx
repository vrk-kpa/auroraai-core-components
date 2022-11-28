import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router"
import { css } from "styled-components"
import { suomifiDesignTokens, Link } from "suomifi-ui-components"
import { languages } from "./LanguageSelector"
import NextLink from "next/link"

const languageChooser = css`
  padding: ${suomifiDesignTokens.spacing.insetXxl};
  display: flex;
  justify-content: center;
  gap: ${suomifiDesignTokens.spacing.s};
  flex-wrap: wrap;
  text-align: center;
`

const languageLink = css`
  font-size: inherit;
  text-transform: uppercase;
`

const activeLanguageLink = css`
  color: ${suomifiDesignTokens.colors.blackBase} !important;
`

export function InlineLanguageSelector({
  className,
}: {
  className?: string
}): JSX.Element {
  const { lang } = useTranslation()
  const router = useRouter()

  return (
    <div className={className} css={languageChooser} role="list">
      {languages.map(({ language, menuLabel }) => (
        <NextLink
          key={JSON.stringify([language, menuLabel])}
          href={router.asPath}
          locale={language}
          passHref
        >
          <Link
            href="#"
            lang={language}
            css={[languageLink].concat(
              lang === language ? [activeLanguageLink] : []
            )}
            aria-current={lang === language}
            role="listitem"
          >
            {menuLabel}
          </Link>
        </NextLink>
      ))}
    </div>
  )
}
