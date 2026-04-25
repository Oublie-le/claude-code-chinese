import * as React from 'react'
import { BLACK_CIRCLE } from '../constants/figures.js'
import { Box, Text } from '@anthropic/ink'
import type { Screen } from '../screens/REPL.js'
import type { NormalizedUserMessage } from '../types/message.js'
import { getUserMessageText } from '../utils/messages.js'
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js'
import { MessageResponse } from './MessageResponse.js'
import { t } from '../utils/language.js'

type Props = {
  message: NormalizedUserMessage
  screen: Screen
}

export function CompactSummary({ message, screen }: Props): React.ReactNode {
  const isTranscriptMode = screen === 'transcript'
  const textContent = getUserMessageText(message) || ''
  const metadata = message.summarizeMetadata as {
    messagesSummarized?: number
    direction?: string
    userContext?: string
  } | undefined

  // "Summarize from here" with metadata
  if (metadata) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="row">
          <Box minWidth={2}>
            <Text color="text">{BLACK_CIRCLE}</Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>{t('compact.summarized')}</Text>
            {!isTranscriptMode && (
              <MessageResponse>
                <Box flexDirection="column">
                  <Text dimColor>
                    {metadata.direction === 'up_to'
                      ? t('compact.messages.upto', { count: String(metadata.messagesSummarized ?? 0) })
                      : t('compact.messages.from', { count: String(metadata.messagesSummarized ?? 0) })}
                  </Text>
                  {metadata.userContext && (
                    <Text dimColor>
                      {t('compact.context', { ctx: metadata.userContext })}
                    </Text>
                  )}
                  <Text dimColor>
                    <ConfigurableShortcutHint
                      action="app:toggleTranscript"
                      context="Global"
                      fallback="ctrl+o"
                      description={t('compact.expand')}
                      parens
                    />
                  </Text>
                </Box>
              </MessageResponse>
            )}
            {isTranscriptMode && (
              <MessageResponse>
                <Text>{textContent}</Text>
              </MessageResponse>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  // Default compact summary (auto-compact)
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row">
        <Box minWidth={2}>
          <Text color="text">{BLACK_CIRCLE}</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold>
            压缩摘要
            {!isTranscriptMode && (
              <Text dimColor>
                {' '}
                <ConfigurableShortcutHint
                  action="app:toggleTranscript"
                  context="Global"
                  fallback="ctrl+o"
                  description="展开"
                  parens
                />
              </Text>
            )}
          </Text>
        </Box>
      </Box>
      {isTranscriptMode && (
        <MessageResponse>
          <Text>{textContent}</Text>
        </MessageResponse>
      )}
    </Box>
  )
}
