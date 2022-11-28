import { FC } from 'react'
import { Expander, ExpanderTitleButton, ExpanderContent } from 'suomifi-ui-components'
import { ServiceChannel, ServiceChannelType } from '../dto/RecommendServiceResponseDto'
import { ServiceChannelDetails } from '../ServiceChannelDetails/ServiceChannelDetails'
import { serviceChannelTypeToText } from '../utils'

type ChannelGroupProps = {
  channelsByType: { [type: string]: ServiceChannel[] }
}

export const ChannelList: FC<ChannelGroupProps> = ({ channelsByType }) => {
  return (
    <>
      {Object.entries(channelsByType).map(([type, channels]) => (
        <Expander key={type}>
          <ExpanderTitleButton>{serviceChannelTypeToText(type as ServiceChannelType)}</ExpanderTitleButton>

          <ExpanderContent>
            {channels.map((c) => (
              <ServiceChannelDetails
                id={c.service_channel_id}
                key={c.service_channel_id}
                type={c.service_channel_type}
                name={c.service_channel_name}
                url={c.web_pages[0]}
                description={c.service_channel_description_summary}
                phones={c.phone_numbers}
                hours={c.service_hours}
                sessionTransferSupported={c.session_transfer}
              />
            ))}
          </ExpanderContent>
        </Expander>
      ))}
    </>
  )
}
