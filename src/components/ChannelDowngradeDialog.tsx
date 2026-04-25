import React from 'react'
import { Text } from '@anthropic/ink'
import { Select } from './CustomSelect/index.js'
import { Dialog } from '@anthropic/ink'
import { t } from '../utils/language.js'

export type ChannelDowngradeChoice = 'downgrade' | 'stay' | 'cancel'

type Props = {
  currentVersion: string
  onChoice: (choice: ChannelDowngradeChoice) => void
}

/**
 * Dialog shown when switching from latest to stable channel.
 * Allows user to choose whether to downgrade or stay on current version.
 */
export function ChannelDowngradeDialog({
  currentVersion,
  onChoice,
}: Props): React.ReactNode {
  function handleSelect(value: ChannelDowngradeChoice): void {
    onChoice(value)
  }

  function handleCancel(): void {
    onChoice('cancel')
  }

  return (
    <Dialog
      title={t('channel.downgrade.title')}
      onCancel={handleCancel}
      color="permission"
      hideBorder
      hideInputGuide
    >
      <Text>
        {t('channel.downgrade.body', { version: currentVersion })}
      </Text>
      <Text dimColor>{t('channel.downgrade.how')}</Text>
      <Select
        options={[
          {
            label: t('channel.downgrade.allow'),
            value: 'downgrade' as ChannelDowngradeChoice,
          },
          {
            label: t('channel.downgrade.stay', { version: currentVersion }),
            value: 'stay' as ChannelDowngradeChoice,
          },
        ]}
        onChange={handleSelect}
      />
    </Dialog>
  )
}
