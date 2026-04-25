import React from 'react'
import { Box, Dialog, Link, Text } from '@anthropic/ink'
import { Select } from './CustomSelect/index.js'
import { t } from '../utils/language.js'

type Props = {
  onDone: () => void
}

export function CostThresholdDialog({ onDone }: Props): React.ReactNode {
  return (
    <Dialog
      title={t('cost.threshold.title')}
      onCancel={onDone}
    >
      <Box flexDirection="column">
        <Text>{t('cost.threshold.learn')}</Text>
        <Link url="https://code.claude.com/docs/en/costs" />
      </Box>
      <Select
        options={[
          {
            value: 'ok',
            label: t('cost.threshold.ok'),
          },
        ]}
        onChange={onDone}
      />
    </Dialog>
  )
}
