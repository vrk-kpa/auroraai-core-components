import useTranslation from "next-translate/useTranslation"
import NextLink from "next/link"
import { PropsWithChildren } from "react"
import { Link, ExternalLink, LinkProps } from "suomifi-ui-components"

export function NavigationLink({
  children,
  external,
  ...props
}: PropsWithChildren<
  LinkProps & Parameters<typeof NextLink>[0] & { external?: boolean }
>): JSX.Element {
  const { t } = useTranslation("common")

  return (
    <NextLink passHref {...props}>
      {external ? (
        <ExternalLink
          id={props.id}
          href="#"
          className={props.className}
          labelNewWindow={t("openInNewWindow")}
        >
          {children}
        </ExternalLink>
      ) : (
        <Link id={props.id} href="#" className={props.className}>
          {children}
        </Link>
      )}
    </NextLink>
  )
}
