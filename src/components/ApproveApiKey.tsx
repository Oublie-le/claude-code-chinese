import React from 'react'
import { Text, Dialog } from '@anthropic/ink'
import { saveGlobalConfig } from '../utils/config.js'
import { Select } from './CustomSelect/index.js'
import { t } from '../utils/language.js'

type Props = {
  customApiKeyTruncated: string
  onDone(approved: boolean): void
}

export function ApproveApiKey({
  customApiKeyTruncated,
  onDone,
}: Props): React.ReactNode {
  function onChange(value: 'yes' | 'no') {
    switch (value) {
      case 'yes': {
        saveGlobalConfig(current => ({
          ...current,
          customApiKeyResponses: {
            ...current.customApiKeyResponses,
            approved: [
              ...(current.customApiKeyResponses?.approved ?? []),
              customApiKeyTruncated,
            ],
          },
        }))
        onDone(true)
        break
      }
      case 'no': {
        saveGlobalConfig(current => ({
          ...current,
          customApiKeyResponses: {
            ...current.customApiKeyResponses,
            rejected: [
              ...(current.customApiKeyResponses?.rejected ?? []),
              customApiKeyTruncated,
            ],
          },
        }))
        onDone(false)
        break
      }
    }
  }

  return (
    <Dialog
      title={t('apikey.detected.title')}
      color="warning"
      onCancel={() => onChange('no')}
    >
      <Text>
        <Text bold>ANTHROPIC_API_KEY</Text>
        <Text>: sk-ant-...{customApiKeyTruncated}</Text>
      </Text>
      <Text>{t('apikey.use')}</Text>
      <Select
        defaultValue="no"
        defaultFocusValue="no"
        options={[
          { label: t('apikey.yes'), value: 'yes' },
          {
            label: (
              <Text>
                {t('apikey.no.recommended')}
              </Text>
            ),
            value: 'no',
          },
        ]}
        onChange={value => onChange(value as 'yes' | 'no')}
        onCancel={() => onChange('no')}
      />
    </Dialog>
  )
}
