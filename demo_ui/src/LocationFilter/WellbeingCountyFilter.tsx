import { MultiSelect } from 'suomifi-ui-components'
import { SelectedContainer } from '../LearningTool/SelectedFilters'
import { wellbeingCounties } from '../types'

const modifyWellbeingCounties = (locale: string) => {
  return wellbeingCounties.map((item) => {
    return { labelText: item.prefLabel[locale], uniqueItemId: item.codeValue }
  })
}

const WellbeingCountyFilter = ({
  locale,
  selectedWellbeingCounties,
  setSelectedWellbeingCounties,
}: {
  locale: string
  selectedWellbeingCounties: string[]
  setSelectedWellbeingCounties: (items: string[]) => void
}) => {
  const modifySelectedWellbeingCounties = () => {
    return (
      selectedWellbeingCounties &&
      selectedWellbeingCounties.map((item) => {
        return {
          labelText: wellbeingCounties.find((it) => it.codeValue === item)?.prefLabel[locale] ?? '',
          uniqueItemId: item,
        }
      })
    )
  }

  return (
    <SelectedContainer>
      <MultiSelect
        ariaChipActionLabel='Poista'
        ariaOptionChipRemovedText='poistettu'
        ariaOptionsAvailableText='vaihtoehtoa'
        ariaSelectedAmountText='hyvinvointialuetta valittu'
        chipListVisible
        items={modifyWellbeingCounties(locale)}
        selectedItems={modifySelectedWellbeingCounties()}
        onItemSelect={(item) =>
          setSelectedWellbeingCounties(
            selectedWellbeingCounties && selectedWellbeingCounties?.includes(item)
              ? selectedWellbeingCounties.filter((it) => it !== item)
              : selectedWellbeingCounties?.concat(item),
          )
        }
        labelText='Hyvinvointialue'
        noItemsText='Ei vaihtoehtoja'
        removeAllButtonLabel='Poista kaikki valinnat'
        visualPlaceholder='Kirjoita hyvinvointialueen nimi'
      />
    </SelectedContainer>
  )
}

export default WellbeingCountyFilter
