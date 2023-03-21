import { FC } from 'react'
import { Block, RadioButton, RadioButtonGroup } from 'suomifi-ui-components'
import { NationalFilterOption, FilterProps } from './FilterTypes'
import { useTranslation } from 'react-i18next'

export const NationalServiceFilter: FC<FilterProps> = ({ filters, setFilters, name }) => {
  const { t } = useTranslation()

  const updateNationalFilter = (selectedItem: string) => {
    setFilters({
      ...filters,
      nationalServices: selectedItem as NationalFilterOption,
    })
  }

  return (
    <Block variant={'section'} mb='m' pb='m' style={{ borderBottom: 'solid lightgray' }}>
      <RadioButtonGroup
        labelText={t('labelNationalServiceFilter')}
        name={name ?? 'NationalFilterRadioButtonGroup'}
        onChange={updateNationalFilter}
        value={filters.nationalServices}
      >
        {Object.values(NationalFilterOption).map((option) => (
          <RadioButton value={option} key={option}>
            {t(`labelArea${option}`)}
          </RadioButton>
        ))}
      </RadioButtonGroup>
    </Block>
  )
}
