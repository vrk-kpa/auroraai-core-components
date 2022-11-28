import { Checkbox, Block } from 'suomifi-ui-components'
import { useRecoilState } from 'recoil'
import { localeState } from '../state/global'
import { PTVEntity, targetGroups } from '../types'

const TargetGroupFilter = ({
  selectedTargetGroups,
  setSelectedTargetGroups,
}: {
  selectedTargetGroups: string[]
  setSelectedTargetGroups: (items: string[]) => void
}) => {
  const [locale] = useRecoilState(localeState)

  const topLevelTargetGroups = targetGroups.filter((item) => item.hierarchyLevel === 1)

  const isTargetGroupSelected = (targetGroup: PTVEntity) => {
    return selectedTargetGroups?.includes(targetGroup.codeValue)
  }

  const selectTargetGroup = (tg: string, selected: boolean) => {
    setSelectedTargetGroups(
      selected ? selectedTargetGroups.concat(tg) : selectedTargetGroups.filter((item) => item !== tg),
    )
  }

  return (
    <>
      {topLevelTargetGroups.map((item) => {
        return (
          <Block key={item.id}>
            <Checkbox
              id={item.codeValue}
              onClick={({ checkboxState }) => selectTargetGroup(item.codeValue, checkboxState)}
              checked={isTargetGroupSelected(item)}
            >
              {item.prefLabel[locale]}
            </Checkbox>
          </Block>
        )
      })}
    </>
  )
}

export default TargetGroupFilter
