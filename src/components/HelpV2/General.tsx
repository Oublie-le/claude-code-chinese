import * as React from 'react'
import { Box, Text } from '@anthropic/ink'
import { PromptInputHelpMenu } from '../PromptInput/PromptInputHelpMenu.js'
import { t } from '../../utils/language.js'

export function General(): React.ReactNode {
  return (
    <Box flexDirection="column" paddingY={1} gap={1}>
      <Box>
        <Text>
          {t('help.general.description')}
        </Text>
      </Box>
      <Box flexDirection="column">
        <Box>
          <Text bold>{t('help.general.shortcuts')}</Text>
        </Box>
        <PromptInputHelpMenu gap={2} fixedWidth={true} />
      </Box>
    </Box>
  )
}
