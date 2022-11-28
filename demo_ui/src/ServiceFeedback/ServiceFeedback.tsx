import { Icon, Text, suomifiDesignTokens } from 'suomifi-ui-components'
import styled from 'styled-components'
import { FC, useState } from 'react'
import { sendFeedback } from '../http/api'

const StyledButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  margin: ${suomifiDesignTokens.spacing.s} 0;
`

type Props = {
  recommendationID: number
  serviceID: string
}

const StyledFeedbackText = styled(Text)`
  color: ${suomifiDesignTokens.colors.highlightBase};
  margin-right: ${suomifiDesignTokens.spacing.s};
`

export const ServiceFeedback: FC<Props> = ({ recommendationID, serviceID }) => {
  const [isSelected, setIsSelected] = useState(false)

  const handleClick = async () => {
    try {
      if (!isSelected) {
        setIsSelected(true)
        await sendFeedback(recommendationID, serviceID)
      }
    } catch (e) {
      console.error(`Error sending feedback: ${e}`)
      setIsSelected(false)
    }
  }
  return (
    <div>
      <StyledButton onClick={() => handleClick()} type='button'>
        <StyledFeedbackText>Tämä palvelu olisi minulle hyödyllinen</StyledFeedbackText>
        {isSelected ? (
          <Icon
            ariaLabel='Pidä ehdotuksesta'
            color={suomifiDesignTokens.colors.highlightBase}
            icon='heartFilled'
            disabled
          />
        ) : (
          <Icon ariaLabel='Pidä ehdotuksesta' color={suomifiDesignTokens.colors.highlightBase} icon='heart' />
        )}
      </StyledButton>
    </div>
  )
}
