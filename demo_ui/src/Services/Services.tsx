import { groupBy, prop } from 'ramda'
import { FC, useState } from 'react'
import { Expander, ExpanderTitleButton, ExpanderContent, suomifiDesignTokens } from 'suomifi-ui-components'
import { RecommendedService, RecommendServiceResponseDto } from '../dto/RecommendServiceResponseDto'
import { ServiceFeedback } from '../ServiceFeedback/ServiceFeedback'
import { useRecoilState } from 'recoil'
import { recommendationIDState } from '../state/global'
import styled from 'styled-components'
import { ServiceDescription } from '../common/ServiceDescription'
import { RecommendationHeader } from '../common/RecommendationHeader'
import { ChannelList } from '../common/ChannelList'

type Props = {
  allowFeedback: boolean
  recommendations?: RecommendServiceResponseDto['recommended_services']
}

const Container = styled.div`
  margin: ${suomifiDesignTokens.spacing.m} 0;
`

export const Services: FC<Props> = ({ recommendations, allowFeedback = true }) => {
  const [recommendationID] = useRecoilState(recommendationIDState)

  if (allowFeedback && recommendationID === undefined) {
    throw new Error('undefined recommendation id')
  }

  return (
    <>
      {recommendations &&
        recommendations.map((s) => {
          const channelsByType = groupBy(prop('service_channel_type'), s.service_channels)
          return (
            <Container>
              <Expander key={s.service_id}>
                <ExpanderTitleButton asHeading='h3'>
                  <RecommendationHeader service={s} />
                </ExpanderTitleButton>

                <ExpanderContent>
                  <ServiceDescription service={s} />

                  {allowFeedback && recommendationID !== undefined && (
                    <ServiceFeedback recommendationID={recommendationID} serviceID={s.service_id} />
                  )}
                  <ChannelList channelsByType={channelsByType} />
                </ExpanderContent>
              </Expander>
            </Container>
          )
        })}
    </>
  )
}

type SearchProps = {
  recommendations?: RecommendServiceResponseDto['recommended_services']
}

export const SearchServices: FC<SearchProps> = ({ recommendations }) => {
  const [recommendationID] = useRecoilState(recommendationIDState)

  return !recommendations ? null : (
    <>
      {recommendations?.map((service) => (
        <Service initialService={service} recommendationID={recommendationID} />
      ))}
    </>
  )
}

type ServiceProps = {
  initialService: RecommendedService
  recommendationID: number | undefined
}

const Service: FC<ServiceProps> = ({ initialService, recommendationID }) => {
  const channelsByType = groupBy(prop('service_channel_type'), initialService.service_channels)
  const [service, setService] = useState(initialService)

  return (
    <Container>
      <Expander key={service.service_id}>
        <ExpanderTitleButton>
          <RecommendationHeader service={service} setService={setService} showSimilarity />
        </ExpanderTitleButton>

        <ExpanderContent>
          <ServiceDescription service={service} />

          {recommendationID !== undefined && (
            <ServiceFeedback recommendationID={recommendationID} serviceID={service.service_id} />
          )}
          <ChannelList channelsByType={channelsByType} />
        </ExpanderContent>
      </Expander>
    </Container>
  )
}
