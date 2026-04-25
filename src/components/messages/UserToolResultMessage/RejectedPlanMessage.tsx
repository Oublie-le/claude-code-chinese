import * as React from 'react'
import { Markdown } from 'src/components/Markdown.js'
import { MessageResponse } from 'src/components/MessageResponse.js'
import { t } from 'src/utils/language.js'
import { Box, Text } from '@anthropic/ink'

type Props = {
  plan: string
}

export function RejectedPlanMessage({ plan }: Props): React.ReactNode {
  return (
    <MessageResponse>
      <Box flexDirection="column">
        <Text color="subtle">{t('rejectedPlan.label')}</Text>
        <Box
          borderStyle="round"
          borderColor="planMode"
          paddingX={1}
          // Necessary for Windows Terminal to render properly
          overflow="hidden"
        >
          <Markdown>{plan}</Markdown>
        </Box>
      </Box>
    </MessageResponse>
  )
}
