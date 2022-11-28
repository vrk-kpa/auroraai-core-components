import { suomifiDesignTokens } from 'suomifi-ui-components'
import styled from 'styled-components'
import Slider, { SliderTooltip } from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useRecoilState } from 'recoil'
import { metersState } from '../state/global'
import { Meter } from '../http/api'
import { omit } from 'ramda'
const { Handle } = Slider

const handle = (props: any): JSX.Element => {
  const { value, dragging, index, ...restProps } = props
  return (
    <SliderTooltip
      prefixCls='rc-slider-tooltip'
      overlay={`${value - 1}`}
      visible={value > 0 ? dragging : false}
      placement='top'
      key={index}
      overlayInnerStyle={{
        background: suomifiDesignTokens.colors.highlightBase,
        borderColor: suomifiDesignTokens.colors.highlightBase,
      }}
    >
      <Handle value={value} {...restProps} />
    </SliderTooltip>
  )
}

const Container = styled.div`
    margin-bottom: ${suomifiDesignTokens.spacing.xxxl};
    margin-top: ${suomifiDesignTokens.spacing.s};
    .rc-slider {
        width: 90%;
        margin: auto;
    .rc-slider-tooltip-arrow {
        border-color: ${suomifiDesignTokens.colors.highlightBase}
    }
    .rc-slider-mark{
        .rc-slider-mark-text{
            width: 50px;
        }
        .rc-slider-mark-text:nth-child(2){
            left: 10%;
        }
        .rc-slider-mark-text:last{
            left: 97%;
    }
    }
}
}
`

const AttributeSlider = ({ id, attrType }: { id?: string; attrType: Meter }) => {
  const [meters, setMeters] = useRecoilState(metersState)

  return (
    <Container id={id ?? 'attributes-slider'}>
      <Slider
        min={0}
        max={11}
        step={1}
        trackStyle={{ background: suomifiDesignTokens.colors.highlightBase }}
        handleStyle={{ borderColor: suomifiDesignTokens.colors.highlightBase }}
        value={(meters[attrType] ?? -1) + 1}
        onChange={(v) =>
          v !== 0 ? setMeters({ ...meters, ...{ [attrType]: v - 1 } }) : setMeters(omit([attrType], meters))
        }
        marks={{ 0: 'Ei vastattu', 1: 'Erittäin huono', 11: 'Erittäin hyvä' }}
        handle={handle}
      />
    </Container>
  )
}

export default AttributeSlider
