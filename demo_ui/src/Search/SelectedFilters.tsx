import { useRecoilState } from 'recoil'
import styled from 'styled-components'
import { Text, suomifiDesignTokens, Chip, Heading, Button } from 'suomifi-ui-components'

import { FiltersState, localeState, termSearchFiltersState } from '../state/global'
import {
  fundingTypeFilters,
  hospitalDistricts,
  municipalityCodes,
  regions,
  targetGroups,
  wellbeingCounties,
} from '../types'

const SelectedContainer = styled.div`
  margin-bottom: ${suomifiDesignTokens.spacing.s};
  padding-bottom: ${suomifiDesignTokens.spacing.xs};

  .fi-multiselect {
    width: 100%;

    .fi-filter-input {
      width: 290px;
    }
  }

  h2 {
    margin-bottom: 10px;
  }

  button {
    margin: ${suomifiDesignTokens.spacing.xs} 0;
    margin-right: ${suomifiDesignTokens.spacing.xs};
  }
`

export const SelectedFilters = () => {
  const [filters, setFilters] = useRecoilState<FiltersState>(termSearchFiltersState)

  const { includeNationalServices, locationFilters, targetGroupFilters, serviceClassFilters, fundingType } = filters

  const [locale] = useRecoilState(localeState)

  const resetFilters = () => {
    setFilters({
      includeNationalServices: false,
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
    })
  }

  return (
    <SelectedContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading variant='h2'>
          <Text variant='bold' style={{ color: `${suomifiDesignTokens.colors.highlightBase}` }}>
            Valitut filtterit
          </Text>
        </Heading>
        <div>
          <Button variant='secondary' onClick={resetFilters}>
            Tyhjennä kaikki
          </Button>
        </div>
      </div>

      <div>
        {includeNationalServices && <Chip>Valtakunnalliset palvelut</Chip>}
        {fundingType.map((item) => (
          <Chip>{fundingTypeFilters.find((it) => it.type === item)?.name}</Chip>
        ))}
      </div>

      <div>
        {locationFilters['municipalities'].length > 0 && (
          <div>
            <div>
              <Text variant='bold'>Kunta</Text>
            </div>
            {locationFilters['municipalities'].map((item) => (
              <Chip key={item}>{municipalityCodes[item]}</Chip>
            ))}
          </div>
        )}

        {locationFilters['region'].length > 0 && (
          <div>
            <div>
              <Text variant='bold'>Maakunta</Text>
            </div>
            {locationFilters['region'].map((item) => (
              <Chip key={item}>{regions.find((it) => it.codeValue === item)?.prefLabel[locale]}</Chip>
            ))}
          </div>
        )}

        {locationFilters['hospitalDistrict'].length > 0 && (
          <div>
            <div>
              <Text variant='bold'>Sairaanhoitopiiri</Text>
            </div>
            {locationFilters['hospitalDistrict'].map((item) => (
              <Chip key={item}>{hospitalDistricts.find((it) => it.codeValue === item)?.prefLabel[locale]}</Chip>
            ))}
          </div>
        )}

        {locationFilters['wellbeingCounty'].length > 0 && (
          <div>
            <div>
              <Text variant='bold'>Hyvinvointialue</Text>
            </div>
            {locationFilters['wellbeingCounty'].map((item) => (
              <Chip key={item}>{wellbeingCounties.find((it) => it.codeValue === item)?.prefLabel[locale]}</Chip>
            ))}
          </div>
        )}

        <div>
          {serviceClassFilters && serviceClassFilters.length > 0 && (
            <>
              <Text variant='bold'>Palveluluokat</Text>
              <div>
                {serviceClassFilters.map((item) => (
                  <Chip key={item.codeValue}>{item.prefLabel[locale]}</Chip>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          {targetGroupFilters && targetGroupFilters.length > 0 && (
            <>
              <Text variant='bold'>Kohderyhmä</Text>
              <div>
                {targetGroupFilters.map((tg) => (
                  <Chip key={tg}>{targetGroups.find((item) => item.codeValue === tg)?.prefLabel[locale]}</Chip>
                ))}
              </div>
            </>
          )}
        </div>

        {!includeNationalServices &&
          locationFilters['municipalities'].length === 0 &&
          locationFilters['region'].length === 0 &&
          locationFilters['hospitalDistrict'].length === 0 &&
          locationFilters['wellbeingCounty'].length === 0 &&
          serviceClassFilters.length === 0 &&
          targetGroupFilters.length === 0 && <span> Ei valittu</span>}
      </div>
    </SelectedContainer>
  )
}
