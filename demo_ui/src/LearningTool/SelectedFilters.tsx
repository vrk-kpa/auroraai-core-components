import { Fragment } from 'react'
import { useRecoilState } from 'recoil'
import styled from 'styled-components'
import { Text, suomifiDesignTokens, Chip, Heading, Button } from 'suomifi-ui-components'
import { Question } from '../Questions/Questions'
import { FiltersState, learningFiltersState, localeState, metersState } from '../state/global'
import { attributes } from './AttributesFilter'
import {
  fundingTypeFilters,
  hospitalDistricts,
  LocationFilterVariant,
  municipalityCodes,
  regions,
  targetGroups,
  wellbeingCounties,
} from '../types'
import { omit } from 'ramda'

const Container = styled.section`
  h2,
  h3,
  h4 {
    margin-bottom: ${suomifiDesignTokens.spacing.xs};
  }
`

const SelectedContainer = styled.div`
  margin: ${suomifiDesignTokens.spacing.xs} 0;

  .fi-multiselect {
    width: 100%;

    .fi-filter-input {
      width: 290px;
    }
  }

  button {
    margin: ${suomifiDesignTokens.spacing.xs} 0;
    margin-right: ${suomifiDesignTokens.spacing.xs};
  }
`

export const SelectedFilters = () => {
  const [locale] = useRecoilState(localeState)
  const [meters, setMeters] = useRecoilState(metersState)

  const [filters, setFilters] = useRecoilState<FiltersState>(learningFiltersState)

  const {
    includeNationalServices,
    onlyNationalServices,
    locationFilters,
    targetGroupFilters,
    serviceClassFilters,
    fundingType,
  } = filters

  const municipalities = locationFilters['municipalities']
  const selectedRegions = locationFilters['region']
  const selectedHospitalDistricts = locationFilters['hospitalDistrict']
  const selectedWellbeingCounties = locationFilters['wellbeingCounty']

  const setLocationFilter = (type: LocationFilterVariant, items: string[]) => {
    setFilters((f) => ({ ...f, locationFilters: { ...f.locationFilters, [type]: items } }))
  }

  const resetNationalServicesFilters = () => {
    setFilters((f) => ({ ...f, includeNationalServices: false, onlyNationalServices: false }))
  }

  const resetFilters = () => {
    setMeters({})
    setFilters({
      includeNationalServices: false,
      onlyNationalServices: false,
      locationFiltersSelected: [],
      locationFilters: {
        municipalities: [],
        region: [],
        hospitalDistrict: [],
        wellbeingCounty: [],
      },
      serviceClassFilters: [],
      targetGroupFilters: [],
      fundingType: [],
      rerank: false,
    })
  }

  const removeServiceClass = (codeValue: string) => {
    setFilters({ ...filters, serviceClassFilters: serviceClassFilters.filter((item) => item.codeValue !== codeValue) })
  }

  const removeAttribute = (key: string) => {
    setMeters(omit([key], meters))
  }

  const removeFundingType = (ft: string) => {
    setFilters({ ...filters, fundingType: fundingType.filter((item) => item !== ft) })
  }

  return (
    <Container>
      <>
        <SelectedContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Heading variant='h2'>
              <Text variant='bold' style={{ color: `${suomifiDesignTokens.colors.highlightBase}` }}>
                Valitut filtterit
              </Text>
            </Heading>
            <Button variant='secondary' onClick={resetFilters}>
              Tyhjennä kaikki
            </Button>
          </div>

          <div>
            {(includeNationalServices || onlyNationalServices) && (
              <Chip removable actionLabel='remove-attribute' onClick={() => resetNationalServicesFilters()}>
                Valtakunnalliset palvelut
              </Chip>
            )}

            {fundingType.map((item) => (
              <Chip removable actionLabel='remove-attribute' onClick={() => removeFundingType(item)} key={item}>
                {fundingTypeFilters.find((it) => it.type === item)?.name}
              </Chip>
            ))}
          </div>
          <div>
            {serviceClassFilters && serviceClassFilters.length > 0 && (
              <>
                <Text variant='bold'>Palveluluokat</Text>
                <div>
                  {serviceClassFilters.map((item) => (
                    <Chip
                      key={item.codeValue}
                      removable
                      actionLabel='remove-attribute'
                      onClick={() => removeServiceClass(item.codeValue)}
                    >
                      {item.prefLabel[locale]}
                    </Chip>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            {Object.keys(meters).length > 0 && (
              <>
                <Text variant='bold'>Attributit</Text>

                <div>
                  {Object.entries(meters).map(([key, value]) => (
                    <Fragment key={key}>
                      {value !== undefined && value > -1 && (
                        <Chip key={key} removable actionLabel='remove-attribute' onClick={() => removeAttribute(key)}>
                          {(attributes.find((item) => item.type === key) as Question)?.description}: {value}
                        </Chip>
                      )}
                    </Fragment>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            {(municipalities !== undefined ||
              (selectedRegions && selectedRegions?.length > 0) ||
              hospitalDistricts.length > 0) && (
              <>
                {municipalities && municipalities?.length > 0 && (
                  <div>
                    <div>
                      <Text variant='bold'>Kunta</Text>
                    </div>
                    {municipalities.map((item) => (
                      <Chip
                        key={item}
                        removable
                        actionLabel='remove-attribute'
                        onClick={() =>
                          setLocationFilter(
                            'municipalities',
                            municipalities.filter((it) => it !== item),
                          )
                        }
                      >
                        {municipalityCodes[item]}
                      </Chip>
                    ))}
                  </div>
                )}

                {selectedRegions && selectedRegions.length > 0 && (
                  <div>
                    <div>
                      <Text variant='bold'>Maakunta</Text>
                    </div>
                    {selectedRegions.map((item) => (
                      <Chip
                        key={item}
                        removable
                        actionLabel='remove'
                        onClick={() =>
                          setLocationFilter(
                            'region',
                            selectedRegions.filter((it) => it !== item),
                          )
                        }
                      >
                        {regions.find((it) => it.codeValue === item)?.prefLabel[locale]}
                      </Chip>
                    ))}
                  </div>
                )}

                {selectedHospitalDistricts && selectedHospitalDistricts.length > 0 && (
                  <div>
                    <div>
                      <Text variant='bold'>Sairaanhoitopiiri</Text>
                    </div>
                    {selectedHospitalDistricts.map((item) => (
                      <Chip
                        key={item}
                        removable
                        actionLabel='remove'
                        onClick={() =>
                          setLocationFilter(
                            'hospitalDistrict',
                            selectedHospitalDistricts.filter((it) => it !== item),
                          )
                        }
                      >
                        {hospitalDistricts.find((it) => it.codeValue === item)?.prefLabel[locale]}
                      </Chip>
                    ))}
                  </div>
                )}

                {selectedWellbeingCounties && selectedWellbeingCounties.length > 0 && (
                  <div>
                    <div>
                      <Text variant='bold'>Hyvinvointialue</Text>
                    </div>
                    {selectedWellbeingCounties.map((item) => (
                      <Chip
                        key={item}
                        removable
                        actionLabel='remove'
                        onClick={() =>
                          setLocationFilter(
                            'wellbeingCounty',
                            selectedWellbeingCounties.filter((it) => it !== item),
                          )
                        }
                      >
                        {wellbeingCounties.find((it) => it.codeValue === item)?.prefLabel[locale]}
                      </Chip>
                    ))}
                  </div>
                )}

                {targetGroupFilters && targetGroupFilters.length > 0 && (
                  <div>
                    <div>
                      <Text variant='bold'>Kohderyhmä</Text>
                    </div>
                    {targetGroupFilters.map((tg) => (
                      <Chip key={tg}>{targetGroups.find((item) => item.codeValue === tg)?.prefLabel[locale]}</Chip>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </SelectedContainer>
        <div></div>
      </>
    </Container>
  )
}

export { SelectedContainer }
