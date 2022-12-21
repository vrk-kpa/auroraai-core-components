import { useRecoilState } from 'recoil'
import styled from 'styled-components'
import { Chip, suomifiDesignTokens } from 'suomifi-ui-components'
import { Municipality, RecommendedService } from '../dto/RecommendServiceResponseDto'
import {TranslateButton} from "../TranslateButton/TranslateButton"
import { localeState } from '../state/global'
import { Language } from '../types'
import {Dispatch, SetStateAction} from "react";

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .details {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;

    button {
      font-size: 14px;
    }
  }

  .name {
    display: flex;
    flex-direction: column;
  }
`

const Similarity = styled.span`
  padding: 0 10px;
  font-weight: 400;
  font-size: 13px;
`
const ResponsibleOrganizationContainer = styled.span`
  font-weight: 400;
  font-size: 16px;
  color: ${suomifiDesignTokens.colors.depthDark1};
  padding-bottom: 10px;
`

const isNationalService = (s: RecommendedService) => {
  return s.area_type === 'Nationwide'
}

const isNationalExceptAlandIslandsService = (s: RecommendedService) => {
    return s.area_type === 'NationwideExceptAlandIslands'
}

const isRegionalService = (s: RecommendedService) => {
  return s.area_type === 'LimitedType'
}

const getMunicipalitiesInfo = (s: RecommendedService, locale: Language) => {
    let municipalities: Municipality[] = []

    s.areas.forEach((item) => {
        municipalities = municipalities.concat(item.municipalities)
    })
    return municipalities.length > 1
        ? `${municipalities.length} kuntaa`
        : municipalities.length === 1
            ? municipalities[0].name.find((v) => v.language === locale)?.value
            : ''
}

const AreaTypeInfo = ({ service}: { service: RecommendedService }) => {
    const [locale] = useRecoilState(localeState)
    return (
        <>{isNationalService(service) ? (
            <Chip>Valtakunnallinen</Chip>
        ) : isNationalExceptAlandIslandsService(service) ? (
            <Chip>Valtakunnallinen (pl. Ahvenanmaa) </Chip>
        ) : (
            isRegionalService(service) && <Chip> {getMunicipalitiesInfo(service, locale)}</Chip>
        )

        }
        </>)
}   

export const RecommendationHeader = ({
  service,
  setService,
  showSimilarity,
}: {
  service: RecommendedService
  setService?: Dispatch<SetStateAction<RecommendedService>> | undefined
  showSimilarity?: boolean
    }) => {

  return (
    <TitleContainer>
      <div className='name'>
        <ResponsibleOrganizationContainer>{service.responsible_organization?.name}</ResponsibleOrganizationContainer>
        <span>{service.service_name}</span>
      </div>
          <div className='details'>
              <AreaTypeInfo service={service}/>
       
        {showSimilarity && service.similarity_score && (
          <Similarity>{service?.similarity_score.toLocaleString(undefined, { maximumFractionDigits: 4 })}</Similarity>
        )}
      </div>
      <div className='details'>
        {typeof setService === 'undefined'
          ? <></>
          : <TranslateButton serviceId={service.service_id} setService={setService}/>
        }
      </div>
    </TitleContainer>
  )
}
