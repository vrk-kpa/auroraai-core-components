import { suomifiDesignTokens, Button, Text } from 'suomifi-ui-components'
import styled from 'styled-components'
import { useState } from 'react'
import { sendFeedback } from '../http/api'
import { ExtendedFeedback } from './ExtendedFeedback'
import ThumbsUpIcon from 'jsx:../resources/images/thumbs-up.svg'
import ThumbsDownIcon from 'jsx:../resources/images/thumbs-down.svg'
import ThumbsUpIconFilled from 'jsx:../resources/images/thumbs-up-filled.svg'
import ThumbsDownIconFilled from 'jsx:../resources/images/thumbs-down-filled.svg'

const FeedbackContainer = styled.div`
  margin: ${suomifiDesignTokens.spacing.s} 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;

  button:focus {
    border: none;
  }
`

export const RecommendationFeedback = ({
  recommendationId,
  serviceId,
}: {
  recommendationId: number
  serviceId: string
}) => {
  const [score, setScore] = useState(0)
  const [open, setOpen] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(false)

  const giveFeedback = async (id: string, score: number) => {
    setScore(score)
    setFeedbackGiven(true)

    await sendFeedback(recommendationId, serviceId, score)

    if (score === -1) setOpen(true)
  }

  return (
    <>
      <FeedbackContainer>
        <Text>Oliko tämä suosittelu sinulle hyödyllinen?</Text>
        <Button
          color={feedbackGiven ? suomifiDesignTokens.colors.depthBase : suomifiDesignTokens.colors.highlightBase}
          variant='secondaryNoBorder'
          aria-label='thumbs-down'
          style={{
            margin: '5px',
            padding: 0,
            paddingTop: '13px',
            height: '20px',
            width: '20px',
            border: 'none',
            background: 'none',
          }}
          onClick={() => giveFeedback(serviceId, -1)}
          disabled={feedbackGiven}
        >
          {feedbackGiven && score === -1 ? (
            <ThumbsDownIconFilled fill={suomifiDesignTokens.colors.highlightBase} />
          ) : (
            <ThumbsDownIcon fill={suomifiDesignTokens.colors.highlightBase} />
          )}
        </Button>
        <Button
          color={suomifiDesignTokens.colors.highlightBase}
          variant='secondaryNoBorder'
          aria-label='thumbs-up'
          style={{
            margin: '5px',
            padding: 0,
            height: '20px',
            width: '20px',
            border: 'none',
            background: 'none',
          }}
          onClick={() => giveFeedback(serviceId, 1)}
          disabled={feedbackGiven}
        >
          {feedbackGiven && score === 1 ? (
            <ThumbsUpIconFilled fill={suomifiDesignTokens.colors.highlightBase} />
          ) : (
            <ThumbsUpIcon fill={suomifiDesignTokens.colors.highlightBase} />
          )}
        </Button>
      </FeedbackContainer>
      {open && (
        <ExtendedFeedback
          recommendationId={recommendationId}
          serviceId={serviceId}
          score={score}
          hide={() => setOpen(false)}
        />
      )}
    </>
  )
}

export default RecommendationFeedback
export { FeedbackContainer }
