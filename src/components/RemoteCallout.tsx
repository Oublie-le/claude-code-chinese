import React, { useCallback, useEffect, useRef } from 'react'
import { isBridgeEnabled } from '../bridge/bridgeEnabled.js'
import { Box, Text } from '@anthropic/ink'
import { getClaudeAIOAuthTokens } from '../utils/auth.js'
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
import type { OptionWithDescription } from './CustomSelect/select.js'
import { Select } from './CustomSelect/select.js'
import { PermissionDialog } from './permissions/PermissionDialog.js'
import { t } from '../utils/language.js'

type RemoteCalloutSelection = 'enable' | 'dismiss'

type Props = {
  onDone: (selection: RemoteCalloutSelection) => void
}

export function RemoteCallout({ onDone }: Props): React.ReactNode {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const handleCancel = useCallback((): void => {
    onDoneRef.current('dismiss')
  }, [])

  // Permanently mark as seen on mount so it only shows once
  useEffect(() => {
    saveGlobalConfig(current => {
      if (current.remoteDialogSeen) return current
      return { ...current, remoteDialogSeen: true }
    })
  }, [])

  const handleSelect = useCallback((value: RemoteCalloutSelection): void => {
    onDoneRef.current(value)
  }, [])

  const options: OptionWithDescription<RemoteCalloutSelection>[] = [
    {
      label: t('remoteCallout.enable.label'),
      description: t('remoteCallout.enable.desc'),
      value: 'enable',
    },
    {
      label: t('remoteCallout.dismiss.label'),
      description: t('remoteCallout.dismiss.desc'),
      value: 'dismiss',
    },
  ]

  return (
    <PermissionDialog title={t('bridge.title')}>
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1} flexDirection="column">
          <Text>
            {t('remoteCallout.body1')}
          </Text>
          <Text> </Text>
          <Text>
            {t('remoteCallout.body2')}
          </Text>
        </Box>
        <Box>
          <Select
            options={options}
            onChange={handleSelect}
            onCancel={handleCancel}
          />
        </Box>
      </Box>
    </PermissionDialog>
  )
}

/**
 * Check whether to show the remote callout (first-time dialog).
 */
export function shouldShowRemoteCallout(): boolean {
  const config = getGlobalConfig()
  if (config.remoteDialogSeen) return false
  if (!isBridgeEnabled()) return false
  const tokens = getClaudeAIOAuthTokens()
  if (!tokens?.accessToken) return false
  return true
}
