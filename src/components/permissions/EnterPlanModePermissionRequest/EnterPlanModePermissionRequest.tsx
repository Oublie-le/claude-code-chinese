import React from 'react'
import { handlePlanModeTransition } from '../../../bootstrap/state.js'
import { Box, Text } from '@anthropic/ink'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../../services/analytics/index.js'
import { useAppState } from '../../../state/AppState.js'
import { isPlanModeInterviewPhaseEnabled } from '../../../utils/planModeV2.js'
import { t } from '../../../utils/language.js'
import { Select } from '../../CustomSelect/index.js'
import { PermissionDialog } from '../PermissionDialog.js'
import type { PermissionRequestProps } from '../PermissionRequest.js'

export function EnterPlanModePermissionRequest({
  toolUseConfirm,
  onDone,
  onReject,
  workerBadge,
}: PermissionRequestProps): React.ReactNode {
  const toolPermissionContextMode = useAppState(
    s => s.toolPermissionContext.mode,
  )

  function handleResponse(value: 'yes' | 'no'): void {
    if (value === 'yes') {
      logEvent('tengu_plan_enter', {
        interviewPhaseEnabled: isPlanModeInterviewPhaseEnabled(),
        entryMethod:
          'tool' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      handlePlanModeTransition(toolPermissionContextMode, 'plan')
      onDone()
      toolUseConfirm.onAllow({}, [
        { type: 'setMode', mode: 'plan', destination: 'session' },
      ])
    } else {
      onDone()
      onReject()
      toolUseConfirm.onReject()
    }
  }

  return (
    <PermissionDialog
      color="planMode"
      title={t('enterPlan.title')}
      workerBadge={workerBadge}
    >
      <Box flexDirection="column" marginTop={1} paddingX={1}>
        <Text>
          {t('enterPlan.wantsToEnter')}
        </Text>

        <Box marginTop={1} flexDirection="column">
          <Text dimColor>{t('enterPlan.inPlanMode')}</Text>
          <Text dimColor>{t('enterPlan.explore')}</Text>
          <Text dimColor>{t('enterPlan.patterns')}</Text>
          <Text dimColor>{t('enterPlan.design')}</Text>
          <Text dimColor>{t('enterPlan.present')}</Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            {t('enterPlan.noChanges')}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Select
            options={[
              { label: t('enterPlan.yes'), value: 'yes' as const },
              { label: t('enterPlan.no'), value: 'no' as const },
            ]}
            onChange={handleResponse}
            onCancel={() => handleResponse('no')}
          />
        </Box>
      </Box>
    </PermissionDialog>
  )
}
