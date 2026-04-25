import * as React from 'react'
import { useEffect, useState } from 'react'
import { UP_ARROW } from '../../constants/figures.js'
import { Box, Text } from '@anthropic/ink'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import { getResolvedLanguage } from '../../utils/language.js'
import { isOpus1mMergeEnabled } from '../../utils/model/model.js'
import { AnimatedAsterisk } from './AnimatedAsterisk.js'

const MAX_SHOW_COUNT = 6

export function shouldShowOpus1mMergeNotice(): boolean {
  return (
    isOpus1mMergeEnabled() &&
    (getGlobalConfig().opus1mMergeNoticeSeenCount ?? 0) < MAX_SHOW_COUNT
  )
}

export function Opus1mMergeNotice(): React.ReactNode {
  const [show] = useState(shouldShowOpus1mMergeNotice)

  useEffect(() => {
    if (!show) return
    const newCount = (getGlobalConfig().opus1mMergeNoticeSeenCount ?? 0) + 1
    saveGlobalConfig(prev => {
      if ((prev.opus1mMergeNoticeSeenCount ?? 0) >= newCount) return prev
      return { ...prev, opus1mMergeNoticeSeenCount: newCount }
    })
  }, [show])

  if (!show) return null

  return (
    <Box paddingLeft={2}>
      <AnimatedAsterisk char={UP_ARROW} />
      <Text dimColor>
        {' '}
        {getResolvedLanguage() === 'zh'
          ? 'Opus 现在默认使用 1M 上下文 · 空间扩大 5 倍，价格不变'
          : 'Opus now defaults to 1M context · 5x more room, same pricing'}
      </Text>
    </Box>
  )
}
