import * as React from 'react'
import { Text } from '@anthropic/ink'
import { t } from '../utils/language.js'

export function PressEnterToContinue(): React.ReactNode {
  return (
    <Text color="permission">
      {t('press.enter.pre')}<Text bold>{t('press.enter.key')}</Text>{t('press.enter.continue')}
    </Text>
  )
}
