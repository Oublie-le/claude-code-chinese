import { basename } from 'path'
import * as React from 'react'
import { useIdeConnectionStatus } from '../hooks/useIdeConnectionStatus.js'
import type { IDESelection } from '../hooks/useIdeSelection.js'
import { Text } from '@anthropic/ink'
import type { MCPServerConnection } from '../services/mcp/types.js'
import { t } from '../utils/language.js'

type IdeStatusIndicatorProps = {
  ideSelection: IDESelection | undefined
  mcpClients?: MCPServerConnection[]
}

export function IdeStatusIndicator({
  ideSelection,
  mcpClients,
}: IdeStatusIndicatorProps): React.ReactNode {
  const { status: ideStatus } = useIdeConnectionStatus(mcpClients)

  // Check if we should show the IDE selection indicator
  const shouldShowIdeSelection =
    ideStatus === 'connected' &&
    (ideSelection?.filePath ||
      (ideSelection?.text && ideSelection.lineCount > 0))

  if (ideStatus === null || !shouldShowIdeSelection || !ideSelection) {
    return null
  }

  if (ideSelection.text && ideSelection.lineCount > 0) {
    return (
      <Text color="ide" key="selection-indicator" wrap="truncate">
        ⧉ {ideSelection.lineCount}{' '}
        {ideSelection.lineCount === 1 ? t('ide.status.line') : t('ide.status.lines')} selected
      </Text>
    )
  }

  if (ideSelection.filePath) {
    return (
      <Text color="ide" key="selection-indicator" wrap="truncate">
        {t('ide.status.inFile', { filename: basename(ideSelection.filePath) })}
      </Text>
    )
  }
}
