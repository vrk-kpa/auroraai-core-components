import useTranslation from "next-translate/useTranslation"
import Trans from "next-translate/Trans"

import {
  suomifiDesignTokens,
  Heading,
  Paragraph,
  Expander,
  ExpanderContent,
  ExpanderTitleButton,
  Link,
  LinkProps,
  Block,
  Button,
} from "suomifi-ui-components"
import { Box } from "./styles/Box"
import { NavigationLinkList } from "./NavigationLinkList"
import { I18n } from "next-translate"
import { css } from "styled-components"
import { useState, useEffect, useCallback } from "react"
import { PropsWithChildren } from "react"
import * as schemas from "shared/schemas"
import { NavigationLink } from "./NavigationLink"
import { Row } from "../components/styles/Row"
import { ScopeList } from "ui/components/ScopeList"
import {
  isRetrievableAttribute,
  isStorableAttribute,
} from "../../shared/util/attributes"
import { Scope, TranslatableString } from "shared/schemas"
import { UUID } from "io-ts-types"
import { profileManagementAPI } from "../api/profileManagementApi"
import { ErrorAlert } from "./ErrorAlert"
import { APIError } from "ui/utils/errors"

const serviceProviderText = css`
  color: ${suomifiDesignTokens.colors.depthDark1};
  font-size: 14px;
  margin-bottom: ${suomifiDesignTokens.spacing.xxs};
`

function LinkOrDiv({
  className,
  children,
  ...props
}: PropsWithChildren<LinkProps>) {
  if (props.href) {
    return (
      <Link className={className} {...props}>
        {children}
      </Link>
    )
  } else {
    return <div className={className}>{children}</div>
  }
}

export function ServiceBox({
  service,
  getSourceServiceName,
  attributeLocalisation,
}: {
  service: schemas.ConnectedService
  getSourceServiceName: (sourceId: string) => TranslatableString
  attributeLocalisation: Record<string, any>
}): JSX.Element {
  const { lang, t } = useTranslation("connectedServices") as I18n & {
    lang: schemas.Language
  }

  const needsDescriptionExpander = service.description[lang].length > 200
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [open, setOpen] = useState(false)
  const [scopesModified, setScopesModified] = useState(false)
  const [visibleScopes, setVisibleScopes] = useState<Record<string, boolean>>(
    {}
  )
  const [savedScopes, setSavedScopes] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<APIError>()
  const [saved, setSaved] = useState(false)

  const setInitialScopes = useCallback(() => {
    if (service.allowedScopes) {
      const initialScopes = Object.fromEntries(
        service.allowedScopes.map((scope) => [
          scope,
          service.retrievableAttributes.some((attr) => attr.name === scope) ||
            service.storableAttributes.some(
              (attr) => attr.name === scope.replace(/^store:/, "")
            ),
        ])
      )
      setVisibleScopes(initialScopes)
      setSavedScopes(initialScopes)
    }
  }, [service])

  useEffect(() => {
    setInitialScopes()
  }, [setInitialScopes])

  const cancelModifyScopes = () => {
    setOpen(false)
    setScopesModified(false)
    setVisibleScopes(savedScopes)
  }

  const selectedScopes = Object.keys(visibleScopes).filter(
    (scope) => visibleScopes[scope]
  ) as Scope[]

  const retrievableScopes = Object.fromEntries(
    Object.entries(visibleScopes).filter(([scope]) =>
      isRetrievableAttribute(scope)
    )
  )

  const storableScopes = Object.fromEntries(
    Object.entries(visibleScopes).filter(([scope]) =>
      isStorableAttribute(scope)
    )
  )

  const handleScopeChangeAcceptButton = async (
    serviceId: UUID,
    newScopes: Scope[]
  ) => {
    setError(undefined)
    setScopesModified(false)
    const response = await profileManagementAPI(true).changeScopes({
      serviceId: serviceId,
      scopes: newScopes,
    })

    if (response && "error" in response) {
      setError(response)
      setScopesModified(true)
      return
    }
    setSavedScopes(visibleScopes)
    setSaved(true)
  }

  const getSourceNames = (sourceIds: string[]) => {
    return sourceIds.map((sourceId) => getSourceServiceName(sourceId))
  }

  const retrievableAttributesSources = () =>
    Object.fromEntries(
      Object.entries(service.retrievableAttributesSources).map(
        ([attr, sourceIds]) => [attr, getSourceNames(sourceIds)]
      )
    )

  const isStored = (scope: string): boolean => {
    return (
      (service.storableAttributes &&
        service.storableAttributes.some((attr) => attr.name === scope) &&
        service.storableAttributes.find((attr) => attr.name === scope)
          ?.isStored) ??
      false
    )
  }

  const onScopeModified = (scope: string, included: boolean) => {
    const newScopes = { ...visibleScopes, [scope]: included }
    const modifiedScopes = Object.keys(savedScopes).filter(
      (savedScope) => savedScopes[savedScope] != newScopes[savedScope]
    )
    setVisibleScopes(newScopes)
    setScopesModified(modifiedScopes.length > 0)
  }

  const getStorableAttributesCount = () => {
    return Object.keys(savedScopes).filter(
      (scope) => scope.startsWith("store:") && savedScopes[scope]
    ).length
  }

  const getRetrievableAttributesCount = () => {
    return Object.keys(savedScopes).filter(
      (scope) => !scope.startsWith("store:") && savedScopes[scope]
    ).length
  }

  const description = descriptionExpanded
    ? service.description[lang]
    : `${service.description[lang].slice(0, 200)}${
        needsDescriptionExpander ? "..." : ""
      }`

  return (
    <Box
      id={service.id}
      key={JSON.stringify([service.provider, service.name])}
      css={{
        padding: suomifiDesignTokens.spacing.s,
        marginBottom: suomifiDesignTokens.spacing.s,
      }}
    >
      {error && <ErrorAlert error={error} />}
      <div css={serviceProviderText}>{service.provider[lang]}</div>

      <div
        css={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: suomifiDesignTokens.spacing.s,
          marginBottom: suomifiDesignTokens.spacing.xxs,
        }}
      >
        <LinkOrDiv
          href={service.link[lang]}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <Heading
            id={`service-header-${service.id}`}
            variant="h2"
            css={{ color: "inherit", fontSize: "22px !important" }}
          >
            {service.name[lang]}
          </Heading>
        </LinkOrDiv>
      </div>

      {description.split(/\n+/).map((paragraph) => (
        <Paragraph marginBottomSpacing="xs" key={paragraph}>
          {paragraph}
        </Paragraph>
      ))}

      {needsDescriptionExpander && (
        <Link
          href="#"
          role="button"
          onClick={(e) => {
            e.preventDefault()
            setDescriptionExpanded(!descriptionExpanded)
          }}
        >
          {t(descriptionExpanded ? "common:hide" : "common:readMore")}
        </Link>
      )}

      <ul>
        <li>
          <Trans
            i18nKey="connectedServices:storableAttributesCount"
            components={{
              strong: <strong />,
            }}
            values={{
              serviceName: service.name[lang],
              count: getStorableAttributesCount(),
            }}
          />
        </li>
        <li>
          <Trans
            i18nKey="connectedServices:retrievableAttributesCount"
            components={{
              strong: <strong />,
            }}
            values={{
              serviceName: service.name[lang],
              count: getRetrievableAttributesCount(),
            }}
          />
        </li>
      </ul>

      <Expander
        open={open}
        onOpenChange={(open) => {
          setSaved(false)
          setOpen(!open)
        }}
      >
        <ExpanderTitleButton>{t("modifyService")}</ExpanderTitleButton>
        <ExpanderContent>
          <Paragraph marginBottomSpacing="m">
            <Trans
              i18nKey="connectedServices:showStorableAttributes"
              components={{
                strong: <strong />,
              }}
              values={{ serviceName: service.name[lang] }}
            />
          </Paragraph>

          <ScopeList
            scopes={storableScopes}
            onScopeModified={onScopeModified}
            serviceName={service.name[lang]}
            serviceId={service.id}
            isStored={isStored}
            attributeLocalisation={attributeLocalisation}
          />

          <Paragraph marginBottomSpacing="m">
            <Trans
              i18nKey="connectedServices:showRetrievableAttributes"
              components={{
                strong: <strong />,
              }}
              values={{ serviceName: service.name[lang] }}
            />
          </Paragraph>

          <ScopeList
            scopes={retrievableScopes}
            onScopeModified={onScopeModified}
            sources={retrievableAttributesSources()}
            serviceName={service.name[lang]}
            serviceId={service.id}
            attributeLocalisation={attributeLocalisation}
          />

          <Block
            css={{
              marginTop: suomifiDesignTokens.spacing.m,
              marginBottom: suomifiDesignTokens.spacing.m,
            }}
          >
            <NavigationLink href="/read-more">
              {t("readMoreAboutPermissions")}
            </NavigationLink>
          </Block>

          <NavigationLinkList
            links={[
              {
                link: `/connected-services/deactivate/${service.id}`,
                name: t("removeService"),
                id: `${service.id}-service-remove-link`,
              },
            ]}
            css={{
              marginBottom: suomifiDesignTokens.spacing.m,
              marginTop: suomifiDesignTokens.spacing.m,
            }}
          ></NavigationLinkList>

          {saved && (
            <Paragraph marginBottomSpacing="s">{t("saveSuccessful")}</Paragraph>
          )}

          <Row gap={suomifiDesignTokens.spacing.s}>
            <Button
              disabled={!scopesModified}
              id={`${service.id}-accept-button`}
              onClick={() =>
                handleScopeChangeAcceptButton(service.id, selectedScopes)
              }
            >
              {t("common:accept")}
            </Button>
            <Button
              id={`${service.id}-cancel-button`}
              variant="secondary"
              type="reset"
              onClick={(): void => {
                cancelModifyScopes()
              }}
            >
              {t("common:cancel")}
            </Button>
          </Row>
        </ExpanderContent>
      </Expander>
    </Box>
  )
}
