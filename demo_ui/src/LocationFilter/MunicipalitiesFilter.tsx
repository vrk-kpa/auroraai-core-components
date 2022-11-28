import { MultiSelect } from 'suomifi-ui-components'
import { SelectedContainer } from '../LearningTool/SelectedFilters'
import { municipalityCodes } from '../types'

const MunicipalitiesFilter = ({
  selectedMunicipalities,
  setSelectedMunicipalities,
}: {
  selectedMunicipalities: string[]
  setSelectedMunicipalities: (items: string[]) => void
}) => {
  const municipalities = Object.entries(municipalityCodes)
    .sort((a, b) => (a[0] === '000' ? -1 : a[1].localeCompare(b[1], 'fi')))
    .map(([code, name]) => {
      return { labelText: name, uniqueItemId: code }
    })

  const modifySelectedMunicipalities = () => {
    return (
      selectedMunicipalities &&
      selectedMunicipalities.map((code) => {
        return { labelText: municipalityCodes[code], uniqueItemId: code }
      })
    )
  }

  return (
    <SelectedContainer>
      <MultiSelect
        ariaChipActionLabel='Poista'
        ariaOptionChipRemovedText='poistettu'
        ariaOptionsAvailableText='vaihtoehtoa'
        ariaSelectedAmountText='kuntaa valittu'
        chipListVisible
        items={municipalities}
        selectedItems={modifySelectedMunicipalities()}
        labelText='Kunta'
        noItemsText='Ei vaihtoehtoja'
        removeAllButtonLabel='Poista kaikki valinnat'
        visualPlaceholder='Kirjoita kunnan nimi'
        onItemSelect={(item) =>
          setSelectedMunicipalities(
            selectedMunicipalities && selectedMunicipalities?.includes(item)
              ? selectedMunicipalities.filter((it) => it !== item)
              : selectedMunicipalities?.concat(item),
          )
        }
        onRemoveAll={() => setSelectedMunicipalities([])}
      />
    </SelectedContainer>
  )
}

export default MunicipalitiesFilter
