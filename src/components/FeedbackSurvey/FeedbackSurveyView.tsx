import React from 'react'
import { Box, Text } from '@anthropic/ink'
import { t } from '../../utils/language.js'
import { useDebouncedDigitInput } from './useDebouncedDigitInput.js'
import type { FeedbackSurveyResponse } from './utils.js'

type Props = {
  onSelect: (option: FeedbackSurveyResponse) => void
  inputValue: string
  setInputValue: (value: string) => void
  message?: string
}

const RESPONSE_INPUTS = ['0', '1', '2', '3'] as const
type ResponseInput = (typeof RESPONSE_INPUTS)[number]

const inputToResponse: Record<ResponseInput, FeedbackSurveyResponse> = {
  '0': 'dismissed',
  '1': 'bad',
  '2': 'fine',
  '3': 'good',
} as const

export const isValidResponseInput = (input: string): input is ResponseInput =>
  (RESPONSE_INPUTS as readonly string[]).includes(input)

export function FeedbackSurveyView({
  onSelect,
  inputValue,
  setInputValue,
  message,
}: Props): React.ReactNode {
  const displayMessage = message ?? t('survey.question')
  useDebouncedDigitInput({
    inputValue,
    setInputValue,
    isValidDigit: isValidResponseInput,
    onDigit: digit => onSelect(inputToResponse[digit]),
  })

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color="ansi:cyan">● </Text>
        <Text bold>{displayMessage}</Text>
      </Box>

      <Box marginLeft={2}>
        <Box width={10}>
          <Text>
            <Text color="ansi:cyan">1</Text>: {t('survey.bad')}
          </Text>
        </Box>
        <Box width={10}>
          <Text>
            <Text color="ansi:cyan">2</Text>: {t('survey.fine')}
          </Text>
        </Box>
        <Box width={10}>
          <Text>
            <Text color="ansi:cyan">3</Text>: {t('survey.good')}
          </Text>
        </Box>
        <Box>
          <Text>
            <Text color="ansi:cyan">0</Text>: {t('survey.dismiss')}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
