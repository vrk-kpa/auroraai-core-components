import {
  Text,
  suomifiDesignTokens,
  SearchInput,
  ExpanderTitleButton,
  Expander,
  ExpanderContent,
  Checkbox,
  Block,
  Icon,
  HintText,
} from 'suomifi-ui-components'
import styled from 'styled-components'
import { useState } from 'react'
import { localeState } from '../state/global'
import { PTVServiceClass, ptvServiceClasses } from '../types'
import { Language } from '../types'
import { useRecoilState } from 'recoil'

const SecPTVClass = styled.div`
  display: flex;
  align-items: center;
  margin: ${suomifiDesignTokens.spacing.xs} ${suomifiDesignTokens.spacing.m};
`
const ServiceClassContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: ${suomifiDesignTokens.spacing.xs} 0;
`
const SelectionContainer = styled.div`
  display: flex;
  align-items: flex-start;
`
const DescriptionContainer = styled.div`
  font-size: 13px;
  margin: ${suomifiDesignTokens.spacing.xs} 0;
`
const IconContainer = styled.span`
  padding-left: ${suomifiDesignTokens.spacing.xs};
  padding-top: ${suomifiDesignTokens.spacing.xxs};
  cursor: pointer;
`

const PTVClassFilter = ({
  selectedPTVServiceClasses,
  setSelectedPTVServiceClasses,
}: {
  selectedPTVServiceClasses: PTVServiceClass[]
  setSelectedPTVServiceClasses: (items: PTVServiceClass[]) => void
}) => {
  
  const [locale] = useRecoilState(localeState)

  //search field
  const [searchClass, setSearchClass] = useState<string>('')

  const mainClasses = ptvServiceClasses.filter((item) => item.hierarchyLevel === 1)

  const isMainClassSelected = (ptvClass: PTVServiceClass) => {
    if (ptvClass.broaderCode)
      return selectedPTVServiceClasses.some((item) => item.codeValue === ptvClass.broaderCode?.codeValue)
  }

  const selectChildren = (ptvClass: PTVServiceClass) => {
    return ptvServiceClasses.filter((item) => item.broaderCode?.codeValue === ptvClass.codeValue)
  }

  const selectSiblings = (ptvClass: PTVServiceClass) => {
    return ptvServiceClasses.filter(
      (item) => isSecondaryClass(ptvClass) && item.broaderCode?.codeValue === ptvClass.broaderCode?.codeValue,
    )
  }

  const isClassSelected = (ptvClass: PTVServiceClass) => {
    return selectedPTVServiceClasses.some((item: PTVServiceClass) => item.codeValue === ptvClass.codeValue)
  }

  const isAllSiblingsSelected = (ptvClass: PTVServiceClass) => {
    return (
      ptvServiceClasses.filter((item) => item.broaderCode?.codeValue === ptvClass.broaderCode?.codeValue).length ===
      selectedPTVServiceClasses.filter((item) => item.broaderCode?.codeValue === ptvClass.broaderCode?.codeValue)
        .length +
        1
    )
  }

  const isSecondaryClass = (ptvClass: PTVServiceClass) => {
    return ptvClass.hierarchyLevel !== 1
  }

  const handleMainClassSelectionChange = (ptvClass: PTVServiceClass, include: boolean) => {
    const selected = include
      ? selectedPTVServiceClasses.concat(ptvClass).filter((item) => item.broaderCode?.codeValue !== ptvClass.codeValue)
      : selectedPTVServiceClasses.filter((item) => item.codeValue !== ptvClass.codeValue)

    setSelectedPTVServiceClasses(selected)
  }

  const handleSubClassSelectionChange = (ptvClass: PTVServiceClass, include: boolean) => {
    let selected = selectedPTVServiceClasses
    const broaderClass = ptvClass.broaderCode
    if (include) {
      //add if not already in the list
      if (!selectedPTVServiceClasses.some((item) => item.codeValue === ptvClass.codeValue))
        selected = selectedPTVServiceClasses.concat(ptvClass)

      //if all siblings selected, select broader class
      if (isAllSiblingsSelected(ptvClass) && broaderClass && !isClassSelected(broaderClass)) {
        selected = selected
          .concat(broaderClass)
          .filter((item) => item.broaderCode?.codeValue !== broaderClass.codeValue)
      }
    } else {
      // remove broader class if selected
      if (broaderClass && isMainClassSelected(ptvClass)) {
        selected = selectedPTVServiceClasses
          .filter((item) => item.codeValue !== broaderClass.codeValue)
          .concat(selectSiblings(ptvClass))
      }

      selected = selected.filter((item) => item.codeValue !== ptvClass.codeValue)
    }

    setSelectedPTVServiceClasses(selected)
  }

  const filterClasses = (ptvClass: PTVServiceClass) => {
    //filter by main class name, ignore case
    return searchClass?.length > 0 ? ptvClass.prefLabel[locale].toLowerCase().includes(searchClass.toLowerCase()) : true
  }

  return (
    <>
      <Block style={{ margin: `${suomifiDesignTokens.spacing.m} 0` }}>
        <SearchInput
          clearButtonLabel='Tyhjennä haku'
          labelText='Rajaa hakemalla'
          searchButtonLabel='Hae'
          value={searchClass}
          onChange={(e) => setSearchClass(e?.toString() ?? '')}
        />
      </Block>

      {mainClasses
        .filter((ptvClass) => filterClasses(ptvClass))
        .map((item) => {
          const childItems = selectChildren(item)
          return (
            <Expander key={item.codeValue}>
              <ExpanderTitleButton>
                {item.prefLabel[locale]} {`(${childItems.length})`}
              </ExpanderTitleButton>
              <ExpanderContent>
                <Text variant='bold'>Pääluokka</Text>
                <ServiceClassSelector
                  item={item}
                  locale={locale}
                  handleSelectionChange={handleMainClassSelectionChange}
                  isClassSelected={isClassSelected}
                />

                {childItems.length > 0 && (
                  <>
                    <Text variant='bold'>Alapalveluluokat</Text>
                    {childItems.map((child) => (
                      <SecPTVClass key={child.codeValue}>
                        <Checkbox
                          id={child.codeValue}
                          onClick={({ checkboxState }) => handleSubClassSelectionChange(child, checkboxState)}
                          checked={isClassSelected(child) || isMainClassSelected(child)}
                        >
                          {child.prefLabel[locale]}
                        </Checkbox>
                      </SecPTVClass>
                    ))}
                  </>
                )}
              </ExpanderContent>
            </Expander>
          )
        })}
    </>
  )
}

const ServiceClassSelector = ({
  item,
  locale,
  handleSelectionChange,
  isClassSelected,
}: {
  item: PTVServiceClass
  locale: Language
  handleSelectionChange: (item: PTVServiceClass, checkboxState: boolean) => void
  isClassSelected: (item: PTVServiceClass) => boolean
}) => {
  const [show, setShow] = useState<boolean>()

  return (
    <ServiceClassContainer>
      <SelectionContainer>
        <Checkbox
          id={item.codeValue}
          onClick={({ checkboxState }) => handleSelectionChange(item, checkboxState)}
          checked={isClassSelected(item)}
        >
          {item.prefLabel[locale]}
        </Checkbox>
        <IconContainer onClick={() => setShow(!show)}>
          <Icon
            icon='info'
            ariaLabel='info'
            fill={suomifiDesignTokens.colors.highlightBase}
            css={{
              width: '1.5rem',
              height: '1.5rem',
            }}
          />
        </IconContainer>
      </SelectionContainer>
      {show && (
        <DescriptionContainer>
          <HintText>{item.description[locale]}</HintText>
        </DescriptionContainer>
      )}
    </ServiceClassContainer>
  )
}

export default PTVClassFilter
