import React, { type ReactNode } from 'react'
import { type KeyboardEvent, Box, Byline, KeyboardShortcutHint, Text } from '@anthropic/ink'
import { useKeybinding } from '../../../../keybindings/useKeybinding.js'
import { isAutoMemoryEnabled } from '../../../../memdir/paths.js'
import type { Tools } from '../../../../Tool.js'
import { getMemoryScopeDisplay } from '@claude-code-best/builtin-tools/tools/AgentTool/agentMemory.js'
import type { AgentDefinition } from '@claude-code-best/builtin-tools/tools/AgentTool/loadAgentsDir.js'
import { truncateToWidth } from '../../../../utils/format.js'
import { getAgentModelDisplay } from '../../../../utils/model/agent.js'
import { t } from '../../../../utils/language.js'
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js'
import { useWizard } from '../../../wizard/index.js'
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js'
import { getNewRelativeAgentFilePath } from '../../agentFileUtils.js'
import { validateAgent } from '../../validateAgent.js'
import type { AgentWizardData } from '../types.js'

type Props = {
  tools: Tools
  existingAgents: AgentDefinition[]
  onSave: () => void
  onSaveAndEdit: () => void
  error?: string | null
}

export function ConfirmStep({
  tools,
  existingAgents,
  onSave,
  onSaveAndEdit,
  error,
}: Props): ReactNode {
  const { goBack, wizardData } = useWizard<AgentWizardData>()

  useKeybinding('confirm:no', goBack, { context: 'Confirmation' })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 's' || e.key === 'return') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'e') {
      e.preventDefault()
      onSaveAndEdit()
    }
  }

  const agent = wizardData.finalAgent!
  const validation = validateAgent(agent, tools, existingAgents)

  const systemPromptPreview = truncateToWidth(agent.getSystemPrompt(), 240)
  const whenToUsePreview = truncateToWidth(agent.whenToUse, 240)

  const getToolsDisplay = (toolNames: string[] | undefined): string => {
    // undefined means "all tools" per PR semantic
    if (toolNames === undefined) return t('wizard.confirm.allTools')
    if (toolNames.length === 0) return t('wizard.confirm.none')
    if (toolNames.length === 1) return toolNames[0] || t('wizard.confirm.none')
    if (toolNames.length === 2) return toolNames.join(' and ')
    return `${toolNames.slice(0, -1).join(', ')}, and ${toolNames[toolNames.length - 1]}`
  }

  // Compute memory display outside JSX
  const memoryDisplayElement = isAutoMemoryEnabled() ? (
    <Text>
      <Text bold>Memory</Text>: {getMemoryScopeDisplay(agent.memory)}
    </Text>
  ) : null

  return (
    <WizardDialogLayout
      subtitle={t('wizard.confirm.subtitle')}
      footerText={
        <Byline>
          <KeyboardShortcutHint shortcut="s/Enter" action="save" />
          <KeyboardShortcutHint shortcut="e" action="edit in your editor" />
          <ConfigurableShortcutHint
            action="confirm:no"
            context="Confirmation"
            fallback="Esc"
            description="cancel"
          />
        </Byline>
      }
    >
      <Box
        flexDirection="column"
        tabIndex={0}
        autoFocus
        onKeyDown={handleKeyDown}
      >
        <Text>
          <Text bold>{t('wizard.confirm.name')}</Text>: {agent.agentType}
        </Text>
        <Text>
          <Text bold>{t('wizard.confirm.location')}</Text>:{' '}
          {getNewRelativeAgentFilePath({
            source: wizardData.location!,
            agentType: agent.agentType,
          })}
        </Text>
        <Text>
          <Text bold>{t('wizard.confirm.tools')}</Text>: {getToolsDisplay(agent.tools)}
        </Text>
        <Text>
          <Text bold>{t('wizard.confirm.model')}</Text>: {getAgentModelDisplay(agent.model)}
        </Text>
        {memoryDisplayElement}

        <Box marginTop={1}>
          <Text>
            <Text bold>{t('wizard.confirm.description')}</Text> {t('wizard.confirm.descriptionTip')}
          </Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
          <Text>{whenToUsePreview}</Text>
        </Box>

        <Box marginTop={1}>
          <Text>
            <Text bold>{t('wizard.confirm.systemPrompt')}</Text>:
          </Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
          <Text>{systemPromptPreview}</Text>
        </Box>

        {validation.warnings.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text color="warning">{t('wizard.confirm.warnings')}</Text>
            {validation.warnings.map((warning, i) => (
              <Text key={i} dimColor>
                {' '}
                • {warning}
              </Text>
            ))}
          </Box>
        )}

        {validation.errors.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text color="error">{t('wizard.confirm.errors')}</Text>
            {validation.errors.map((err, i) => (
              <Text key={i} color="error">
                {' '}
                • {err}
              </Text>
            ))}
          </Box>
        )}

        {error && (
          <Box marginTop={1}>
            <Text color="error">{error}</Text>
          </Box>
        )}

        <Box marginTop={2}>
          <Text color="success">
            Press <Text bold>s</Text> or <Text bold>Enter</Text> to save,{' '}
            <Text bold>e</Text> to save and edit
          </Text>
        </Box>
      </Box>
    </WizardDialogLayout>
  )
}
