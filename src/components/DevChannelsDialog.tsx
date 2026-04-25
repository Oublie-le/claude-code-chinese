import React, { useCallback } from 'react'
import type { ChannelEntry } from '../bootstrap/state.js'
import { Box, Text, Dialog } from '@anthropic/ink'
import { gracefulShutdownSync } from '../utils/gracefulShutdown.js'
import { Select } from './CustomSelect/index.js'
import { t } from '../utils/language.js'

type Props = {
  channels: ChannelEntry[]
  onAccept(): void
}

export function DevChannelsDialog({
  channels,
  onAccept,
}: Props): React.ReactNode {
  function onChange(value: 'accept' | 'exit') {
    switch (value) {
      case 'accept':
        onAccept()
        break
      case 'exit':
        gracefulShutdownSync(1)
        break
    }
  }

  const handleEscape = useCallback(() => {
    gracefulShutdownSync(0)
  }, [])

  return (
    <Dialog
      title={t('devchannel.title')}
      color="error"
      onCancel={handleEscape}
    >
      <Box flexDirection="column" gap={1}>
        <Text>
          {t('devchannel.body1')}
        </Text>
        <Text>{t('devchannel.body2')}</Text>
        <Text dimColor>
          {t('devchannel.channelsLabel')}{' '}
          {channels
            .map(c =>
              c.kind === 'plugin'
                ? `plugin:${c.name}@${c.marketplace}`
                : `server:${c.name}`,
            )
            .join(', ')}
        </Text>
      </Box>

      <Select
        options={[
          { label: t('devchannel.accept'), value: 'accept' },
          { label: t('devchannel.exit'), value: 'exit' },
        ]}
        onChange={value => onChange(value as 'accept' | 'exit')}
      />
    </Dialog>
  )
}
