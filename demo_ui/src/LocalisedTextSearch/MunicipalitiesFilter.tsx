import { Block, MultiSelect } from 'suomifi-ui-components'
import { SelectedContainer } from '../LearningTool/SelectedFilters'
import municipalityData from '../resources/municipality_codes_2023.json'
import { useTranslation } from 'react-i18next'
import { FC } from 'react'
import { FilterProps } from './FilterTypes'

const MunicipalitiesFilter: FC<FilterProps> = ({ filters, setFilters }) => {
  const { t, i18n } = useTranslation()

  const municipalityMenuItems = municipalityData.results.map((data) => {
    return {
      labelText: (data.prefLabel as Record<string, string>)[i18n.language] || data.prefLabel.fi,
      uniqueItemId: data.codeValue,
    }
  })

  const getSelectedMunicipalityMenuItems = () =>
    municipalityMenuItems.filter((item) => filters.municipalities?.includes(item.uniqueItemId))

  const updateMunicipalityFilter = (item: string | null) => {
    if (item === null) return

    if (typeof filters.municipalities === 'undefined') {
      setFilters({ ...filters, municipalities: [item] })
      return
    }

    setFilters({
      ...filters,
      municipalities: filters.municipalities.includes(item)
        ? filters.municipalities.filter((it) => it !== item)
        : filters.municipalities?.concat(item),
    })
  }

  return (
    <Block mb='m' pb='m' style={{ borderBottom: 'solid lightgray' }}>
      <SelectedContainer>
        <MultiSelect
          ariaChipActionLabel={t('ariaChipActionLabel')}
          ariaOptionChipRemovedText={t('ariaOptionChipRemovedText')}
          ariaOptionsAvailableText={t('ariaOptionsAvailableText')}
          ariaSelectedAmountText={t('ariaSelectedAmountText')}
          chipListVisible
          items={municipalityMenuItems}
          selectedItems={getSelectedMunicipalityMenuItems()}
          labelText={t('labelMunicipalityFilter')}
          noItemsText={t('labelMunicipalityNotFound')}
          removeAllButtonLabel={t('labelClearMunicipalityFilter')}
          visualPlaceholder={t('labelMunicipalityFilterPlaceholder')}
          onItemSelect={updateMunicipalityFilter}
          onRemoveAll={() => setFilters({ ...filters, municipalities: undefined })}
          disabled={filters.nationalServices === 'OnlyNational'}
        />
      </SelectedContainer>
    </Block>
  )
}

export default MunicipalitiesFilter
