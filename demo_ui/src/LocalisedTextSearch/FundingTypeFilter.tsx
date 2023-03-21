import { FC } from 'react'
import { Block, RadioButton, RadioButtonGroup } from 'suomifi-ui-components'
import { FilterProps, FundingTypeFilterOption } from './FilterTypes'
import { useTranslation } from 'react-i18next'

export const FundingTypeFilter: FC<FilterProps> = ({ filters, setFilters, name }) => {
  const { t } = useTranslation()

  const updateFundingTypeFilter = (selectedItem: string) => {
    const newFilter = selectedItem === FundingTypeFilterOption.AllFundingTypes ? undefined : [selectedItem]

    setFilters({
      ...filters,
      fundingTypes: newFilter,
    })
  }

  return (
    <Block variant={'section'} mb='m' pb='m' style={{ borderBottom: 'solid lightgray' }}>
      <RadioButtonGroup
        labelText={t('labelFundingTypeFilter')}
        name={name ?? 'FundingTypeFilterRadioButtonGroup'}
        onChange={updateFundingTypeFilter}
        defaultValue={FundingTypeFilterOption.AllFundingTypes}
      >
        {Object.values(FundingTypeFilterOption).map((option) => (
          <RadioButton value={option} key={option}>
            {t(`labelFundingType${option}`)}
          </RadioButton>
        ))}
      </RadioButtonGroup>
    </Block>
  )
}
