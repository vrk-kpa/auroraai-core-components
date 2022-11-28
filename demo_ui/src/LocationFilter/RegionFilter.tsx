import { MultiSelect } from 'suomifi-ui-components'
import { SelectedContainer } from '../LearningTool/SelectedFilters'
import { regions } from '../types'

const modifyRegions = (locale: string) => {
  return regions.map((item) => {
    return { labelText: item.prefLabel[locale], uniqueItemId: item.codeValue }
  })
}

const RegionFilter = ({
  locale,
  selectedRegions,
  setSelectedRegions,
}: {
  locale: string
  selectedRegions: string[]
  setSelectedRegions: (items: string[]) => void
}) => {
  const modifySelectedRegions = () => {
    return (
      selectedRegions &&
      selectedRegions.map((item) => {
        return { labelText: regions.find((it) => it.codeValue === item)?.prefLabel[locale] ?? '', uniqueItemId: item }
      })
    )
  }

  return (
    <SelectedContainer>
      <MultiSelect
        ariaChipActionLabel='Poista'
        ariaOptionChipRemovedText='poistettu'
        ariaOptionsAvailableText='vaihtoehtoa'
        ariaSelectedAmountText='maakuntaa valittu'
        chipListVisible
        items={modifyRegions(locale)}
        selectedItems={modifySelectedRegions()}
        labelText='Maakunta'
        noItemsText='Ei vaihtoehtoja'
        removeAllButtonLabel='Poista kaikki valinnat'
        visualPlaceholder='Kirjoita maakunnan nimi'
        onItemSelect={(item) =>
          setSelectedRegions(
            selectedRegions && selectedRegions?.includes(item)
              ? selectedRegions.filter((it) => it !== item)
              : selectedRegions?.concat(item),
          )
        }
        onRemoveAll={() => setSelectedRegions([])}
      />
    </SelectedContainer>
  )
}

export default RegionFilter
