import Trans from "next-translate/Trans"
import useTranslation from "next-translate/useTranslation"
import { useState } from "react"
import { ConnectedService, Language } from "shared/schemas"
import {
  Modal,
  ModalContent,
  ModalTitle,
  Paragraph,
  ModalFooter,
  Button,
} from "suomifi-ui-components"
import { profileManagementAPI } from "../api/profileManagementApi"
import { ErrorAlert } from "./ErrorAlert"
import { MultilineParagraph } from "../components/MultilineParagraph"
import { DangerButton } from "./styles/DangerButton"
import { APIError } from "../utils/errors"

export function ServiceDeactivationModal({
  visible,
  close,
  service,
}: {
  visible: boolean
  close: (needsRefresh: boolean) => void
  service?: APIError | ConnectedService
}): JSX.Element {
  const { t, lang } = useTranslation("connectedServicesDeactivation")

  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isDeactivationSuccess, setIsDeactivationSuccess] = useState(false)
  const [error, setError] = useState<APIError>()

  const deactivate = async () => {
    if (!service || "error" in service) {
      setError({ error: "InternalServerError", message: "Error" })
      return
    }

    setIsDeactivating(true)

    const response = await profileManagementAPI(true).oauthDeactivate({
      auroraAIServiceId: service.id,
    })

    if (response && "error" in response) {
      setError(error)
    } else {
      setIsDeactivationSuccess(true)
    }

    setIsDeactivating(false)
  }

  const closeModal = () => {
    setIsDeactivationSuccess(false)
    close(true)
  }

  return (
    <Modal
      appElementId="__next"
      visible={visible}
      onEscKeyDown={() => close(false)}
    >
      {isDeactivationSuccess ? (
        <ServiceDeactivationSuccessModal close={closeModal} />
      ) : (
        <>
          <ModalContent>
            <ModalTitle>{t("heading")}</ModalTitle>
            {!service ? (
              t("common:loading")
            ) : "error" in service ? (
              <ErrorAlert error={service} />
            ) : (
              <>
                {error && <ErrorAlert error={error} />}

                <Paragraph marginBottomSpacing="s">
                  <Trans
                    i18nKey="connectedServicesDeactivation:intro"
                    values={{
                      serviceName: service.name[lang as Language],
                    }}
                    components={{
                      strong: <strong />,
                    }}
                  />
                </Paragraph>
              </>
            )}
          </ModalContent>
          <ModalFooter>
            <DangerButton
              id="remove-service-button"
              disabled={isDeactivating}
              onClick={deactivate}
            >
              {t("remove")}
            </DangerButton>
            <Button
              id="remove-service-cancel"
              onClick={() => close(false)}
              variant="secondary"
            >
              {t("common:cancel")}
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}

const ServiceDeactivationSuccessModal = (props: { close: () => void }) => {
  const { t } = useTranslation("connectedServicesDeactivation")
  return (
    <>
      <ModalContent>
        <ModalTitle>{t("heading")}</ModalTitle>
        <MultilineParagraph text={t("success")} marginBottomSpacing="m" />
      </ModalContent>
      <ModalFooter>
        <Button
          id="service-deactivated-continue"
          variant="default"
          onClick={() => props.close()}
        >
          {t("common:continue")}
        </Button>
      </ModalFooter>
    </>
  )
}
