import useTranslation from "next-translate/useTranslation"
import { css } from "styled-components"
import { suomifiDesignTokens } from "suomifi-ui-components"
import NextLink from "next/link"
import { User } from "../api/profileManagementApi"
import { breakpoints } from "../breakpoints"
import { InlineLanguageSelector } from "./InlineLanguageSelector"
import { DetailedHTMLProps, HTMLAttributes } from "react"

const popover = css`
  background-color: ${suomifiDesignTokens.colors.whiteBase};
  border: 1px solid ${suomifiDesignTokens.colors.depthLight1};
  box-shadow: 0 2px 3px 0 rgb(0 0 0 / 20%);
  border-radius: 2px;
  width: 27.8125rem;
  position: absolute;
  z-index: 1000;
  top: calc(100% + 0.8rem);
  right: -0.5rem;

  ::before,
  ::after {
    bottom: 100%;
    right: 1.125rem;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }

  ::before {
    border-bottom-color: ${suomifiDesignTokens.colors.depthLight1};
    border-width: 13px;
    margin-right: -5px;
  }

  ::after {
    border-bottom-color: ${suomifiDesignTokens.colors.whiteBase};
    border-width: 12px;
    margin-right: -4px;
  }

  @media (max-width: ${breakpoints.sm}) {
    top: 100%;
    left: 0;
    right: 0;
    width: auto;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;

    ::before {
      margin-right: 24px;
    }

    ::after {
      margin-right: 25px;
    }
  }
`

export const logOutLink = css`
  font-weight: bold;
  text-transform: uppercase;
  color: ${suomifiDesignTokens.colors.highlightBase};
  font-size: 10pt;
  cursor: pointer;
  text-decoration: none;

  :hover {
    text-decoration: underline;
  }
`

const languageChooser = css`
  display: none;

  @media (max-width: ${breakpoints.md}) {
    display: flex;
  }
`

const userInfo = css`
  padding: ${suomifiDesignTokens.spacing.insetXxl};
  border-bottom: 1px solid ${suomifiDesignTokens.colors.depthLight1};
  flex-direction: column;
  align-items: center;
  gap: ${suomifiDesignTokens.spacing.s};
  text-align: center;
  display: none;

  @media (max-width: ${breakpoints.sm}) {
    display: flex;
  }
`

export function MenuPopover({
  user,
  ...rest
}: {
  user?: User
} & DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>): JSX.Element {
  const { t } = useTranslation("common")

  return (
    <div css={popover} {...rest}>
      {user && (
        <div css={userInfo}>
          <div
            css={{
              fontWeight: "bold",
              wordBreak: "break-all",
            }}
          >
            {user.email}
          </div>
          <NextLink href="/logout" passHref>
            <a css={logOutLink}>{t("logOut")}</a>
          </NextLink>
        </div>
      )}
      <InlineLanguageSelector css={languageChooser} />
    </div>
  )
}
