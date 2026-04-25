import React from 'react'
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js'
import { Box, Text } from '@anthropic/ink'
import { useKeybinding } from '../../keybindings/useKeybinding.js'
import type { SettingsJson } from '../../utils/settings/types.js'
import { t } from '../../utils/language.js'
import { Select } from '../CustomSelect/index.js'
import { PermissionDialog } from '../permissions/PermissionDialog.js'
import {
  extractDangerousSettings,
  formatDangerousSettingsList,
} from './utils.js'

type Props = {
  settings: SettingsJson
  onAccept: () => void
  onReject: () => void
}

export function ManagedSettingsSecurityDialog({
  settings,
  onAccept,
  onReject,
}: Props): React.ReactNode {
  const dangerous = extractDangerousSettings(settings)
  const settingsList = formatDangerousSettingsList(dangerous)

  const exitState = useExitOnCtrlCDWithKeybindings()

  useKeybinding('confirm:no', onReject, { context: 'Confirmation' })

  function onChange(value: 'accept' | 'exit'): void {
    if (value === 'exit') {
      onReject()
      return
    }
    onAccept()
  }

  return (
    <PermissionDialog
      color="warning"
      titleColor="warning"
      title={t('managed.title')}
    >
      <Box flexDirection="column" gap={1} paddingTop={1}>
        <Text>
          {t('managed.body')}
        </Text>

        <Box flexDirection="column">
          <Text dimColor>{t('managed.settings.label')}</Text>
          {settingsList.map((item, index) => (
            <Box key={index} paddingLeft={2}>
              <Text>
                <Text dimColor>· </Text>
                <Text>{item}</Text>
              </Text>
            </Box>
          ))}
        </Box>

        <Text>
          {t('managed.trust')}
        </Text>

        <Select
          options={[
            { label: t('managed.accept'), value: 'accept' },
            { label: t('managed.exit'), value: 'exit' },
          ]}
          onChange={value => onChange(value as 'accept' | 'exit')}
          onCancel={() => onChange('exit')}
        />

        <Text dimColor>
          {exitState.pending ? (
            <>{t('exit.pressAgain', { key: exitState.keyName ?? '' })}</>
          ) : (
            <>{t('managed.footer')}</>
          )}
        </Text>
      </Box>
    </PermissionDialog>
  )
}
