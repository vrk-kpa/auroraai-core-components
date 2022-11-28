import React, { FC, MouseEventHandler, useState } from 'react'
import { useRecoilState } from 'recoil'
import styled from 'styled-components'
import {
  Block,
  BlockProps,
  Heading,
  suomifiDesignTokens,
  Text,
  Modal,
  ModalFooter,
  ModalContent,
  ModalTitle,
  Button,
  Paragraph,
  ExternalLink,
} from 'suomifi-ui-components'
import { ServiceChannelType } from '../dto/RecommendServiceResponseDto'
import { createSessionAttributes } from '../http/api'
import { attributesState } from '../state/global'

const containerAttrs: BlockProps = {
  variant: 'section',
}

const Container = styled(Block).attrs(containerAttrs)`
  &:not(:last-of-type) {
    margin-bottom: ${suomifiDesignTokens.spacing.xxl};
  }

  & > div:not(:last-of-type) {
    margin-bottom: ${suomifiDesignTokens.spacing.m};
  }
`

type ServiceChannelProps = {
  id: string
  type: ServiceChannelType
  name: string
  url?: string
  description: string
  phones?: string[]
  hours?: string[]
  sessionTransferSupported: boolean
}

export const ServiceChannelDetails: FC<ServiceChannelProps> = ({
  id,
  type,
  name,
  url,
  description,
  phones,
  hours,
  sessionTransferSupported,
}) => {
  const [sessionTransferModalOpen, setSessionTransferModalOpen] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  const [attributes] = useRecoilState(attributesState)

  const onLinkClick: MouseEventHandler = (ev) => {
    if (!sessionTransferSupported || Object.keys(attributes).length === 0) return

    ev.preventDefault()
    setSessionTransferModalOpen(true)
  }

  const onTransferSession = async () => {
    setIsTransferring(true)

    try {
      const response = await createSessionAttributes(id, attributes)

      const data = await response.text()

      if (response.status !== 200) {
        throw Error(data)
      }

      window.open(data, '_blank')
    } catch (e) {
      console.error('Error creating session transfer:', e)
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <Container>
      <Modal
        appElementId='root'
        visible={sessionTransferModalOpen}
        onEscKeyDown={() => setSessionTransferModalOpen(false)}
        scrollable={false}
      >
        <ModalContent>
          <ModalTitle>Siirtyminen palveluun</ModalTitle>
          <Paragraph marginBottomSpacing='m'>
            <Text>
              Olet siirtymässä palveluun <strong>{name}</strong>. Voimme siirtää täyttämäsi tiedot kyseiseen palveluun,
              jolloin palvelu voi käyttää syöttämiäsi tietoja.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              Voit siirtyä palveluun myös ilman tietojen siirtämistä. Tällöin mitään syötetyistä tiedoista ei välitetä
              siirrettävään palveluun.
            </Text>
          </Paragraph>
        </ModalContent>
        <ModalFooter>
          <Button onClick={onTransferSession} disabled={isTransferring}>
            Siirry
          </Button>
          <Button
            variant='secondary'
            onClick={() => {
              setSessionTransferModalOpen(false)
              window.open(url, '_blank')
            }}
          >
            Siirry ilman tietojen siirtoa
          </Button>
          <Button variant='secondaryNoBorder' onClick={() => setSessionTransferModalOpen(false)}>
            Peruuta
          </Button>
        </ModalFooter>
      </Modal>

      <div>
        {url ? (
          <ExternalLink href={url} labelNewWindow='Avautuu uuteen ikkunaan' onClick={onLinkClick}>
            {name}
          </ExternalLink>
        ) : (
          name
        )}
      </div>

      <div>
        <Text smallScreen>{description}</Text>
      </div>

      {type === ServiceChannelType.Phone && phones && phones.length > 0 && (
        <div>
          <Heading variant='h4'>Puhelin</Heading>
          {phones.map((p, i) => (
            <div key={`${i}_${p}`}>
              <Text smallScreen>{p}</Text>
            </div>
          ))}
        </div>
      )}

      {hours && hours.length > 0 && (
        <div>
          <Heading variant='h4'>Palveluajat</Heading>
          {hours.map((h, i) => (
            <div key={`${i}_${h}`}>
              <Text smallScreen>{h}</Text>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}
