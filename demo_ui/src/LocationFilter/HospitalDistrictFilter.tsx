import { MultiSelect } from 'suomifi-ui-components'
import { SelectedContainer } from '../LearningTool/SelectedFilters'
import { hospitalDistricts } from '../types'

const modifyHospitalDistricts = (locale: string) => {
  return hospitalDistricts.map((item) => {
    return { labelText: item.prefLabel[locale], uniqueItemId: item.codeValue }
  })
}

const HospitalDistrictFilter = ({
  locale,
  selectedHospitalDistricts,
  setSelectedHospitalDistricts,
}: {
  locale: string
  selectedHospitalDistricts: string[]
  setSelectedHospitalDistricts: (items: string[]) => void
}) => {
  const modifySelectedHospitalDistricts = () => {
    return (
      selectedHospitalDistricts &&
      selectedHospitalDistricts.map((item) => {
        return {
          labelText: hospitalDistricts.find((it) => it.codeValue === item)?.prefLabel[locale] ?? '',
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
        ariaSelectedAmountText='sairaanhoitopiiriä valittu'
        chipListVisible
        items={modifyHospitalDistricts(locale)}
        selectedItems={modifySelectedHospitalDistricts()}
        onItemSelect={(item) =>
          setSelectedHospitalDistricts(
            selectedHospitalDistricts && selectedHospitalDistricts?.includes(item)
              ? selectedHospitalDistricts.filter((it) => it !== item)
              : selectedHospitalDistricts?.concat(item),
          )
        }
        labelText='Sairaanhoitopiiri'
        noItemsText='Ei vaihtoehtoja'
        removeAllButtonLabel='Poista kaikki valinnat'
        visualPlaceholder='Kirjoita sairaanhoitopiirin nimi'
      />
    </SelectedContainer>
  )
}

export default HospitalDistrictFilter
