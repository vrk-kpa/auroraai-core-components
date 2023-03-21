import React, { FC } from 'react'
import { ServiceChannel } from '../dto/RecommendServiceResponseDto'
import { Block, Expander, ExpanderContent, ExpanderTitleButton, ExternalLink, Text } from 'suomifi-ui-components'

export const ServiceChannelsList: FC<{ channels: ServiceChannel[]; title: string }> = ({ channels, title }) => {
  return (
    <Expander>
      <ExpanderTitleButton>{title}</ExpanderTitleButton>
      <ExpanderContent>
        {channels.map((channel) => {
          const url = channel.web_pages.length > 0 ? channel.web_pages[0] : undefined
          const channelNameComponent = url ? (
            <ExternalLink href={url} toNewWindow={true} labelNewWindow='foo'>
              {channel.service_channel_name}
            </ExternalLink>
          ) : (
            <Text variant='bold'>{channel.service_channel_name}</Text>
          )

          return (
            <Block key={channel.service_channel_id} margin='s' style={{ display: 'flex', flexDirection: 'column' }}>
              {channelNameComponent}
              <Text>{channel.service_channel_description_summary}</Text>
              {channel.phone_numbers.length > 0 ? <Text>Puhelin: {channel.phone_numbers}</Text> : undefined}
              {channel.service_hours.length > 0 ? <Text>Aukioloajat: {channel.service_hours}</Text> : undefined}
            </Block>
          )
        })}
      </ExpanderContent>
    </Expander>
  )
}
