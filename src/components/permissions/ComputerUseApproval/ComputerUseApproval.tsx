import { getSentinelCategory } from '@ant/computer-use-mcp/sentinelApps'
import type {
  CuPermissionRequest,
  CuPermissionResponse,
} from '@ant/computer-use-mcp/types'
import { DEFAULT_GRANT_FLAGS } from '@ant/computer-use-mcp/types'
import figures from 'figures'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { Box, Text } from '@anthropic/ink'
import { execFileNoThrow } from '../../../utils/execFileNoThrow.js'
import { plural } from '../../../utils/stringUtils.js'
import { t } from '../../../utils/language.js'
import type { OptionWithDescription } from '../../CustomSelect/select.js'
import { Select } from '../../CustomSelect/select.js'
import { Dialog } from '@anthropic/ink'

type ComputerUseApprovalProps = {
  request: CuPermissionRequest
  onDone: (response: CuPermissionResponse) => void
}

const DENY_ALL_RESPONSE: CuPermissionResponse = {
  granted: [],
  denied: [],
  flags: DEFAULT_GRANT_FLAGS,
}

/**
 * Two-panel dispatcher. When `request.tccState` is present, macOS permissions
 * (Accessibility / Screen Recording) are missing and the app list is
 * irrelevant — show a TCC panel that opens System Settings. Otherwise show the
 * app allowlist + grant-flags panel.
 */
export function ComputerUseApproval({
  request,
  onDone,
}: ComputerUseApprovalProps): React.ReactNode {
  return request.tccState ? (
    <ComputerUseTccPanel
      tccState={request.tccState}
      onDone={() => onDone(DENY_ALL_RESPONSE)}
    />
  ) : (
    <ComputerUseAppListPanel request={request} onDone={onDone} />
  )
}

// ── TCC panel ─────────────────────────────────────────────────────────────

type TccOption = 'open_accessibility' | 'open_screen_recording' | 'retry'

function ComputerUseTccPanel({
  tccState,
  onDone,
}: {
  tccState: NonNullable<CuPermissionRequest['tccState']>
  onDone: () => void
}): React.ReactNode {
  const options = useMemo<OptionWithDescription<TccOption>[]>(() => {
    const opts: OptionWithDescription<TccOption>[] = []
    if (!tccState.accessibility) {
      opts.push({
        label: t('computerUse.openAccessibility'),
        value: 'open_accessibility',
      })
    }
    if (!tccState.screenRecording) {
      opts.push({
        label: t('computerUse.openScreenRecording'),
        value: 'open_screen_recording',
      })
    }
    opts.push({ label: t('computerUse.tryAgain'), value: 'retry' })
    return opts
  }, [tccState.accessibility, tccState.screenRecording])

  function onChange(value: TccOption): void {
    switch (value) {
      case 'open_accessibility':
        void execFileNoThrow(
          'open',
          [
            'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
          ],
          { useCwd: false },
        )
        return
      case 'open_screen_recording':
        void execFileNoThrow(
          'open',
          [
            'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
          ],
          { useCwd: false },
        )
        return
      case 'retry':
        // Resolve with deny-all — the model re-calls request_access, which
        // re-checks TCC and renders the app list if now granted.
        onDone()
        return
    }
  }

  return (
    <Dialog title={t('computerUse.tccTitle')} onCancel={onDone}>
      <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
        <Box flexDirection="column">
          <Text>
            {t('computerUse.accessibility')}:{' '}
            {tccState.accessibility
              ? `${figures.tick} ${t('computerUse.granted')}`
              : `${figures.cross} ${t('computerUse.notGranted')}`}
          </Text>
          <Text>
            {t('computerUse.screenRecording')}:{' '}
            {tccState.screenRecording
              ? `${figures.tick} ${t('computerUse.granted')}`
              : `${figures.cross} ${t('computerUse.notGranted')}`}
          </Text>
        </Box>
        <Text dimColor>
          {t('computerUse.tccInstructions')}
        </Text>
        <Select options={options} onChange={onChange} onCancel={onDone} />
      </Box>
    </Dialog>
  )
}

// ── App allowlist panel ───────────────────────────────────────────────────

type AppListOption = 'allow_all' | 'deny'

const SENTINEL_WARNING: Record<
  NonNullable<ReturnType<typeof getSentinelCategory>>,
  string
> = {
  shell: 'equivalent to shell access',
  filesystem: 'can read/write any file',
  system_settings: 'can change system settings',
}

function ComputerUseAppListPanel({
  request,
  onDone,
}: ComputerUseApprovalProps): React.ReactNode {
  // Pre-check every resolved, not-yet-granted app. Sentinels stay checked
  // too — the warning text is the signal, not an unchecked box.
  // Per-item toggles are a follow-up; for now every resolved app is granted
  // when the user accepts. `setChecked` is unused until then.
  const [checked] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        request.apps.flatMap(a =>
          a.resolved && !a.alreadyGranted ? [a.resolved.bundleId] : [],
        ),
      ),
  )

  type FlagKey = keyof typeof DEFAULT_GRANT_FLAGS
  const ALL_FLAG_KEYS: FlagKey[] = [
    'clipboardRead',
    'clipboardWrite',
    'systemKeyCombos',
  ]
  const requestedFlagKeys = useMemo(
    (): FlagKey[] => ALL_FLAG_KEYS.filter(k => request.requestedFlags[k]),
    [request.requestedFlags],
  )

  const options = useMemo<OptionWithDescription<AppListOption>[]>(
    () => [
      {
        label: `Allow for this session (${checked.size} ${plural(checked.size, 'app')})`,
        value: 'allow_all',
      },
      {
        label: (
          <Text>
            {t('computerUse.deny')} <Text bold>(esc)</Text>
          </Text>
        ),
        value: 'deny',
      },
    ],
    [checked.size],
  )

  function respond(allow: boolean): void {
    if (!allow) {
      onDone(DENY_ALL_RESPONSE)
      return
    }
    const now = Date.now()
    const granted = request.apps.flatMap(a =>
      a.resolved && checked.has(a.resolved.bundleId)
        ? [
            {
              bundleId: a.resolved.bundleId,
              displayName: a.resolved.displayName,
              grantedAt: now,
            },
          ]
        : [],
    )
    const denied = request.apps
      .filter(a => !a.resolved || !checked.has(a.resolved.bundleId))
      .map(a => ({
        bundleId: a.resolved?.bundleId ?? a.requestedName,
        reason: a.resolved
          ? ('user_denied' as const)
          : ('not_installed' as const),
      }))
    // Grant all requested flags on allow — per-flag toggles are a follow-up.
    const flags = {
      ...DEFAULT_GRANT_FLAGS,
      ...Object.fromEntries(requestedFlagKeys.map(k => [k, true] as const)),
    }
    onDone({ granted, denied, flags })
  }

  return (
    <Dialog
      title={t('computerUse.appTitle')}
      onCancel={() => respond(false)}
    >
      <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
        {request.reason ? <Text dimColor>{request.reason}</Text> : null}

        <Box flexDirection="column">
          {request.apps.map(a => {
            const resolved = a.resolved
            if (!resolved) {
              return (
                <Text key={a.requestedName} dimColor>
                  {'  '}
                  {figures.circle} {a.requestedName}{' '}
                  <Text dimColor>({t('computerUse.notInstalled')})</Text>
                </Text>
              )
            }
            if (a.alreadyGranted) {
              return (
                <Text key={resolved.bundleId} dimColor>
                  {'  '}
                  {figures.tick} {resolved.displayName}{' '}
                  <Text dimColor>({t('computerUse.alreadyGranted')})</Text>
                </Text>
              )
            }
            const sentinel = getSentinelCategory(resolved.bundleId)
            const isChecked = checked.has(resolved.bundleId)
            return (
              <Box key={resolved.bundleId} flexDirection="column">
                <Text>
                  {'  '}
                  {isChecked ? figures.circleFilled : figures.circle}{' '}
                  {resolved.displayName}
                </Text>
                {sentinel ? (
                  <Text bold>
                    {'    '}
                    {figures.warning} {SENTINEL_WARNING[sentinel]}
                  </Text>
                ) : null}
              </Box>
            )
          })}
        </Box>

        {requestedFlagKeys.length > 0 ? (
          <Box flexDirection="column">
            <Text dimColor>{t('computerUse.alsoRequested')}</Text>
            {requestedFlagKeys.map(flag => (
              <Text key={flag} dimColor>
                {'  '}· {flag}
              </Text>
            ))}
          </Box>
        ) : null}

        {request.willHide && request.willHide.length > 0 ? (
          <Text dimColor>
            {request.willHide.length} other{' '}
            {plural(request.willHide.length, 'app')} will be hidden while Claude
            works.
          </Text>
        ) : null}

        <Select
          options={options}
          onChange={v => respond(v === 'allow_all')}
          onCancel={() => respond(false)}
        />
      </Box>
    </Dialog>
  )
}
