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
import { getResolvedLanguage } from '../utils/language.js'
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
  const lang = getResolvedLanguage()

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

  // Define all onboarding steps
  const themeStep = (
    <Box marginX={1}>
      <ThemePicker
        onThemeSelect={handleThemeSelection}
        showIntroText={true}
        helpText={lang === 'zh' ? '稍后可通过 /theme 更改' : 'To change this later, run /theme'}
        hideEscToCancel={true}
        skipExitHandling={true}
      />
    </Box>
  )

  const securityStep = (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text bold>{lang === 'zh' ? '安全提示：' : 'Security notes:'}</Text>
      <Box flexDirection="column" width={70}>
        <OrderedList>
          <OrderedList.Item>
            <Text>{lang === 'zh' ? 'Claude 可能会犯错' : 'Claude can make mistakes'}</Text>
            <Text dimColor wrap="wrap">
              {lang === 'zh' ? (
                <>请务必检查 Claude 的回复，尤其是在执行代码时。<Newline /></>
              ) : (
                <>
                  You should always review Claude&apos;s responses, especially when
                  <Newline />
                  running code.
                  <Newline />
                </>
              )}
            </Text>
          </OrderedList.Item>
          <OrderedList.Item>
            <Text>
              {lang === 'zh'
                ? '存在提示注入风险，请仅在信任的代码上使用'
                : 'Due to prompt injection risks, only use it with code you trust'}
            </Text>
            <Text dimColor wrap="wrap">
              {lang === 'zh' ? '详情请见：' : 'For more details see:'}
              <Newline />
              <Link url="https://code.claude.com/docs/en/security" />
            </Text>
          </OrderedList.Item>
        </OrderedList>
      </Box>
      <PressEnterToContinue />
    </Box>
  )

  const preflightStep = <PreflightStep onSuccess={goToNextStep} />
  // Create the steps array - determine which steps to include based on reAuth and oauthEnabled
  const apiKeyNeedingApproval = useMemo(() => {
    // Add API key step if needed
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
  // Preflight check disabled — users may use third-party API providers
  // if (oauthEnabled) {
  //   steps.push({ id: 'preflight', component: preflightStep })
  // }
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
    steps.push({
      id: 'terminal-setup',
      component: (
        <Box flexDirection="column" gap={1} paddingLeft={1}>
          <Text bold>{lang === 'zh' ? '使用 Claude Code 的终端设置？' : "Use Claude Code's terminal setup?"}</Text>
          <Box flexDirection="column" width={70} gap={1}>
            <Text>
              {lang === 'zh' ? (
                <>
                  为获得最佳编码体验，请为您的终端启用推荐设置：
                  <Newline />
                  {env.terminal === 'Apple_Terminal'
                    ? 'Option+Enter 换行及视觉响铃'
                    : 'Shift+Enter 换行'}
                </>
              ) : (
                <>
                  For the optimal coding experience, enable the recommended settings
                  <Newline />
                  for your terminal:{' '}
                  {env.terminal === 'Apple_Terminal'
                    ? 'Option+Enter for newlines and visual bell'
                    : 'Shift+Enter for newlines'}
                </>
              )}
            </Text>
            <Select
              options={[
                {
                  label: lang === 'zh' ? '是，使用推荐设置' : 'Yes, use recommended settings',
                  value: 'install',
                },
                {
                  label: lang === 'zh' ? '否，稍后通过 /terminal-setup 设置' : 'No, maybe later with /terminal-setup',
                  value: 'no',
                },
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
              {exitState.pending ? (
                <>{lang === 'zh' ? `再按 ${exitState.keyName} 退出` : `Press ${exitState.keyName} again to exit`}</>
              ) : (
                <>{lang === 'zh' ? 'Enter 确认 · Esc 跳过' : 'Enter to confirm · Esc to skip'}</>
              )}
            </Text>
          </Box>
        </Box>
      ),
    })
  }

  const currentStep = steps[currentStepIndex]

  // Handle Enter on security step and Escape on terminal-setup step
  // Dependencies match what goToNextStep uses internally
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
    {
      'confirm:yes': handleSecurityContinue,
    },
    {
      context: 'Confirmation',
      isActive: currentStep?.id === 'security',
    },
  )

  useKeybindings(
    {
      'confirm:no': handleTerminalSetupSkip,
    },
    {
      context: 'Confirmation',
      isActive: currentStep?.id === 'terminal-setup',
    },
  )

  return (
    <Box flexDirection="column">
      <WelcomeV2 />
      <Box flexDirection="column" marginTop={1}>
        {currentStep?.component}
        {exitState.pending && (
          <Box padding={1}>
            <Text dimColor>{lang === 'zh' ? `再按 ${exitState.keyName} 退出` : `Press ${exitState.keyName} again to exit`}</Text>
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
