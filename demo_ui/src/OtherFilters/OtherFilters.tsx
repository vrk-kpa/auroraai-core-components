import { Checkbox, Block, Text } from 'suomifi-ui-components'
import { FundingType, fundingTypeFilters } from '../types'

const OtherFilters = ({
  selectedFundingType,
  setSelectedFundingType,
}: {
  selectedFundingType: string[]
  setSelectedFundingType: (items: string[]) => void
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
