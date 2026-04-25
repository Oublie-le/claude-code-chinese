import { getGlobalConfig } from './config.js'
import { getSystemLocaleLanguage } from './intl.js'

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: 'Auto (follow system)' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
] as const

export type PreferredLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']
export type ResolvedLanguage = 'en' | 'zh'

/**
 * Resolve the effective display language.
 * Priority: GlobalConfig.preferredLanguage → system locale → default 'en'.
 */
export function getResolvedLanguage(): ResolvedLanguage {
  const pref = getGlobalConfig().preferredLanguage ?? 'auto'
  if (pref === 'en' || pref === 'zh') return pref
  const sysLang = getSystemLocaleLanguage()
  return sysLang === 'zh' ? 'zh' : 'en'
}

export function getLanguageDisplayName(lang: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === lang)?.label ?? lang
}

// ---------------------------------------------------------------------------
// UI translation strings
// Each key maps to a record of ResolvedLanguage → string.
// To add a new language: add its code to SUPPORTED_LANGUAGES + ResolvedLanguage,
// then fill in the translations below.
// ---------------------------------------------------------------------------

const UI_STRINGS = {
  // WelcomeV2
  'welcome.title': {
    en: 'Welcome to Claude Code',
    zh: '欢迎使用 Claude Code',
  },
  // logoV2Utils
  'welcome.back': {
    en: 'Welcome back!',
    zh: '欢迎回来！',
  },
  'welcome.back.user': {
    en: 'Welcome back {username}!',
    zh: '欢迎回来 {username}！',
  },
  'billing.api': {
    en: 'API Usage Billing',
    zh: 'API 用量计费',
  },
  // feedConfigs
  'feed.recentActivity.title': {
    en: 'Recent activity',
    zh: '最近活动',
  },
  'feed.recentActivity.empty': {
    en: 'No recent activity',
    zh: '暂无最近活动',
  },
  'feed.whatsNew.title': {
    en: "What's new",
    zh: '最新动态',
  },
  'feed.whatsNew.empty': {
    en: 'Check the Claude Code changelog for updates',
    zh: '查看 Claude Code 更新日志',
  },
  'feed.gettingStarted.title': {
    en: 'Tips for getting started',
    zh: '入门提示',
  },
  'feed.homeDir.warning': {
    en: 'Note: You have launched claude in your home directory. For the best experience, launch it in a project directory instead.',
    zh: '提示：您在主目录下启动了 Claude。为获得最佳体验，请在项目目录下启动。',
  },
  // Opus1mMergeNotice
  'opus1m.notice': {
    en: 'Opus now defaults to 1M context · 5x more room, same pricing',
    zh: 'Opus 现在默认使用 1M 上下文 · 空间扩大 5 倍，价格不变',
  },
  // Onboarding
  'onboarding.theme.help': {
    en: 'To change this later, run /theme',
    zh: '稍后可通过 /theme 更改',
  },
  'onboarding.security.title': {
    en: 'Security notes:',
    zh: '安全提示：',
  },
  'onboarding.security.item1.title': {
    en: 'Claude can make mistakes',
    zh: 'Claude 可能会犯错',
  },
  'onboarding.security.item1.body': {
    en: "You should always review Claude's responses, especially when\nrunning code.",
    zh: '请务必检查 Claude 的回复，尤其是在执行代码时。',
  },
  'onboarding.security.item2.title': {
    en: 'Due to prompt injection risks, only use it with code you trust',
    zh: '存在提示注入风险，请仅在信任的代码上使用',
  },
  'onboarding.security.item2.body': {
    en: 'For more details see:',
    zh: '详情请见：',
  },
  'onboarding.terminal.title': {
    en: "Use Claude Code's terminal setup?",
    zh: '使用 Claude Code 的终端设置？',
  },
  'onboarding.terminal.body.iterm': {
    en: 'For the optimal coding experience, enable the recommended settings\nfor your terminal: Option+Enter for newlines and visual bell',
    zh: '为获得最佳编码体验，请为您的终端启用推荐设置：\nOption+Enter 换行及视觉响铃',
  },
  'onboarding.terminal.body.other': {
    en: 'For the optimal coding experience, enable the recommended settings\nfor your terminal: Shift+Enter for newlines',
    zh: '为获得最佳编码体验，请为您的终端启用推荐设置：\nShift+Enter 换行',
  },
  'onboarding.terminal.yes': {
    en: 'Yes, use recommended settings',
    zh: '是，使用推荐设置',
  },
  'onboarding.terminal.no': {
    en: 'No, maybe later with /terminal-setup',
    zh: '否，稍后通过 /terminal-setup 设置',
  },
  'onboarding.terminal.hint': {
    en: 'Enter to confirm · Esc to skip',
    zh: 'Enter 确认 · Esc 跳过',
  },
  'exit.pressAgain': {
    en: 'Press {key} again to exit',
    zh: '再按 {key} 退出',
  },
  // exampleCommands
  'example.try': {
    en: 'Try "{cmd}"',
    zh: '试试"{cmd}"',
  },
} as const satisfies Record<string, Record<ResolvedLanguage, string>>

export type TranslationKey = keyof typeof UI_STRINGS

/**
 * Translate a UI string key to the current display language.
 * Supports {placeholder} substitution via the `vars` argument.
 */
export function t(key: TranslationKey, vars?: Record<string, string>): string {
  const lang = getResolvedLanguage()
  let str: string = UI_STRINGS[key][lang]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v)
    }
  }
  return str
}
