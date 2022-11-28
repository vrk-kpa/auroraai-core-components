import React, { FC } from 'react'
import styled from 'styled-components'
import { suomifiDesignTokens, Text } from 'suomifi-ui-components'
import { Meter } from '../http/api'

const QuestionContainer = styled.div`
  margin: ${suomifiDesignTokens.spacing.l} 0;
`

const RangeLabel = styled(Text).attrs({ smallScreen: true })`
  display: inline-block;
`

const Options = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Option = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export type Question = {
  type: Meter
  description: string
}

type Props = {
  questions: Question[]
  options: number[]
  onOptionSelect: (question: Question, option: number) => void
  isMutable?: boolean
}

export const Questions: FC<Props> = ({ questions, options, onOptionSelect, isMutable = true }) => (
  <div>
    {questions.map((q) => (
      <QuestionContainer key={q.type}>
        <Text>{q.description}</Text>
        <Options>
          <RangeLabel>Erittäin tyytymätön</RangeLabel>
          {options.map((option) => (
            <Option key={option}>
              <input
                type='radio'
                id={`${q.type}_${option}`}
                name={q.type}
                value={option}
                onChange={(_) => onOptionSelect(q, option)}
                disabled={!isMutable}
              />
              <label htmlFor={`${q.type}_${option}`}>{option}</label>
            </Option>
          ))}
          <RangeLabel>Erittäin tyytyväinen</RangeLabel>
        </Options>
      </QuestionContainer>
    ))}
  </div>
)
