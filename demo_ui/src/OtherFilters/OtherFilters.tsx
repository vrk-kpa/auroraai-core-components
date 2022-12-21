import styled from 'styled-components'
import { Checkbox, Block, Text, suomifiDesignTokens } from 'suomifi-ui-components'
import { FundingType, fundingTypeFilters } from '../types'

export const RerankContainer = styled.div`
  margin-top: ${suomifiDesignTokens.spacing.s};
  margin-bottom: ${suomifiDesignTokens.spacing.s};
  display: flex;
`

const OtherFilters = ({
  selectedFundingType,
  setSelectedFundingType,
  rerank,
  setRerank,
}: {
  selectedFundingType: string[]
  setSelectedFundingType: (items: string[]) => void
  rerank: boolean
  setRerank: (value: boolean) => void
}) => {
  const isFundingTypeSelected = (fundingType: FundingType) => {
    return selectedFundingType?.includes(fundingType)
  }

  const selectFundingType = (fundingType: FundingType, selected: boolean) => {
    setSelectedFundingType(
      selected ? selectedFundingType.concat(fundingType) : selectedFundingType.filter((item) => item !== fundingType),
    )
  }

  return (
    <>
      <RerankContainer>
        <Block>
          <Checkbox id='rerank-checkbox' onClick={({ checkboxState }) => setRerank(checkboxState)} checked={rerank}>
            Järjestä suosittelut käytön mukaan
          </Checkbox>
        </Block>
      </RerankContainer>
      <Block>
        <Text variant='bold'>Rahoitustyyppi</Text>

        {fundingTypeFilters.map((item) => (
          <Checkbox
            id={`${item.type}-checkbox`}
            onClick={({ checkboxState }) => selectFundingType(item.type, checkboxState)}
            checked={isFundingTypeSelected(item.type)}
          >
            {item.name}
          </Checkbox>
        ))}
      </Block>
    </>
  )
}

export default OtherFilters
