/**
 * SelectMatcherMode shows the configured matchers for a selected hook event.
 *
 * The /hooks menu is read-only: this view no longer offers "add new matcher"
 * and simply lets the user drill into each matcher to see its hooks.
 */
import * as React from 'react'
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
import { Box, Text } from '@anthropic/ink'
import {
  type HookSource,
  hookSourceInlineDisplayString,
  type IndividualHookConfig,
} from '../../utils/hooks/hooksSettings.js'
import { t } from '../../utils/language.js'
import { plural } from '../../utils/stringUtils.js'
import { Select } from '../CustomSelect/select.js'
import { Dialog } from '@anthropic/ink'

type MatcherWithSource = {
  matcher: string
  sources: HookSource[]
  hookCount: number
}

type Props = {
  selectedEvent: HookEvent
  matchersForSelectedEvent: string[]
  hooksByEventAndMatcher: Record<
    HookEvent,
    Record<string, IndividualHookConfig[]>
  >
  eventDescription: string
  onSelect: (matcher: string) => void
  onCancel: () => void
}

export function SelectMatcherMode({
  selectedEvent,
  matchersForSelectedEvent,
  hooksByEventAndMatcher,
  eventDescription,
  onSelect,
  onCancel,
}: Props): React.ReactNode {
  // Group matchers with their sources (already sorted by priority in parent)
  const matchersWithSources: MatcherWithSource[] = React.useMemo(() => {
    return matchersForSelectedEvent.map(matcher => {
      const hooks = hooksByEventAndMatcher[selectedEvent]?.[matcher] || []
      const sources = Array.from(new Set(hooks.map(h => h.source)))
      return {
        matcher,
        sources,
        hookCount: hooks.length,
      }
    })
  }, [matchersForSelectedEvent, hooksByEventAndMatcher, selectedEvent])

  if (matchersForSelectedEvent.length === 0) {
    return (
      <Dialog
        title={`${selectedEvent}${t('hooks.matcherSuffix')}`}
        subtitle={eventDescription}
        onCancel={onCancel}
        inputGuide={() => <Text>{t('hooks.escToGoBack')}</Text>}
      >
        <Box flexDirection="column" gap={1}>
          <Text dimColor>{t('hooks.noHooksConfigured')}</Text>
          <Text dimColor>
            {t('hooks.addHooksHint')}
          </Text>
        </Box>
      </Dialog>
    )
  }

  return (
    <Dialog
      title={`${selectedEvent}${t('hooks.matcherSuffix')}`}
      subtitle={eventDescription}
      onCancel={onCancel}
    >
      <Box flexDirection="column">
        <Select
          options={matchersWithSources.map(item => {
            const sourceText = item.sources
              .map(hookSourceInlineDisplayString)
              .join(', ')
            const matcherLabel = item.matcher || t('hooks.all')
            return {
              label: `[${sourceText}] ${matcherLabel}`,
              value: item.matcher,
              description: `${item.hookCount} ${plural(item.hookCount, 'hook')}`,
            }
          })}
          onChange={value => {
            onSelect(value)
          }}
          onCancel={onCancel}
        />
      </Box>
    </Dialog>
  )
}
