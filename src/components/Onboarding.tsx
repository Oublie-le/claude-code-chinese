import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
import {
  setupTerminal,
  shouldOfferTerminalSetup,
} from '../commands/terminalSetup/terminalSetup.js'
import { useExitOnCtrlCDWithKeybindings } from '../hooks/useExitOnCtrlCDWithKeybindings.js'
import { Box, Link, Newline, Text, useTheme } from '@anthropic/ink'
import { useKeybindings } from '../keybindings/useKeybinding.js'
import { isAnthropicAuthEnabled } from '../utils/auth.js'
import { normalizeApiKeyForConfig } from '../utils/authPortable.js'
import { getCustomApiKeyStatus } from '../utils/config.js'
import { env } from '../utils/env.js'
import { isRunningOnHomespace } from '../utils/envUtils.js'
import { PreflightStep } from '../utils/preflightChecks.js'
import type { ThemeSetting } from '../utils/theme.js'
import { t } from '../utils/language.js'
import { ApproveApiKey } from './ApproveApiKey.js'
import { ConsoleOAuthFlow } from './ConsoleOAuthFlow.js'
import { Select } from './CustomSelect/select.js'
import { WelcomeV2 } from './LogoV2/WelcomeV2.js'
import { PressEnterToContinue } from './PressEnterToContinue.js'
import { ThemePicker } from './ThemePicker.js'
import { OrderedList } from './ui/OrderedList.js'

type StepId =
  | 'preflight'
  | 'theme'
  | 'oauth'
  | 'api-key'
  | 'security'
  | 'terminal-setup'

interface OnboardingStep {
  id: StepId
  component: React.ReactNode
}

type Props = {
  onDone(): void
}

export function Onboarding({ onDone }: Props): React.ReactNode {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [skipOAuth, setSkipOAuth] = useState(false)
  const [oauthEnabled] = useState(() => isAnthropicAuthEnabled())
  const [theme, setTheme] = useTheme()

  useEffect(() => {
    logEvent('tengu_began_setup', {
      oauthEnabled,
    })
  }, [oauthEnabled])

  function goToNextStep() {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)

      logEvent('tengu_onboarding_step', {
        oauthEnabled,
        stepId: steps[nextIndex]
          ?.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
    } else {
      onDone()
    }
  }

  function handleThemeSelection(newTheme: ThemeSetting) {
    setTheme(newTheme)
    goToNextStep()
  }

  const exitState = useExitOnCtrlCDWithKeybindings()

  const themeStep = (
    <Box marginX={1}>
      <ThemePicker
        onThemeSelect={handleThemeSelection}
        showIntroText={true}
        helpText={t('onboarding.theme.help')}
        hideEscToCancel={true}
        skipExitHandling={true}
      />
    </Box>
  )

  const securityStep = (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text bold>{t('onboarding.security.title')}</Text>
      <Box flexDirection="column" width={70}>
        <OrderedList>
          <OrderedList.Item>
            <Text>{t('onboarding.security.item1.title')}</Text>
            <Text dimColor wrap="wrap">
              {t('onboarding.security.item1.body')}
              <Newline />
            </Text>
          </OrderedList.Item>
          <OrderedList.Item>
            <Text>{t('onboarding.security.item2.title')}</Text>
            <Text dimColor wrap="wrap">
              {t('onboarding.security.item2.body')}
              <Newline />
              <Link url="https://code.claude.com/docs/en/security" />
            </Text>
          </OrderedList.Item>
        </OrderedList>
      </Box>
      <PressEnterToContinue />
    </Box>
  )

  // Preflight check disabled — users may use third-party API providers
  // if (oauthEnabled) {
  //   steps.push({ id: 'preflight', component: <PreflightStep onSuccess={goToNextStep} /> })
  // }
  void PreflightStep

  const apiKeyNeedingApproval = useMemo(() => {
    // On homespace, ANTHROPIC_API_KEY is preserved in process.env for child
    // processes but ignored by Claude Code itself (see auth.ts).
    if (!process.env.ANTHROPIC_API_KEY || isRunningOnHomespace()) {
      return ''
    }
    const customApiKeyTruncated = normalizeApiKeyForConfig(
      process.env.ANTHROPIC_API_KEY,
    )
    if (getCustomApiKeyStatus(customApiKeyTruncated) === 'new') {
      return customApiKeyTruncated
    }
  }, [])

  function handleApiKeyDone(approved: boolean) {
    if (approved) {
      setSkipOAuth(true)
    }
    goToNextStep()
  }

  const steps: OnboardingStep[] = []
  steps.push({ id: 'theme', component: themeStep })

  if (apiKeyNeedingApproval) {
    steps.push({
      id: 'api-key',
      component: (
        <ApproveApiKey
          customApiKeyTruncated={apiKeyNeedingApproval}
          onDone={handleApiKeyDone}
        />
      ),
    })
  }

  if (oauthEnabled) {
    steps.push({
      id: 'oauth',
      component: (
        <SkippableStep skip={skipOAuth} onSkip={goToNextStep}>
          <ConsoleOAuthFlow onDone={goToNextStep} />
        </SkippableStep>
      ),
    })
  }

  steps.push({ id: 'security', component: securityStep })

  if (shouldOfferTerminalSetup()) {
    const terminalBody =
      env.terminal === 'Apple_Terminal'
        ? t('onboarding.terminal.body.iterm')
        : t('onboarding.terminal.body.other')

    steps.push({
      id: 'terminal-setup',
      component: (
        <Box flexDirection="column" gap={1} paddingLeft={1}>
          <Text bold>{t('onboarding.terminal.title')}</Text>
          <Box flexDirection="column" width={70} gap={1}>
            <Text>{terminalBody}</Text>
            <Select
              options={[
                { label: t('onboarding.terminal.yes'), value: 'install' },
                { label: t('onboarding.terminal.no'), value: 'no' },
              ]}
              onChange={value => {
                if (value === 'install') {
                  void setupTerminal(theme)
                    .catch(() => {})
                    .finally(goToNextStep)
                } else {
                  goToNextStep()
                }
              }}
              onCancel={() => goToNextStep()}
            />
            <Text dimColor>
              {exitState.pending
                ? t('exit.pressAgain', { key: exitState.keyName ?? '' })
                : t('onboarding.terminal.hint')}
            </Text>
          </Box>
        </Box>
      ),
    })
  }

  const currentStep = steps[currentStepIndex]

  const handleSecurityContinue = useCallback(() => {
    if (currentStepIndex === steps.length - 1) {
      onDone()
    } else {
      goToNextStep()
    }
  }, [currentStepIndex, steps.length, oauthEnabled, onDone])

  const handleTerminalSetupSkip = useCallback(() => {
    goToNextStep()
  }, [currentStepIndex, steps.length, oauthEnabled, onDone])

  useKeybindings(
    { 'confirm:yes': handleSecurityContinue },
    { context: 'Confirmation', isActive: currentStep?.id === 'security' },
  )

  useKeybindings(
    { 'confirm:no': handleTerminalSetupSkip },
    { context: 'Confirmation', isActive: currentStep?.id === 'terminal-setup' },
  )

  return (
    <Box flexDirection="column">
      <WelcomeV2 />
      <Box flexDirection="column" marginTop={1}>
        {currentStep?.component}
        {exitState.pending && (
          <Box padding={1}>
            <Text dimColor>
              {t('exit.pressAgain', { key: exitState.keyName ?? '' })}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export function SkippableStep({
  skip,
  onSkip,
  children,
}: {
  skip: boolean
  onSkip(): void
  children: React.ReactNode
}): React.ReactNode {
  useEffect(() => {
    if (skip) {
      onSkip()
    }
  }, [skip, onSkip])
  if (skip) {
    return null
  }
  return children
}
