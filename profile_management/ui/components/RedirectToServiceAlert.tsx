import { Link, suomifiDesignTokens, Button } from "suomifi-ui-components"
import { SmallAlert } from "./styles/SmallAlert"
import useTranslation from "next-translate/useTranslation"
import { getCookie, removeCookies } from "cookies-next"
import { Container } from "./styles/Container"

export function RedirectToServiceAlert({
  onClose,
}: {
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation("common")
  const serviceLink = getCookie("redirectServiceUrl")?.toString() || ""
  const serviceName = getCookie("redirectServiceName")?.toString() || ""

  return (
    <Container
      style={{ margin: "0 auto", marginTop: suomifiDesignTokens.spacing.l }}
    >
      <SmallAlert id="redirect-to-service-alert" variant="infoSecondary">
        <div className="message" style={{ width: "80%", flexGrow: 2 }}>
          <Link
            href={serviceLink}
            style={{
              color: suomifiDesignTokens.colors.brandBase,
              fontWeight: "bold",
            }}
          >
            {t("returnToService")} {serviceName}
          </Link>
        </div>
        <div className="close">
          <Button
            id="close-redirect-alert"
            icon="close"
            aria-label={t("close")}
            onClick={() => {
              onClose()
              removeCookies("redirectServiceUrl")
              removeCookies("redirectServiceName")
            }}
            variant="secondaryNoBorder"
            style={{
              background: "none",
              color: suomifiDesignTokens.colors.brandBase,
              padding: 0,
              outline: "none",
            }}
          ></Button>
        </div>
      </SmallAlert>
    </Container>
  )
}
