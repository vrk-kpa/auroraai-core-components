import { Fragment, useState } from 'react'
import { Block, Checkbox, RadioButton, Text } from 'suomifi-ui-components'
import HospitalDistrictFilter from './HospitalDistrictFilter'
import MunicipalitiesFilter from './MunicipalitiesFilter'
import RegionFilter from './RegionFilter'
import { LocationFilterType, LocationFilterVariant } from '../types'
import { useRecoilState } from 'recoil'
import { localeState } from '../state/global'
import WellbeingCountyFilter from './WellbeingCountyFilter'

const LocationFilter = ({
  filters,
  filtersSelected,
  selectFilters,
  includeNationalServices,
  setIncludeNationalServices,
  onlyNationalServices,
  setOnlyNationalServices,
  locationFilters,
  setLocationFilters,
}: {
  filters: LocationFilterType[]
  filtersSelected: LocationFilterVariant[]
  selectFilters: (items: LocationFilterVariant[]) => void
  includeNationalServices: boolean
  setIncludeNationalServices: (value: boolean) => void
  onlyNationalServices: boolean
  setOnlyNationalServices: (value: boolean) => void
  locationFilters: (type: LocationFilterVariant) => string[]
  setLocationFilters: (type: LocationFilterVariant, values: string[]) => void
}) => {
  const [specifyLocation, setSpecifyLocation] = useState<boolean>(false)

  const [locale] = useRecoilState(localeState)

  const handleSelectionChange = (item: LocationFilterVariant, selected: boolean) => {
    if (selected) selectFilters(filtersSelected.concat(item))
    else {
      setLocationFilters(item, [])
      selectFilters(filtersSelected.filter((it) => it !== item))
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === 'only-national-services') {
      setOnlyNationalServices(true)
      setIncludeNationalServices(false)
      setSpecifyLocation(false)
      resetLocationFilters()
      selectFilters([])
    }
    if (event.target.value === 'specify-location') {
      setOnlyNationalServices(false)
      setSpecifyLocation(true)
    }
  }

  const resetLocationFilters = () => {
    setLocationFilters('municipalities', [])
    setLocationFilters('region', [])
    setLocationFilters('wellbeingCounty', [])
    setLocationFilters('hospitalDistrict', [])
  }

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <fieldset style={{ border: 'none', padding: 0 }}>
          <RadioButton value='only-national-services' checked={onlyNationalServices} onChange={handleChange}>
            Vain valtakunnalliset palvelut
          </RadioButton>
          <RadioButton value='specify-location' checked={specifyLocation} onChange={handleChange}>
            Tarkennettu aluehaku
          </RadioButton>
        </fieldset>
      </div>

      {(specifyLocation || filtersSelected.length > 0) && (
        <Block margin='s'>
          <Checkbox
            id={`include-national-services-checkbox`}
            onClick={({ checkboxState }) => setIncludeNationalServices(checkboxState)}
            checked={includeNationalServices}
          >
            Sisällytä valtakunnalliset palvelut
          </Checkbox>
          <Text>Valitse alue</Text>

          {filters &&
            filters.map((item) => (
              <Checkbox
                id={`${item.type}-checkbox`}
                key={item.type}
                onClick={({ checkboxState }) => handleSelectionChange(item.type, checkboxState)}
                checked={filtersSelected.includes(item.type)}
              >
                {item.name}
              </Checkbox>
            ))}

          {filtersSelected.map((item) => {
            return (
              <Fragment key={item}>
                {item === 'municipalities' && (
                  <MunicipalitiesFilter
                    selectedMunicipalities={locationFilters('municipalities')}
                    setSelectedMunicipalities={(items: string[]) => setLocationFilters('municipalities', items)}
                  />
                )}

                {item === 'region' && (
                  <RegionFilter
                    locale={locale}
                    selectedRegions={locationFilters('region')}
                    setSelectedRegions={(items: string[]) => setLocationFilters('region', items)}
                  />
                )}
                {item === 'hospitalDistrict' && (
                  <HospitalDistrictFilter
                    locale={locale}
                    selectedHospitalDistricts={locationFilters('hospitalDistrict')}
                    setSelectedHospitalDistricts={(items: string[]) => setLocationFilters('hospitalDistrict', items)}
                  />
                )}

                {item === 'wellbeingCounty' && (
                  <WellbeingCountyFilter
                    locale={locale}
                    selectedWellbeingCounties={locationFilters('wellbeingCounty')}
                    setSelectedWellbeingCounties={(items: string[]) => setLocationFilters('wellbeingCounty', items)}
                  />
                )}
              </Fragment>
            )
          })}
        </Block>
      )}
    </>
  )
}

export default LocationFilter
