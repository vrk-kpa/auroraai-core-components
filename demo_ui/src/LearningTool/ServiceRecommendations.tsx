import { useRecoilState } from 'recoil'
import styled from 'styled-components'
import { Text, suomifiDesignTokens } from 'suomifi-ui-components'
import { recommendedServicesState } from '../state/global'
import { RecommendedServiceBox } from './RecommendedServiceBox'

const Header = styled.div<{ border?: boolean }>`
  display: flex;

  border-bottom: ${({ border }): string => (border ? `1px solid ${suomifiDesignTokens.colors.depthLight1}` : '')};
  padding: ${suomifiDesignTokens.spacing.s} 0;
  color: ${suomifiDesignTokens.colors.highlightBase};
`

export const ServiceRecommendations = ({ recommendationId }: { recommendationId: number }) => {
  const [recommendedServices] = useRecoilState(recommendedServicesState)

  return (
    <>
      {recommendedServices && recommendedServices?.length > 0 ? (
        <>
          <Header>
            <Text variant='bold' style={{ color: `${suomifiDesignTokens.colors.highlightBase}` }}>
              Hakutuloksia {recommendedServices?.length}
            </Text>
          </Header>

          {recommendationId &&
            recommendedServices?.map((service) => (
              <RecommendedServiceBox key={service.service_id} service={service} recommendationId={recommendationId} />
            ))}
        </>
      ) : (
        <>{recommendedServices?.length === 0 && <p>Palveluita ei löytynyt</p>}</>
      )}
    </>
  )
}
