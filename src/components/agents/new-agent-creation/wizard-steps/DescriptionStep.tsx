import React, { type ReactNode, useCallback, useState } from 'react'
import { Box, Byline, KeyboardShortcutHint, Text } from '@anthropic/ink'
import { useKeybinding } from '../../../../keybindings/useKeybinding.js'
import { editPromptInEditor } from '../../../../utils/promptEditor.js'
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js'
import { t } from '../../../../utils/language.js'
import TextInput from '../../../TextInput.js'
import { useWizard } from '../../../wizard/index.js'
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js'
import type { AgentWizardData } from '../types.js'

export function DescriptionStep(): ReactNode {
  const { goNext, goBack, updateWizardData, wizardData } =
    useWizard<AgentWizardData>()
  const [whenToUse, setWhenToUse] = useState(wizardData.whenToUse || '')
  const [cursorOffset, setCursorOffset] = useState(whenToUse.length)
  const [error, setError] = useState<string | null>(null)

  // Handle escape key - use Settings context so 'n' key doesn't cancel (allows typing 'n' in input)
  useKeybinding('confirm:no', goBack, { context: 'Settings' })

  const handleExternalEditor = useCallback(async () => {
    const result = await editPromptInEditor(whenToUse)
    if (result.content !== null) {
      setWhenToUse(result.content)
      setCursorOffset(result.content.length)
    }
  }, [whenToUse])

  useKeybinding('chat:externalEditor', handleExternalEditor, {
    context: 'Chat',
  })

  const handleSubmit = (value: string): void => {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
      setError(t('wizard.desc.error'))
      return
    }

    setError(null)
    updateWizardData({ whenToUse: trimmedValue })
    goNext()
  }

  return (
    <WizardDialogLayout
      subtitle={t('wizard.desc.subtitle')}
      footerText={
        <Byline>
          <KeyboardShortcutHint shortcut="Type" action="enter text" />
          <KeyboardShortcutHint shortcut="Enter" action="continue" />
          <ConfigurableShortcutHint
            action="chat:externalEditor"
            context="Chat"
            fallback="ctrl+g"
            description="open in editor"
          />
          <ConfigurableShortcutHint
            action="confirm:no"
            context="Settings"
            fallback="Esc"
            description="go back"
          />
        </Byline>
      }
    >
      <Box flexDirection="column">
        <Text>{t('wizard.desc.question')}</Text>

        <Box marginTop={1}>
          <TextInput
            value={whenToUse}
            onChange={setWhenToUse}
            onSubmit={handleSubmit}
            placeholder={t('wizard.desc.placeholder')}
            columns={80}
            cursorOffset={cursorOffset}
            onChangeCursorOffset={setCursorOffset}
            focus
            showCursor
          />
        </Box>

        {error && (
          <Box marginTop={1}>
            <Text color="error">{error}</Text>
          </Box>
        )}
      </Box>
    </WizardDialogLayout>
  )
}
