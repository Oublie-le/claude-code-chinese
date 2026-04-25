import * as React from 'react'
import { useExitOnCtrlCDWithKeybindings } from 'src/hooks/useExitOnCtrlCDWithKeybindings.js'
import { useShortcutDisplay } from 'src/keybindings/useShortcutDisplay.js'
import {
  builtInCommandNames,
  type Command,
  type CommandResultDisplay,
  INTERNAL_ONLY_COMMANDS,
} from '../../commands.js'
import { useIsInsideModal } from '../../context/modalContext.js'
import { useTerminalSize } from '../../hooks/useTerminalSize.js'
import { Box, Link, Text, Tab, Tabs, Pane } from '@anthropic/ink'
import { useKeybinding } from '../../keybindings/useKeybinding.js'
import { t } from '../../utils/language.js'
import { Commands } from './Commands.js'
import { General } from './General.js'

type Props = {
  onClose: (
    result?: string,
    options?: { display?: CommandResultDisplay },
  ) => void
  commands: Command[]
}

export function HelpV2({ onClose, commands }: Props): React.ReactNode {
  const { rows, columns } = useTerminalSize()
  const maxHeight = Math.floor(rows / 2)
  // Inside the modal slot, FullscreenLayout already caps height and Pane/Tabs
  // use flexShrink=0 (see #23592) — our own height= constraint would clip the
  // footer since Tabs won't shrink to fit. Let the modal slot handle sizing.
  const insideModal = useIsInsideModal()

  const close = () => onClose('Help dialog dismissed', { display: 'system' })
  useKeybinding('help:dismiss', close, { context: 'Help' })
  const exitState = useExitOnCtrlCDWithKeybindings(close)
  const dismissShortcut = useShortcutDisplay('help:dismiss', 'Help', 'esc')

  const builtinNames = builtInCommandNames()
  let builtinCommands = commands.filter(
    cmd => builtinNames.has(cmd.name) && !cmd.isHidden,
  )
  let antOnlyCommands: Command[] = []

  // We have to do this in an `if` to help treeshaking
  if (process.env.USER_TYPE === 'ant') {
    const internalOnlyNames = new Set(INTERNAL_ONLY_COMMANDS.map(_ => _.name))
    builtinCommands = builtinCommands.filter(
      cmd => !internalOnlyNames.has(cmd.name),
    )
    antOnlyCommands = commands.filter(
      cmd => internalOnlyNames.has(cmd.name) && !cmd.isHidden,
    )
  }

  const customCommands = commands.filter(
    cmd => !builtinNames.has(cmd.name) && !cmd.isHidden,
  )

  const tabs = [
    <Tab key="general" title="general">
      <General />
    </Tab>,
  ]

  tabs.push(
    <Tab key="commands" title="commands">
      <Commands
        commands={builtinCommands}
        maxHeight={maxHeight}
        columns={columns}
        title={t('help.commands.browse')}
        onCancel={close}
      />
    </Tab>,
  )

  tabs.push(
    <Tab key="custom" title="custom-commands">
      <Commands
        commands={customCommands}
        maxHeight={maxHeight}
        columns={columns}
        title={t('help.custom.browse')}
        emptyMessage={t('help.custom.empty')}
        onCancel={close}
      />
    </Tab>,
  )

  if (process.env.USER_TYPE === 'ant' && antOnlyCommands.length > 0) {
    tabs.push(
      <Tab key="ant-only" title="[ant-only]">
        <Commands
          commands={antOnlyCommands}
          maxHeight={maxHeight}
          columns={columns}
          title={t('help.antonly.browse')}
          onCancel={close}
        />
      </Tab>,
    )
  }

  return (
    <Box flexDirection="column" height={insideModal ? undefined : maxHeight}>
      <Pane color="professionalBlue">
        <Tabs
          title={
            process.env.USER_TYPE === 'ant'
              ? '/help'
              : `Claude Code v${MACRO.VERSION}`
          }
          color="professionalBlue"
          defaultTab="general"
        >
          {tabs}
        </Tabs>
        <Box marginTop={1}>
          <Text>
            {t('help.morehelp')}
            <Link url="https://code.claude.com/docs/en/overview" />
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            {exitState.pending ? (
              <>{t('help.exitAgain', { key: exitState.keyName ?? '' })}</>
            ) : (
              <Text italic>{t('help.dismiss', { shortcut: dismissShortcut })}</Text>
            )}
          </Text>
        </Box>
      </Pane>
    </Box>
  )
}
