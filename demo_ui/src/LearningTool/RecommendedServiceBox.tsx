import { suomifiDesignTokens, Expander, ExpanderTitleButton, ExpanderContent } from 'suomifi-ui-components'
import { RecommendedService } from '../dto/RecommendServiceResponseDto'
import { RecommendationFeedback } from './RecommendationFeedback'
import { RecommendationHeader } from '../common/RecommendationHeader'
import styled from 'styled-components'
import { ServiceDescription } from '../common/ServiceDescription'
import { ChannelList } from '../common/ChannelList'
import { groupBy, prop } from 'ramda'

const RecommendedServiceContainer = styled.div`
  padding: ${suomifiDesignTokens.spacing.s} 0;
`

export const RecommendedServiceBox = ({
  service,
  recommendationId,
}: {
  service: RecommendedService
  recommendationId: number
}) => {
  const channelsByType = groupBy(prop('service_channel_type'), service.service_channels)
  return (
    <RecommendedServiceContainer>
      <Expander key={service.service_id}>
        <ExpanderTitleButton asHeading='h3'>
          <RecommendationHeader service={service} />
        </ExpanderTitleButton>

        <ExpanderContent>
          <ServiceDescription service={service} />

          {recommendationId && (
            <RecommendationFeedback serviceId={service.service_id} recommendationId={recommendationId} />
          )}

          <ChannelList channelsByType={channelsByType} />
        </ExpanderContent>
      </Expander>
    </RecommendedServiceContainer>
  )
}
