import * as React from 'react'
import { Box, Text } from '@anthropic/ink'
import { Select } from '../CustomSelect/select.js'
import { PermissionDialog } from '../permissions/PermissionDialog.js'
import { t } from '../../utils/language.js'

type Props = {
  pluginName: string
  pluginDescription?: string
  marketplaceName: string
  sourceCommand: string
  onResponse: (response: 'yes' | 'no' | 'disable') => void
}

const AUTO_DISMISS_MS = 30_000

export function PluginHintMenu({
  pluginName,
  pluginDescription,
  marketplaceName,
  sourceCommand,
  onResponse,
}: Props): React.ReactNode {
  const onResponseRef = React.useRef(onResponse)
  onResponseRef.current = onResponse

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
      case 'disable':
        onResponse('disable')
        break
      default:
        onResponse('no')
    }
  }

  const options = [
    {
      label: (
        <Text>
          {t('plugin.hint.yes', { name: pluginName })}
        </Text>
      ),
      value: 'yes',
    },
    {
      label: t('plugin.hint.no'),
      value: 'no',
    },
    {
      label: t('plugin.hint.disable'),
      value: 'disable',
    },
  ]

  return (
    <PermissionDialog title={t('plugin.hint.title')}>
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text dimColor>
            {t('plugin.hint.suggest', { cmd: sourceCommand })}
          </Text>
        </Box>
        <Box>
          <Text dimColor>{t('plugin.hint.label')}</Text>
          <Text> {pluginName}</Text>
        </Box>
        <Box>
          <Text dimColor>{t('plugin.hint.marketplace')}</Text>
          <Text> {marketplaceName}</Text>
        </Box>
        {pluginDescription && (
          <Box>
            <Text dimColor>{pluginDescription}</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text>{t('plugin.hint.ask')}</Text>
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
