import * as React from 'react'
import { Box, Text } from '@anthropic/ink'
import { t } from '../../utils/language.js'
import { Select } from '../CustomSelect/select.js'
import { PermissionDialog } from '../permissions/PermissionDialog.js'

type Props = {
  pluginName: string
  pluginDescription?: string
  fileExtension: string
  onResponse: (response: 'yes' | 'no' | 'never' | 'disable') => void
}

const AUTO_DISMISS_MS = 30_000

export function LspRecommendationMenu({
  pluginName,
  pluginDescription,
  fileExtension,
  onResponse,
}: Props): React.ReactNode {
  // Use ref to avoid timer reset when onResponse changes
  const onResponseRef = React.useRef(onResponse)
  onResponseRef.current = onResponse

  // 30-second auto-dismiss timer - counts as ignored (no)
  React.useEffect(() => {
    const timeoutId = setTimeout(
      ref => ref.current('no'),
      AUTO_DISMISS_MS,
      onResponseRef,
    )
    return () => clearTimeout(timeoutId)
  }, [])

  function onSelect(value: string): void {
    switch (value) {
      case 'yes':
        onResponse('yes')
        break
      case 'no':
        onResponse('no')
        break
      case 'never':
        onResponse('never')
        break
      case 'disable':
        onResponse('disable')
        break
    }
  }

  const options = [
    {
      label: (
        <Text>
          {t('lsp.install.yes', { name: pluginName })}
        </Text>
      ),
      value: 'yes',
    },
    {
      label: t('lsp.install.no'),
      value: 'no',
    },
    {
      label: (
        <Text>
          {t('lsp.install.never', { name: pluginName })}
        </Text>
      ),
      value: 'never',
    },
    {
      label: t('lsp.install.disable'),
      value: 'disable',
    },
  ]

  return (
    <PermissionDialog title={t('lsp.title')}>
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text dimColor>
            {t('lsp.description')}
          </Text>
        </Box>
        <Box>
          <Text dimColor>{t('lsp.plugin.label')}</Text>
          <Text> {pluginName}</Text>
        </Box>
        {pluginDescription && (
          <Box>
            <Text dimColor>{pluginDescription}</Text>
          </Box>
        )}
        <Box>
          <Text dimColor>{t('lsp.trigger.label')}</Text>
          <Text> {t('lsp.trigger.files', { ext: fileExtension })}</Text>
        </Box>
        <Box marginTop={1}>
          <Text>{t('lsp.install.ask')}</Text>
        </Box>
        <Box>
          <Select
            options={options}
            onChange={onSelect}
            onCancel={() => onResponse('no')}
          />
        </Box>
      </Box>
    </PermissionDialog>
  )
}
