import figures from 'figures'
import { homedir } from 'os'
import * as React from 'react'
import { Box, Text } from '@anthropic/ink'
import type { Step } from '../../projectOnboardingState.js'
import {
  formatCreditAmount,
  getCachedReferrerReward,
} from '../../services/api/referral.js'
import type { LogOption } from '../../types/logs.js'
import { getCwd } from '../../utils/cwd.js'
import { formatRelativeTimeAgo } from '../../utils/format.js'
import { t } from '../../utils/language.js'
import type { FeedConfig, FeedLine } from './Feed.js'

export function createRecentActivityFeed(activities: LogOption[]): FeedConfig {
  const lines: FeedLine[] = activities.map(log => {
    const time = formatRelativeTimeAgo(log.modified)
    const description =
      log.summary && log.summary !== 'No prompt' ? log.summary : log.firstPrompt

    return {
      text: description || '',
      timestamp: time,
    }
  })

  return {
    title: t('feed.recentActivity.title'),
    lines,
    footer: lines.length > 0 ? '/resume for more' : undefined,
    emptyMessage: t('feed.recentActivity.empty'),
  }
}

export function createWhatsNewFeed(releaseNotes: string[]): FeedConfig {
  const lines: FeedLine[] = releaseNotes.map(note => {
    if (process.env.USER_TYPE === 'ant') {
      const match = note.match(/^(\d+\s+\w+\s+ago)\s+(.+)$/)
      if (match) {
        return {
          timestamp: match[1],
          text: match[2] || '',
        }
      }
    }
    return {
      text: note,
    }
  })

  const emptyMessage =
    process.env.USER_TYPE === 'ant'
      ? 'Unable to fetch latest claude-cli-internal commits'
      : t('feed.whatsNew.empty')

  return {
    title:
      process.env.USER_TYPE === 'ant'
        ? "What's new [ANT-ONLY: Latest CC commits]"
        : t('feed.whatsNew.title'),
    lines,
    footer: lines.length > 0 ? '/release-notes for more' : undefined,
    emptyMessage,
  }
}

export function createProjectOnboardingFeed(steps: Step[]): FeedConfig {
  const enabledSteps = steps
    .filter(({ isEnabled }) => isEnabled)
    .sort((a, b) => Number(a.isComplete) - Number(b.isComplete))

  const lines: FeedLine[] = enabledSteps.map(({ text, isComplete }) => {
    const checkmark = isComplete ? `${figures.tick} ` : ''
    return {
      text: `${checkmark}${text}`,
    }
  })

  if (getCwd() === homedir()) {
    lines.push({ text: t('feed.homeDir.warning') })
  }

  return {
    title: t('feed.gettingStarted.title'),
    lines,
  }
}

export function createGuestPassesFeed(): FeedConfig {
  const reward = getCachedReferrerReward()
  const subtitle = reward
    ? `Share Claude Code and earn ${formatCreditAmount(reward)} of extra usage`
    : 'Share Claude Code with friends'
  return {
    title: '3 guest passes',
    lines: [],
    customContent: {
      content: (
        <>
          <Box marginY={1}>
            <Text color="claude">[✻] [✻] [✻]</Text>
          </Box>
          <Text dimColor>{subtitle}</Text>
        </>
      ),
      width: 48,
    },
    footer: '/passes',
  }
}
