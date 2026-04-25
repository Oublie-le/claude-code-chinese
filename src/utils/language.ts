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
