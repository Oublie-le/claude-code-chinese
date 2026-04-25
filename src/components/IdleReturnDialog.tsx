import React from 'react'
import { Box, Text } from '@anthropic/ink'
import { formatTokens } from '../utils/format.js'
import { Select } from './CustomSelect/index.js'
import { Dialog } from '@anthropic/ink'
import { t } from '../utils/language.js'

type IdleReturnAction = 'continue' | 'clear' | 'dismiss' | 'never'

type Props = {
  idleMinutes: number
  totalInputTokens: number
  onDone: (action: IdleReturnAction) => void
}

export function IdleReturnDialog({
  idleMinutes,
  totalInputTokens,
  onDone,
}: Props): React.ReactNode {
  const formattedIdle = formatIdleDuration(idleMinutes)
  const formattedTokens = formatTokens(totalInputTokens)

  return (
    <Dialog
      title={t('idle.return.title', { idle: formattedIdle, tokens: formattedTokens })}
      onCancel={() => onDone('dismiss')}
    >
      <Box flexDirection="column">
        <Text>
          {t('idle.return.hint')}
        </Text>
      </Box>
      <Select
        options={[
          {
            value: 'continue' as const,
            label: t('idle.return.continue'),
          },
          {
            value: 'clear' as const,
            label: t('idle.return.clear'),
          },
          {
            value: 'never' as const,
            label: t('idle.return.never'),
          },
        ]}
        onChange={(value: IdleReturnAction) => onDone(value)}
      />
    </Dialog>
  )
}

function formatIdleDuration(minutes: number): string {
  if (minutes < 1) {
    return '< 1m'
  }
  if (minutes < 60) {
    return `${Math.floor(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.floor(minutes % 60)
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}
