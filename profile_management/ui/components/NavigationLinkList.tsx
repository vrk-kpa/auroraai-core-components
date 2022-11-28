import React, { PropsWithChildren } from "react"
import { Icon, suomifiDesignTokens } from "suomifi-ui-components"
import { NavigationLink } from "./NavigationLink"
import { css } from "styled-components"

const container = css`
  list-style-type: none;
  margin: 0;
  padding: 0;
`

const linkListItem = css`
  display: flex;
  align-items: center;
  margin-bottom: ${suomifiDesignTokens.spacing.xxs};
`

export interface NavigationLinkListLink {
  link: string
  name: string
  scroll?: boolean
  external?: boolean
  disabled?: boolean
  id?: string
}

interface NavigationLinkListProps {
  className?: string
  links: NavigationLinkListLink[]
}

export function NavigationLinkList({
  className,
  links,
}: PropsWithChildren<NavigationLinkListProps>): JSX.Element {
  return (
    <ul className={className} css={container}>
      {links.map(({ link, name, scroll, external, disabled, id }) => (
        <li key={link} css={linkListItem}>
          <Icon
            icon="linkList"
            css={{
              marginRight: suomifiDesignTokens.spacing.xxs,
              flexShrink: 0,
              marginTop: "2px",
              width: "1rem",
              height: "1rem",
            }}
          />
          <NavigationLink
            id={id}
            href={link}
            css={{
              fontSize: "inherit",
              ...(disabled
                ? {
                    color: `${suomifiDesignTokens.colors.depthDark3} !important`,
                    pointerEvents: "none",
                  }
                : {}),
            }}
            scroll={scroll}
            external={external}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer nofollow" : undefined}
          >
            {name}
          </NavigationLink>
        </li>
      ))}
    </ul>
  )
}
