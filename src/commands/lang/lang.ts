import type { ToolUseContext } from '../../Tool.js'
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import {
  type PreferredLanguage,
  SUPPORTED_LANGUAGES,
  getLanguageDisplayName,
  getResolvedLanguage,
} from '../../utils/language.js'

const VALID_LANGS = SUPPORTED_LANGUAGES.map(l => l.code)

export async function call(
  onDone: LocalJSXCommandOnDone,
  _context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<null> {
  const arg = args.trim().toLowerCase()

  if (!arg) {
    const pref = getGlobalConfig().preferredLanguage ?? 'auto'
    const resolved = getResolvedLanguage()
    const suffix =
      pref === 'auto' ? ` → ${getLanguageDisplayName(resolved)}` : ''
    onDone(`Language: ${getLanguageDisplayName(pref)}${suffix}`, {
      display: 'system',
    })
    return null
  }

  if (!VALID_LANGS.includes(arg as PreferredLanguage)) {
    onDone(
      `Invalid language "${arg}". Use: ${VALID_LANGS.filter(l => l !== 'auto').join(', ')}, or auto`,
      { display: 'system' },
    )
    return null
  }

  const lang = arg as PreferredLanguage
  saveGlobalConfig(current => ({ ...current, preferredLanguage: lang }))

  const resolved = getResolvedLanguage()
  const suffix = lang === 'auto' ? ` → ${getLanguageDisplayName(resolved)}` : ''
  onDone(`Language set to ${getLanguageDisplayName(lang)}${suffix}`, {
    display: 'system',
  })
  return null
}
