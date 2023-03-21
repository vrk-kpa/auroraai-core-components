import React, { FC } from 'react'
import { RecommendedService, ServiceChannelType } from '../dto/RecommendServiceResponseDto'
import { useTranslation } from 'react-i18next'
import { Block, Heading, InlineAlert, LoadingSpinner, Text } from 'suomifi-ui-components'
import { ServiceChannelsList } from './ServiceChannel'
import { useRecoilState } from 'recoil'
import { localisedTextSearchResultsState } from '../state/global'

const ServiceAreaAndFundingLabel: FC<{ service: RecommendedService }> = ({ service }) => {
  const { t, i18n } = useTranslation()

  const areaString = ((service: RecommendedService): string => {
    if (service.area_type !== 'LimitedType') return t(`labelAreaType${service.area_type}`)

    const municipalityCount = service.areas.reduce<number>((acc, area) => acc + area.municipalities.length, 0)
    if (municipalityCount > 1) return `${municipalityCount} ${t('labelMunicipalityCount')}`

    const firstMunicipality = service.areas[0].municipalities[0]
    return firstMunicipality.name.find((it) => it.language === i18n.language)?.value || firstMunicipality.name[0].value
  })(service)

  const fundingString = t(`label${service.funding_type}`)
  const areaAndFundingDescription = [areaString, fundingString].filter((it) => !!it).join(' · ')

  return (
    <Text variant='body' color='depthDark1' style={{ fontSize: '12px', textTransform: 'uppercase' }}>
      {areaAndFundingDescription}
    </Text>
  )
}

const LocalisedService: FC<{ service: RecommendedService }> = ({ service }) => {
  const { t } = useTranslation()

  const serviceChannelComponents = Object.keys(ServiceChannelType).map((type) => {
    const filteredChannels = service.service_channels.filter((channel) => channel.service_channel_type === type)

    if (filteredChannels.length === 0) return undefined

    const translationKey = `labelServiceChannel${type}`
    const serviceChannelLabel = `${t(translationKey)} (${filteredChannels.length} ${t('abbreviationPieces')})`

    return <ServiceChannelsList key={type} channels={filteredChannels} title={serviceChannelLabel} />
  })

  const noChannels = serviceChannelComponents.filter((it) => !!it).length === 0

  return (
    <Block
      padding='m'
      variant='section'
      style={{
        backgroundColor: 'white',
        borderStyle: 'solid',
        borderColor: 'lightgray',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '-2px',
      }}
    >
      {service.machine_translated ? (
        <InlineAlert labelText={t('alertLabelMachineTranslatedService')} status='warning' />
      ) : undefined}
      <Text variant='body' color='depthDark1' style={{ fontSize: '16px' }}>
        {service.responsible_organization?.name}
      </Text>
      <Heading variant='h3' style={{ fontSize: '20px' }}>
        {service.service_name}
      </Heading>
      <ServiceAreaAndFundingLabel service={service} />
      <Block variant='section' mt='s'>
        <Text variant='body'>{service.service_description_summary}</Text>
      </Block>

      <Block variant='section' mt='s'>
        <Text variant='bold'>{t('headingServiceChannels')}</Text>
        <Block>
          {noChannels ? <Text color='depthDark1'>{t('labelNoServiceChannelsFound')}</Text> : serviceChannelComponents}
        </Block>
      </Block>
    </Block>
  )
}

const RecommendationResults: FC<{ services: RecommendedService[] }> = ({ services }) => {
  const { t } = useTranslation()

  const machineTranslationsFound = services.some((service) => service.machine_translated)

  return (
    <>
      {machineTranslationsFound ? (
        <InlineAlert status={'warning'} labelText={t('alertLabelAttention')}>
          {t('alertContentMachineTranslationDisclaimer')}
        </InlineAlert>
      ) : undefined}
      <Heading variant='h2' style={{ marginBottom: '30px' }}>
        {t('headingSearchResults')}
      </Heading>
      {services?.map((result) => {
        return <LocalisedService key={result.service_id} service={result} />
      })}
    </>
  )
}

export const RecommendationResultContainer = () => {
  const [resultState] = useRecoilState(localisedTextSearchResultsState)
  const { t } = useTranslation()

  const isFetching = resultState.loadingRecommendations || resultState.loadingTranslations

  if (!isFetching && !resultState.services) return <Block />

  const spinner = <LoadingSpinner status='loading' text={t('labelLoadingSpinner')} />

  return (
    <Block
      mt='xs'
      padding='m'
      variant='section'
      style={{ backgroundColor: 'white', borderStyle: 'solid', borderColor: 'lightgray' }}
    >
      {isFetching ? spinner : <RecommendationResults services={resultState.services || []} />}
    </Block>
  )
}
