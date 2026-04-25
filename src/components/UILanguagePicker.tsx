import React from 'react'
import { Box, Text } from '@anthropic/ink'
import { Select } from './CustomSelect/index.js'
import {
  type PreferredLanguage,
  SUPPORTED_LANGUAGES,
} from '../utils/language.js'

type Props = {
  currentLanguage: PreferredLanguage
  onComplete: (language: PreferredLanguage) => void
  onCancel: () => void
}

export function UILanguagePicker({
  currentLanguage,
  onComplete,
  onCancel,
}: Props): React.ReactNode {
  const options = SUPPORTED_LANGUAGES.map(l => ({
    label: l.label,
    value: l.code as PreferredLanguage,
  }))

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Select UI display language:</Text>
      <Select
        options={options}
        defaultValue={currentLanguage}
        onChange={onComplete}
        onCancel={onCancel}
        hideIndexes={true}
        visibleOptionCount={SUPPORTED_LANGUAGES.length}
      />
    </Box>
  )
}
