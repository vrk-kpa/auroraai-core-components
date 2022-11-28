import { Text, suomifiDesignTokens, Button, Block, Checkbox, Textarea } from 'suomifi-ui-components'
import styled from 'styled-components'
import { useState } from 'react'
import { sendFeedback } from '../http/api'

const ExtendedFeedbackContainer = styled.div`
  margin-bottom: ${suomifiDesignTokens.spacing.s};
  width: 100%;
  display: flex;
  flex-direction: column;
`

const Container = styled.div`
  margin: ${suomifiDesignTokens.spacing.s} 0;

  button {
    margin-right: ${suomifiDesignTokens.spacing.s};
  }
`

const feedbackOptions = [
  'Palvelu ei ole hakemalleni kohderyhmäni sopiva',
  'Palvelu ei ole hakuni aluerajauksen mukainen',
  'En ymmärrä palvelukuvausta',
  'Palvelu ei vastaa haun asiasanoja',
  'Muu syy, mikä?',
]

export const ExtendedFeedback = ({
  recommendationId,
  serviceId,
  score,
  hide,
}: {
  recommendationId: number
  serviceId: string
  score: number
  hide: () => void
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<number[]>([])
  const [otherReason, setOtherReason] = useState('')

  const handleSubmit = async () => {
    const feedback = selectedFeedback.map((i) => (i === 4 && otherReason !== '' ? otherReason : feedbackOptions[i]))

    await sendFeedback(recommendationId, serviceId, score, feedback)
  }

  const handleChange = (index: number, selected: boolean) => {
    if (selected) setSelectedFeedback(selectedFeedback.concat(index))
    else setSelectedFeedback(selectedFeedback.filter((i) => i !== index))
  }

  return (
    <ExtendedFeedbackContainer>
      <Block margin='xs'>
        <Text>Vastasit että suosittelemamme palvelu ei ole hakuusi sopiva. Miksi?</Text>
      </Block>

      <form id={`${serviceId}-extended-feedback`}>
        {feedbackOptions.map((item, index) => (
          <Checkbox
            id={`${serviceId}-feedback-option-${index}`}
            checked={selectedFeedback.includes(index)}
            onClick={({ checkboxState }) => handleChange(index, checkboxState)}
          >
            {item}
          </Checkbox>
        ))}
        <Textarea
          labelText=''
          visualPlaceholder='Kirjoita perustelut'
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
        />
        <Container>
          <Button onClick={() => handleSubmit()} disabled={selectedFeedback.length === 0}>
            Lähetä
          </Button>
          <Button variant='secondary' onClick={() => hide()}>
            Sulje
          </Button>
        </Container>
      </form>
    </ExtendedFeedbackContainer>
  )
}
