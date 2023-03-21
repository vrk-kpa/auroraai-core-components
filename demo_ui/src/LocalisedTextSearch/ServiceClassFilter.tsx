import { Block, MultiSelect } from 'suomifi-ui-components'
import { SelectedContainer } from '../LearningTool/SelectedFilters'
import serviceClassData from '../resources/ptv_classes_2023.json'
import { useTranslation } from 'react-i18next'
import { FC } from 'react'
import { FilterProps } from './FilterTypes'

const ServiceClassFilter: FC<FilterProps> = ({ filters, setFilters }) => {
  const { t, i18n } = useTranslation()

  const serviceClassMenuItems = serviceClassData.results
    .filter((data) => data.hierarchyLevel === 1)
    .map((data) => {
      const className = (data.prefLabel as Record<string, string>)[i18n.language] || data.prefLabel.fi
      const classCode = data.codeValue as string

      return {
        labelText: `${classCode} ${className}`,
        uniqueItemId: data.uri as string,
      }
    })

  const getSelectedServiceClassMenuItems = () =>
    serviceClassMenuItems.filter((item) => filters.serviceClasses?.includes(item.uniqueItemId))

  const updateServiceClassFilter = (item: string | null) => {
    if (item === null) return

    if (typeof filters.serviceClasses === 'undefined') {
      setFilters({ ...filters, serviceClasses: [item] })
      return
    }

    setFilters({
      ...filters,
      serviceClasses: filters.serviceClasses.includes(item)
        ? filters.serviceClasses.filter((it) => it !== item)
        : filters.serviceClasses?.concat(item),
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
          items={serviceClassMenuItems}
          selectedItems={getSelectedServiceClassMenuItems()}
          labelText={t('labelServiceClassFilter')}
          noItemsText={t('labelServiceClassNotFound')}
          removeAllButtonLabel={t('labelClearServiceClassFilter')}
          visualPlaceholder={t('labelServiceClassFilterPlaceholder')}
          onItemSelect={updateServiceClassFilter}
          onRemoveAll={() => setFilters({ ...filters, serviceClasses: undefined })}
        />
      </SelectedContainer>
    </Block>
  )
}

export default ServiceClassFilter
