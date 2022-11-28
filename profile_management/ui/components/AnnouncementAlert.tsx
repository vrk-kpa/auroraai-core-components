import { UUID } from "io-ts-types"
import React from "react"
import { TranslatableString } from "shared/schemas"
import { InlineAlert, suomifiDesignTokens } from "suomifi-ui-components"
import { Container } from "./styles/Container"
import { MediumContainer } from "./styles/MediumContainer"

export function AnnouncementAlert({
  announcement,
}: {
  announcement: {
    id: UUID
    announcementTitle: TranslatableString
    announcementDescription: TranslatableString
    announcementStart: string
    announcementEnd: string
  }
}): JSX.Element {
  return (
    <Container
      center
      size="wide"
      style={{ marginTop: suomifiDesignTokens.spacing.l }}
    >
      <MediumContainer center>
        <InlineAlert
          id="announcement-alert"
          status="neutral"
          labelText={`${announcement.announcementTitle["fi"]} / ${announcement.announcementTitle["sv"]} / ${announcement.announcementTitle["en"]}`}
        >
          <p style={{ marginBottom: suomifiDesignTokens.spacing.s }}>
            {announcement.announcementDescription["fi"]}
          </p>
          <p style={{ marginBottom: suomifiDesignTokens.spacing.s }}>
            {announcement.announcementDescription["sv"]}
          </p>

          <p>{announcement.announcementDescription["en"]}</p>
        </InlineAlert>
      </MediumContainer>
    </Container>
  )
}
