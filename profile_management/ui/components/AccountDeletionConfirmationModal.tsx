import useTranslation from "next-translate/useTranslation"
import {
  Modal,
  ModalContent,
  ModalTitle,
  Paragraph,
  ModalFooter,
  Button,
} from "suomifi-ui-components"
import { DangerButton } from "./styles/DangerButton"

export function AccountDeletionConfirmationModal({
  visible,
  close,
}: {
  visible: boolean
  close: (didDelete: boolean) => void
}): JSX.Element {
  const { t } = useTranslation("settingsDeleteAccount")

  return (
    <Modal
      appElementId="__next"
      visible={visible}
      onEscKeyDown={() => close(false)}
    >
      <ModalContent>
        <ModalTitle>{t("confirmationHeading")}</ModalTitle>

        <Paragraph marginBottomSpacing="s">{t("confirmation")}</Paragraph>
      </ModalContent>
      <ModalFooter>
        <DangerButton id="delete-account-confirm" onClick={() => close(true)}>
          {t("confirmDeletion")}
        </DangerButton>
        <Button
          id="delete-account-close-modal"
          variant="secondary"
          onClick={() => close(false)}
        >
          {t("common:cancel")}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
