import React from 'react'
import { envDynamic } from 'src/utils/envDynamic.js'
import { Box, Text } from '@anthropic/ink'
import { useKeybindings } from '../keybindings/useKeybinding.js'
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
import { env } from '../utils/env.js'
import {
  getTerminalIdeType,
  type IDEExtensionInstallationStatus,
  isJetBrainsIde,
  toIDEDisplayName,
} from '../utils/ide.js'
import { Dialog } from '@anthropic/ink'
import { t } from '../utils/language.js'

interface Props {
  onDone: () => void
  installationStatus: IDEExtensionInstallationStatus | null
}

export function IdeOnboardingDialog({
  onDone,
  installationStatus,
}: Props): React.ReactNode {
  markDialogAsShown()

  // Handle Enter/Escape to dismiss
  useKeybindings(
    {
      'confirm:yes': onDone,
      'confirm:no': onDone,
    },
    { context: 'Confirmation' },
  )

  const ideType = installationStatus?.ideType ?? getTerminalIdeType()
  const isJetBrains = isJetBrainsIde(ideType)

  const ideName = toIDEDisplayName(ideType)
  const installedVersion = installationStatus?.installedVersion
  const pluginOrExtension = isJetBrains ? 'plugin' : 'extension'
  const mentionShortcut =
    env.platform === 'darwin' ? 'Cmd+Option+K' : 'Ctrl+Alt+K'

  return (
    <>
      <Dialog
        title={
          <>
            <Text color="claude">✻ </Text>
            <Text>{t('ide.onboarding.title', { ideName })}</Text>
          </>
        }
        subtitle={
          installedVersion
            ? t('ide.onboarding.installed', { pluginOrExtension, version: installedVersion })
            : undefined
        }
        color="ide"
        onCancel={onDone}
        hideInputGuide
      >
        <Box flexDirection="column" gap={1}>
          <Text>
            {t('ide.onboarding.context')} <Text color="suggestion">{t('ide.onboarding.openFiles')}</Text>{' '}
            and <Text color="suggestion">{t('ide.onboarding.selectedLines')}</Text>
          </Text>
          <Text>
            {t('ide.onboarding.reviewChanges')}{' '}
            <Text color="diffAddedWord">+11</Text>{' '}
            <Text color="diffRemovedWord">-22</Text> {t('ide.onboarding.reviewChanges.suffix')}
          </Text>
          <Text>
            • {t('ide.onboarding.quickLaunch')}<Text dimColor>{t('ide.onboarding.quickLaunch.hint')}</Text>
          </Text>
          <Text>
            • {mentionShortcut}
            <Text dimColor>{t('ide.onboarding.mention.hint')}</Text>
          </Text>
        </Box>
      </Dialog>
      <Box paddingX={1}>
        <Text dimColor italic>
          {t('ide.onboarding.pressEnter')}
        </Text>
      </Box>
    </>
  )
}

export function hasIdeOnboardingDialogBeenShown(): boolean {
  const config = getGlobalConfig()
  const terminal = envDynamic.terminal || 'unknown'
  return config.hasIdeOnboardingBeenShown?.[terminal] === true
}

function markDialogAsShown(): void {
  if (hasIdeOnboardingDialogBeenShown()) {
    return
  }
  const terminal = envDynamic.terminal || 'unknown'
  saveGlobalConfig(current => ({
    ...current,
    hasIdeOnboardingBeenShown: {
      ...current.hasIdeOnboardingBeenShown,
      [terminal]: true,
    },
  }))
}
