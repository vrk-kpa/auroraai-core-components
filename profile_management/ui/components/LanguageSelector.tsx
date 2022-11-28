import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router"
import * as schemas from "shared/schemas"
import {
  LanguageMenu,
  LanguageMenuItem,
  LanguageMenuProps,
} from "suomifi-ui-components"

export const languages: { menuLabel: string; language: schemas.Language }[] = [
  {
    menuLabel: "Suomeksi (FI)",
    language: "fi",
  },
  {
    menuLabel: "På Svenska (SV)",
    language: "sv",
  },
]

export function LanguageSelector(
  props: Omit<LanguageMenuProps, "name">
): JSX.Element {
  const { lang } = useTranslation()
  const router = useRouter()

  return (
    <LanguageMenu
      name={
        languages.find(({ language }) => language === lang)?.menuLabel ?? lang
      }
      {...props}
    >
      {languages.map(({ language, menuLabel }) => (
        <LanguageMenuItem
          onSelect={(): void => {
            router.push(router.asPath, router.asPath, {
              locale: language,
            })
          }}
          key={language}
          selected={language === lang}
        >
          {menuLabel}
        </LanguageMenuItem>
      ))}
    </LanguageMenu>
  )
}
