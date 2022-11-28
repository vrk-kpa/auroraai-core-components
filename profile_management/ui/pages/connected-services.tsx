import { NextPage, NextPageContext } from "next"
import { Refetchable, withRefetchables } from "../api/apiSession"
import { profileManagementAPI, User } from "../api/profileManagementApi"
import { DashboardLayout } from "../components/DashboardLayout"
import {
  Heading,
  Paragraph,
  Text,
  suomifiDesignTokens,
  Block,
} from "suomifi-ui-components"
import useTranslation from "next-translate/useTranslation"
import { I18n } from "next-translate"
import { Head } from "../components/Head"
import { UserContext, useUpdateUserContextWithProps } from "../contexts/user"
import { ServiceBox } from "../components/ServiceBox"
import { useContext, useState } from "react"
import { useAsyncProps } from "../hooks/useAsyncProps"
import { ErrorAlert } from "../components/ErrorAlert"
import * as schemas from "shared/schemas"
import { useRouter } from "next/router"
import { ServiceDeactivationModal } from "../components/ServiceDeactivationModal"
import { MultilineParagraph } from "../components/MultilineParagraph"
import { APIError } from "../utils/errors"
import { NavigationLink } from "../components/NavigationLink"
import { Pagination } from "ui/components/Pagination"
import { TranslatableString } from "shared/schemas"
import { attributesManagementAPI } from "../attributesManagementApi/attributesManagementApi"

const ServicesPerPage = 5

type ConnectedServicesProps = {
  services: schemas.ConnectedService[] | APIError
  user: User | APIError
  attributeLocalisation: Record<string, any>
}

const getProps = async (
  { user }: { user?: User },
  ctx?: NextPageContext
): Promise<ConnectedServicesProps> => {
  const [userData, services, attributeLocalisation] = await Promise.all([
    user ?? profileManagementAPI(true, ctx).getUser(),
    profileManagementAPI(true, ctx).getConnectedServices(),
    attributesManagementAPI(ctx).getLocalisation(),
  ])

  return {
    services,
    user: userData,
    attributeLocalisation:
    "error" in attributeLocalisation
      ? {}
      : (attributeLocalisation as Record<string, any>),
  }
}
function ServiceList({
  services,
  attributeLocalisation,
}: {
  services: schemas.ConnectedService[],
  attributeLocalisation: Record<string, any>
}): JSX.Element {
  const { t } = useTranslation("connectedServices") as I18n & {
    lang: schemas.Language
  }
  const [visibleServices, setVisibleServices] = useState<
    schemas.ConnectedService[]
  >(services.slice(0, ServicesPerPage))

  const getSourceServiceName = (serviceId: string): TranslatableString => {
    return services.find((service) => service.id === serviceId)!.name
  }

  return (
    <>
      <Paragraph marginBottomSpacing="m">
        <Text variant="bold">
          {services.length > 0
            ? t("connectedServicesTotal", { count: services.length })
            : t("noConnectedServices")}
        </Text>
      </Paragraph>
      {visibleServices.length > 0 &&
        visibleServices.map((service) => (
          <ServiceBox
            key={service.id}
            service={service}
            getSourceServiceName={getSourceServiceName}
            attributeLocalisation={attributeLocalisation}
          />
        ))}
      <Pagination
        items={services}
        itemsPerPage={ServicesPerPage}
        onChange={(slicedServices) =>
          setVisibleServices(slicedServices as schemas.ConnectedService[])
        }
      />
    </>
  )
}

const ConnectedServices: NextPage<Refetchable<ConnectedServicesProps>> = (
  initialProps
) => {
  const { t, lang } = useTranslation("connectedServices") as I18n & {
    lang: schemas.Language
  }

  const { props, refresh } = useAsyncProps(
    initialProps,
    getProps,
    useContext(UserContext)
  )

  useUpdateUserContextWithProps(props)

  const router = useRouter()

  const { services, attributeLocalisation } = props ?? {}

  const selectedService: schemas.ConnectedService | APIError | undefined =
    !services
      ? undefined
      : "error" in services
      ? services
      : services.find(
          (service) => service.id === router.query.serviceId?.toString()
        ) ?? { error: "NotFoundError", message: "Service not found." }

  return (
    <DashboardLayout>
      <Head pageName={t("title")} />

      <ServiceDeactivationModal
        visible={router.route === "/connected-services/deactivate/[serviceId]"}
        close={(needsRefresh) => {
          if (needsRefresh) refresh()
          router.push("/connected-services")
        }}
        service={selectedService}
      />

      <Heading
        id="connected-services-heading"
        variant="h1"
        css={{ marginBottom: suomifiDesignTokens.spacing.m }}
      >
        {t("heading")}
      </Heading>

      <MultilineParagraph text={t("intro")} marginBottomSpacing="m" />

      <Block
        css={{
          marginTop: suomifiDesignTokens.spacing.m,
          marginBottom: suomifiDesignTokens.spacing.m,
        }}
      >
        <NavigationLink
          href="/read-more"
          css={{
            marginTop: suomifiDesignTokens.spacing.m,
            marginBottom: suomifiDesignTokens.spacing.m,
          }}
        >
          {t("readMoreAboutPermissions")}
        </NavigationLink>
      </Block>

      {services ? (
        "error" in services ? (
          <ErrorAlert error={services} />
        ) : (
          <ServiceList
            services={services.sort((a, b) =>
              a.name[lang] > b.name[lang] ? 1 : -1
            )}
            attributeLocalisation={attributeLocalisation ?? {}}
          />
        )
      ) : (
        t("common:loading")
      )}
    </DashboardLayout>
  )
}

ConnectedServices.getInitialProps = withRefetchables((ctx) => getProps({}, ctx))

export default ConnectedServices
