import { Text } from 'suomifi-ui-components'
import { Question } from '../Questions/Questions'
import AttributeSlider from './AttributeSlider'
import { Fragment } from 'react'

const attributes: Question[] = [
  { type: 'health', description: 'Terveydentila' },
  { type: 'resilience', description: 'Vaikeuksien voittaminen' },
  { type: 'housing', description: 'Asuminen' },
  { type: 'working_studying', description: 'Päivittäinen pärjääminen' },
  { type: 'family', description: 'Perhe ja läheiset' },
  { type: 'friends', description: 'Luotettavat ystävät' },
  { type: 'finance', description: 'Taloudellinen tilanne' },
  { type: 'improvement_of_strengths', description: 'Itsensä kehittäminen' },
  { type: 'self_esteem', description: 'Itsetunto' },
  { type: 'life_satisfaction', description: 'Tyytyväisyys elämään' },
]

const AttributesFilter = () => {
  return (
    <>
      {attributes.map((attr) => (
        <Fragment key={attr.type}>
          <Text variant='bold'>{attr.description}</Text>
          <AttributeSlider id={`${attr.type}-slider`} attrType={attr.type} />
        </Fragment>
      ))}
    </>
  )
}

export default AttributesFilter
export { attributes }
