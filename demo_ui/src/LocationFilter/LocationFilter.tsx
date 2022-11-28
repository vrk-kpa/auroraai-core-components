import { Fragment, useState } from 'react'
import { Checkbox, Text } from 'suomifi-ui-components'
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
  locationFilters,
  setLocationFilters,
}: {
  filters: LocationFilterType[]
  filtersSelected: LocationFilterVariant[]
  selectFilters: (items: LocationFilterVariant[]) => void
  includeNationalServices: boolean
  setIncludeNationalServices: (value: boolean) => void
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

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <Checkbox
          id={`national-services-checkbox`}
          onClick={({ checkboxState }) => setIncludeNationalServices(checkboxState)}
          checked={includeNationalServices}
        >
          Valtakunnalliset palvelut
        </Checkbox>
        <Checkbox
          id={`specify-location-checkbox`}
          onClick={({ checkboxState }) => setSpecifyLocation(checkboxState)}
          checked={specifyLocation || filtersSelected.length > 0}
        >
          Tarkennettu aluehaku
        </Checkbox>
      </div>

      {(specifyLocation || filtersSelected.length > 0) && (
        <div>
          <Text variant='bold'>Valitse alue</Text>

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
        </div>
      )}
    </>
  )
}

export default LocationFilter
