import React, { useCallback } from 'react'
import { Text, Dialog } from '@anthropic/ink'
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
import { isSupportedTerminal } from '../utils/ide.js'
import { Select } from './CustomSelect/index.js'
import { t } from '../utils/language.js'

type IdeAutoConnectDialogProps = {
  onComplete: () => void
}

export function IdeAutoConnectDialog({
  onComplete,
}: IdeAutoConnectDialogProps): React.ReactNode {
  const handleSelect = useCallback(
    async (value: string) => {
      const autoConnect = value === 'yes'

      // Save the preference and mark dialog as shown
      saveGlobalConfig(current => ({
        ...current,
        autoConnectIde: autoConnect,
        hasIdeAutoConnectDialogBeenShown: true,
      }))

      onComplete()
    },
    [onComplete],
  )

  const options = [
    { label: t('common.yes'), value: 'yes' },
    { label: t('common.no'), value: 'no' },
  ]

  return (
    <Dialog
      title={t('ide.autoConnect.enable.title')}
      color="ide"
      onCancel={onComplete}
    >
      <Select options={options} onChange={handleSelect} defaultValue={'yes'} />
      <Text dimColor>
        {t('ide.autoConnect.enable.hint')}
      </Text>
    </Dialog>
  )
}

export function shouldShowAutoConnectDialog(): boolean {
  const config = getGlobalConfig()
  return (
    !isSupportedTerminal() &&
    config.autoConnectIde !== true &&
    config.hasIdeAutoConnectDialogBeenShown !== true
  )
}

type IdeDisableAutoConnectDialogProps = {
  onComplete: (disableAutoConnect: boolean) => void
}

export function IdeDisableAutoConnectDialog({
  onComplete,
}: IdeDisableAutoConnectDialogProps): React.ReactNode {
  const handleSelect = useCallback(
    (value: string) => {
      const disableAutoConnect = value === 'yes'

      if (disableAutoConnect) {
        saveGlobalConfig(current => ({
          ...current,
          autoConnectIde: false,
        }))
      }

      onComplete(disableAutoConnect)
    },
    [onComplete],
  )

  const handleCancel = useCallback(() => {
    onComplete(false)
  }, [onComplete])

  const options = [
    { label: t('common.no'), value: 'no' },
    { label: t('common.yes'), value: 'yes' },
  ]

  return (
    <Dialog
      title={t('ide.autoConnect.disable.title')}
      subtitle={t('ide.autoConnect.disable.subtitle')}
      onCancel={handleCancel}
      color="ide"
    >
      <Select options={options} onChange={handleSelect} defaultValue={'no'} />
    </Dialog>
  )
}

export function shouldShowDisableAutoConnectDialog(): boolean {
  const config = getGlobalConfig()
  return !isSupportedTerminal() && config.autoConnectIde === true
}
