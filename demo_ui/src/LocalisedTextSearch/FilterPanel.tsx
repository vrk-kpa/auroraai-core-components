import { Block, Heading } from 'suomifi-ui-components'
import { NationalServiceFilter } from './NationalServiceFilter'
import MunicipalitiesFilter from './MunicipalitiesFilter'
import React, { FC } from 'react'
import { FilterProps } from './FilterTypes'
import { useTranslation } from 'react-i18next'
import ServiceClassFilter from './ServiceClassFilter'
import { FundingTypeFilter } from './FundingTypeFilter'

export const FilterPanel: FC<FilterProps> = ({ filters, setFilters }) => {
  const { t } = useTranslation()

  return (
    <Block
      variant='section'
      margin='m'
      style={{
        backgroundColor: 'white',
        borderStyle: 'solid',
        borderColor: 'lightgray',
        width: '30%',
        height: '100%',
      }}
    >
      <Heading variant='h3' style={{ color: 'white', backgroundColor: '#2e78cc', padding: '16px' }}>
        {t('headingFilterPanel')}
      </Heading>
      <Block padding='m'>
        <NationalServiceFilter filters={filters} setFilters={setFilters} name='mainNationalFilter' />
        <MunicipalitiesFilter filters={filters} setFilters={setFilters} />
        <ServiceClassFilter filters={filters} setFilters={setFilters} />
        <FundingTypeFilter filters={filters} setFilters={setFilters} />
      </Block>
    </Block>
  )
}
