import Fuse from 'fuse.js'
import {
  type Command,
  formatDescriptionWithSource,
  getCommand,
  getCommandName,
} from '../../commands.js'
import type { SuggestionItem } from '../../components/PromptInput/PromptInputFooterSuggestions.js'
import { getResolvedLanguage } from '../language.js'
import { getSkillUsageScore } from './skillUsageTracking.js'

// Chinese translations for common slash command descriptions
const ZH_COMMAND_DESCRIPTIONS: Record<string, string> = {
  // a
  'Activate pending plugin changes in the current session': '在当前会话中激活待处理的插件变更',
  'Add a new working directory': '添加新的工作目录',
  'Ask a quick side question without interrupting the main conversation': '不打断主对话快速提问',
  'Attach to a sub Claude CLI instance via named pipe': '通过命名管道连接子 Claude CLI',
  'Automates your Chrome browser to interact with web pages - clicking elements, filling forms, capturing screenshots, reading console logs, and navigating sites. Opens pages in new tabs within your existing Chrome session. Requires site-level permissions before executing (configured in the extension).':
    '自动化 Chrome 浏览器操作网页：点击元素、填写表单、截图、读取控制台日志和导航。在现有 Chrome 会话中新标签页打开，需先在扩展中配置站点权限',
  // b
  'Hatch a coding companion · pet, off': '孵化编程伙伴 · pet, off',
  'Build apps with the Claude API or Anthropic SDK.\nTRIGGER when: code imports `anthropic`/`@anthropic-ai/sdk`/`claude_agent_sdk`, or user asks to use Claude API, Anthropic SDKs, or Agent SDK.\nDO NOT TRIGGER when: code imports `openai`/other AI SDK, general programming, or ML/data-science tasks.':
    '使用 Claude API 或 Anthropic SDK 构建应用',
  'Research and plan a large-scale change, then execute it in parallel across 5–30 isolated worktree agents that each open a PR.':
    '研究并规划大规模变更，通过 5-30 个并行 worktree 代理执行，每个代理各开一个 PR',
  // c
  'Cancel a scheduled cron job by ID': '按 ID 取消定时任务',
  'Change the theme': '更改主题',
  'Claim main role for this machine (overrides current main machine)': '声明此机器为主机（覆盖当前主机）',
  'Clear conversation history and free up context': '清除对话历史并释放上下文',
  'Clear conversation history but keep a summary in context. Optional: /compact [instructions for summarization]':
    '清除对话历史但保留摘要。可选：/compact [摘要指令]',
  'Claude in Chrome (Beta) settings': 'Chrome 中的 Claude（Beta）设置',
  'Commit, push, and open a PR': '提交、推送并创建 PR',
  'Complete a security review of the pending changes on the current branch': '对当前分支的待更改内容进行安全审查',
  'Configure extra usage to keep working when limits are hit': '配置额外用量以在触及限制后继续工作',
  'Configure the advisor model': '配置顾问模型',
  'Configure the default remote environment for teleport sessions': '配置传送会话的默认远程环境',
  'Connect this terminal for remote-control sessions': '连接此终端用于远程控制会话',
  'Continue the current session in Claude Desktop': '在 Claude Desktop 中继续当前会话',
  'Control automatic skill matching during conversations': '控制对话中的自动技能匹配',
  'Copy Claude\'s last response to clipboard (or /copy N for the Nth-latest)': '复制 Claude 最近的回复到剪贴板（/copy N 复制第 N 条）',
  'Create a branch of the current conversation at this point': '在当前位置创建对话分支',
  'Create a git commit': '创建 git 提交',
  // d
  'Deprecated: use /config to change output style': '已弃用：请使用 /config 更改输出样式',
  'Detach from a sub CLI (or all connected subs)': '断开与子 CLI 的连接（或全部断开）',
  'Diagnose and verify your Claude Code installation and settings': '诊断并验证 Claude Code 安装和设置',
  'Dump the JS heap to ~/Desktop': '将 JS 堆转储到 ~/Desktop',
  // e
  'Edit Claude memory files': '编辑 Claude 记忆文件',
  'Enable debug logging for this session and help diagnose issues': '为本次会话启用调试日志以诊断问题',
  'Enable Option+Enter key binding for newlines and visual bell': '启用 Option+Enter 换行和视觉响铃键绑定',
  'Enable Shift+Enter key binding for newlines': '启用 Shift+Enter 换行键绑定',
  'Enable plan mode or view the current session plan': '启用计划模式或查看当前会话计划',
  'Exit the REPL': '退出 REPL',
  'Export the current conversation to a file or clipboard': '将当前对话导出到文件或剪贴板',
  // f
  'Fork the current session into a new sub-agent': '将当前会话分叉为新的子代理',
  'Force snip conversation history at current point': '在当前位置强制截断对话历史',
  // g
  'Generate a report analyzing your Claude Code sessions': '生成 Claude Code 会话分析报告',
  'Generate and display a session summary': '生成并显示会话摘要',
  'Generate filler text for long context testing. Specify token count as argument (e.g., /lorem-ipsum 50000). Outputs approximately the requested number of tokens. Ant-only.':
    '生成长上下文测试用填充文本，指定 token 数量（如 /lorem-ipsum 50000），仅供内部使用',
  'Get comments from a GitHub pull request': '获取 GitHub Pull Request 的评论',
  // h
  'Show help and available commands': '显示帮助和可用命令',
  // i
  'Inspect pipe registry state and toggle the pipe selector': '检查管道注册表状态并切换管道选择器',
  'Install the Claude Slack app': '安装 Claude Slack 应用',
  // k
  'Use when the user wants to customize keyboard shortcuts, rebind keys, add chord bindings, or modify ~/.claude/keybindings.json. Examples: "rebind ctrl+s", "add a chord shortcut", "change the submit key", "customize keybindings".':
    '自定义快捷键、重新绑定按键或修改 ~/.claude/keybindings.json',
  // l
  'List all files currently in context': '列出当前上下文中的所有文件',
  'List all scheduled cron jobs in this session': '列出本次会话中所有定时任务',
  'List and manage background tasks': '列出并管理后台任务',
  'List available skills': '列出可用技能',
  'List available workflow scripts': '列出可用工作流脚本',
  'List connected Claude Code peers': '列出已连接的 Claude Code 对等端',
  // m
  'Manage agent configurations': '管理代理配置',
  'Manage allow & deny tool permission rules': '管理工具权限允许与拒绝规则',
  'Manage background sessions and daemon': '管理后台会话和守护进程',
  'Manage Claude Code plugins': '管理 Claude Code 插件',
  'Manage IDE integrations and show status': '管理 IDE 集成并显示状态',
  'Manage MCP servers': '管理 MCP 服务器',
  'Manage skill learning (observe, analyze, evolve)': '管理技能学习（观察、分析、进化）',
  'Manage template jobs': '管理模板任务',
  'Manually trigger memory consolidation — review, organize, and prune your auto-memory files.':
    '手动触发记忆整理 — 审查、组织并清理自动记忆文件',
  // o
  'Open config panel': '打开配置面板',
  'Open or create your keybindings configuration file': '打开或创建快捷键配置文件',
  'Open the Kairos assistant panel': '打开 Kairos 助手面板',
  'Order Claude Code stickers': '订购 Claude Code 贴纸',
  // p
  'Play the thinkback animation': '播放 thinkback 动画',
  // r
  'Rename the current conversation': '重命名当前对话',
  'Restore the code and/or conversation to a previous point': '将代码或对话恢复到之前的状态',
  'Resume a previous conversation': '恢复之前的对话',
  'Review a pull request': '审查 Pull Request',
  'Review auto-memory entries and propose promotions to CLAUDE.md, CLAUDE.local.md, or shared memory. Also detects outdated, conflicting, and duplicate entries across memory layers.':
    '审查自动记忆条目并建议升级到 CLAUDE.md，同时检测过期、冲突和重复条目',
  'Run a prompt or slash command on a recurring interval (e.g. /loop 5m /foo, defaults to 10m)':
    '按循环间隔运行提示或命令（例如 /loop 5m /foo，默认 10m）',
  // s
  "Set up Claude Code's status line UI": '设置 Claude Code 状态栏 UI',
  'Send a message to a connected sub CLI': '向已连接的子 CLI 发送消息',
  'Set display language (en/zh/auto)': '设置界面语言 (en/zh/auto)',
  'Set effort level for model usage': '设置模型使用的努力程度',
  'Set the prompt bar color for this session': '设置本次会话的输入栏颜色',
  'Set up Claude GitHub Actions for a repository': '为仓库设置 Claude GitHub Actions',
  'Setup Claude Code on the web (requires connecting your GitHub account)': '在 Web 上设置 Claude Code（需要连接 GitHub 账户）',
  'Show current context usage': '显示当前上下文用量',
  'Show current pipe connection status': '显示当前管道连接状态',
  'Show options when rate limit is reached': '达到速率限制时显示选项',
  'Show plan usage limits': '显示计划用量限制',
  'Show QR code to download the Claude mobile app': '显示下载 Claude 移动应用的二维码',
  'Show remote session URL and QR code': '显示远程会话 URL 和二维码',
  'Show the total cost and duration of the current session': '显示当前会话的总费用和时长',
  'Show your Claude Code usage statistics and activity': '显示 Claude Code 使用统计和活动',
  'Show Claude Code status including version, model, account, API connectivity, and tool statuses':
    '显示 Claude Code 状态：版本、模型、账户、API 连接和工具状态',
  'Sign out from your Anthropic account': '退出 Anthropic 账户',
  'Start a background shell monitor (Shift+Down to view)': '启动后台 shell 监控（Shift+Down 查看）',
  'Start a persistent Remote Control server (daemon) that accepts multiple sessions':
    '启动持久化远程控制服务器（守护进程），接受多个会话',
  'Subscribe to GitHub PR activity (comments, CI, reviews)': '订阅 GitHub PR 动态（评论、CI、审查）',
  'Submit feedback about Claude Code': '提交关于 Claude Code 的反馈',
  'Switch API provider (anthropic/openai/gemini/grok/bedrock/vertex/foundry)':
    '切换 API 提供商（anthropic/openai/gemini/grok/bedrock/vertex/foundry）',
  'Review changed code for reuse, quality, and efficiency, then fix any issues found.':
    '审查变更代码的复用性、质量和效率，并修复发现的问题',
  // t
  'Toggle a searchable tag on the current session': '为当前会话切换可搜索标签',
  'Toggle between Vim and Normal editing modes': '在 Vim 和普通编辑模式之间切换',
  'Toggle brief-only mode': '切换简报模式',
  'Toggle coordinator (multi-worker) mode': '切换协调器（多工作者）模式',
  'Toggle poor mode — disable extract_memories and prompt_suggestion to save tokens':
    '切换省钱模式 — 禁用记忆提取和提示建议以节省 token',
  'Toggle proactive (autonomous) mode': '切换主动（自主）模式',
  'Toggle voice mode': '切换语音模式',
  "Capture this session's repeatable process into a skill. Call at end of the process you want to capture with an optional description.":
    '将本次会话的可重复流程捕获为技能，在流程结束时调用，可附带可选描述',
  'Create, update, list, or run scheduled remote agents (triggers) that execute on a cron schedule.':
    '创建、更新、列出或运行按 cron 计划执行的定时远程代理',
  '[ANT-ONLY] Investigate frozen/stuck/slow Claude Code sessions on this machine and post a diagnostic report to #claude-code-feedback.':
    '【内部】调查本机上冻结/卡死/缓慢的 Claude Code 会话并发布诊断报告',
  'Use this skill to configure the Claude Code harness via settings.json. Automated behaviors ("from now on when X", "each time X", "whenever X", "before/after X") require hooks configured in settings.json - the harness executes these, not Claude, so memory/preferences cannot fulfill them. Also use for: permissions ("allow X", "add permission", "move permission to"), env vars ("set X=Y"), hook troubleshooting, or any changes to settings.json/settings.local.json files. Examples: "allow npm commands", "add bq permission to global settings", "move permission to user settings", "set DEBUG=true", "when claude stops show X". For simple settings like theme/model, use Config tool.':
    '通过 settings.json 配置 Claude Code（权限、环境变量、钩子等）',
  // u
  'Upgrade to Max for higher rate limits and more Opus': '升级到 Max 以获取更高速率限制和更多 Opus',
  // v
  'View and update your privacy settings': '查看并更新隐私设置',
  'View hook configurations for tool events': '查看工具事件的钩子配置',
  'View release notes': '查看发版说明',
  'View session history of a connected sub CLI': '查看已连接子 CLI 的会话历史',
  'View uncommitted changes and per-turn diffs': '查看未提交更改和每轮对话的差异',
  'Visualize current context usage as a colored grid': '以彩色网格可视化当前上下文用量',
  // y
  'Your 2025 Claude Code Year in Review': '你的 2025 Claude Code 年度回顾',
}

function translateDescription(description: string): string {
  if (getResolvedLanguage() !== 'zh') return description
  // Exact match first
  const exact = ZH_COMMAND_DESCRIPTIONS[description]
  if (exact) return exact
  // Dynamic descriptions: prefix match
  if (description.startsWith('~10–30 min') || description.startsWith('~10-30 min')) {
    return '约 10–30 分钟 · 在线版 Claude Code 起草高级计划供你编辑和批准'
  }
  if (description.startsWith('~10–20 min') || description.startsWith('~10-20 min')) {
    return '约 10–20 分钟 · 在你的分支上查找并验证 Bug，在线运行'
  }
  // sandbox description is dynamic (shows enabled/disabled state) — keep as-is
  return description
}

// Treat these characters as word separators for command search
const SEPARATORS = /[:_-]/g

type CommandSearchItem = {
  descriptionKey: string[]
  partKey: string[] | undefined
  commandName: string
  command: Command
  aliasKey: string[] | undefined
}

// Cache the Fuse index keyed by the commands array identity. The commands
// array is stable (memoized in REPL.tsx), so we only rebuild when it changes
// rather than on every keystroke.
let fuseCache: {
  commands: Command[]
  fuse: Fuse<CommandSearchItem>
} | null = null

function getCommandFuse(commands: Command[]): Fuse<CommandSearchItem> {
  if (fuseCache?.commands === commands) {
    return fuseCache.fuse
  }

  const commandData: CommandSearchItem[] = commands
    .filter(cmd => !cmd.isHidden)
    .map(cmd => {
      const commandName = getCommandName(cmd)
      const parts = commandName.split(SEPARATORS).filter(Boolean)

      return {
        descriptionKey: (cmd.description ?? '')
          .split(' ')
          .map(word => cleanWord(word))
          .filter(Boolean),
        partKey: parts.length > 1 ? parts : undefined,
        commandName,
        command: cmd,
        aliasKey: cmd.aliases,
      }
    })

  const fuse = new Fuse(commandData, {
    includeScore: true,
    threshold: 0.3, // relatively strict matching
    location: 0, // prefer matches at the beginning of strings
    distance: 100, // increased to allow matching in descriptions
    keys: [
      {
        name: 'commandName',
        weight: 3, // Highest priority for command names
      },
      {
        name: 'partKey',
        weight: 2, // Next highest priority for command parts
      },
      {
        name: 'aliasKey',
        weight: 2, // Same high priority for aliases
      },
      {
        name: 'descriptionKey',
        weight: 0.5, // Lower priority for descriptions
      },
    ],
  })

  fuseCache = { commands, fuse }
  return fuse
}

/**
 * Type guard to check if a suggestion's metadata is a Command.
 * Commands have a name string and a type property.
 */
function isCommandMetadata(metadata: unknown): metadata is Command {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'name' in metadata &&
    typeof (metadata as { name: unknown }).name === 'string' &&
    'type' in metadata
  )
}

/**
 * Represents a slash command found mid-input (not at the start)
 */
export type MidInputSlashCommand = {
  token: string // e.g., "/com"
  startPos: number // Position of "/"
  partialCommand: string // e.g., "com"
}

/**
 * Finds a slash command token that appears mid-input (not at position 0).
 * A mid-input slash command is a "/" preceded by whitespace, where the cursor
 * is at or after the "/".
 *
 * @param input The full input string
 * @param cursorOffset The current cursor position
 * @returns The mid-input slash command info, or null if not found
 */
export function findMidInputSlashCommand(
  input: string,
  cursorOffset: number,
): MidInputSlashCommand | null {
  // If input starts with "/", this is start-of-input case (handled elsewhere)
  if (input.startsWith('/')) {
    return null
  }

  // Look backwards from cursor to find a "/" preceded by whitespace
  const beforeCursor = input.slice(0, cursorOffset)

  // Find the last "/" in the text before cursor
  // Pattern: whitespace followed by "/" then optional alphanumeric/dash characters.
  // Lookbehind (?<=\s) is avoided — it defeats YARR JIT in JSC, and the
  // interpreter scans O(n) even with the $ anchor. Capture the whitespace
  // instead and offset match.index by 1.
  const match = beforeCursor.match(/\s\/([a-zA-Z0-9_:-]*)$/)
  if (!match || match.index === undefined) {
    return null
  }

  // Get the full token (may extend past cursor)
  const slashPos = match.index + 1
  const textAfterSlash = input.slice(slashPos + 1)

  // Extract the command portion (until whitespace or end)
  const commandMatch = textAfterSlash.match(/^[a-zA-Z0-9_:-]*/)
  const fullCommand = commandMatch ? commandMatch[0] : ''

  // If cursor is past the command (after a space), don't show ghost text
  if (cursorOffset > slashPos + 1 + fullCommand.length) {
    return null
  }

  return {
    token: '/' + fullCommand,
    startPos: slashPos,
    partialCommand: fullCommand,
  }
}

/**
 * Finds the best matching command for a partial command string.
 * Delegates to generateCommandSuggestions and filters to prefix matches.
 *
 * @param partialCommand The partial command typed by the user (without "/")
 * @param commands Available commands
 * @returns The completion suffix (e.g., "mit" for partial "com" matching "commit"), or null
 */
export function getBestCommandMatch(
  partialCommand: string,
  commands: Command[],
): { suffix: string; fullCommand: string } | null {
  if (!partialCommand) {
    return null
  }

  // Use existing suggestion logic
  const suggestions = generateCommandSuggestions('/' + partialCommand, commands)
  if (suggestions.length === 0) {
    return null
  }

  // Find first suggestion that is a prefix match (for inline completion)
  const query = partialCommand.toLowerCase()
  for (const suggestion of suggestions) {
    if (!isCommandMetadata(suggestion.metadata)) {
      continue
    }
    const name = getCommandName(suggestion.metadata)
    if (name.toLowerCase().startsWith(query)) {
      const suffix = name.slice(partialCommand.length)
      // Only return if there's something to complete
      if (suffix) {
        return { suffix, fullCommand: name }
      }
    }
  }

  return null
}

/**
 * Checks if input is a command (starts with slash)
 */
export function isCommandInput(input: string): boolean {
  return input.startsWith('/')
}

/**
 * Checks if a command input has arguments
 * A command with just a trailing space is considered to have no arguments
 */
export function hasCommandArgs(input: string): boolean {
  if (!isCommandInput(input)) return false

  if (!input.includes(' ')) return false

  if (input.endsWith(' ')) return false

  return true
}

/**
 * Formats a command with proper notation
 */
export function formatCommand(command: string): string {
  return `/${command} `
}

/**
 * Generates a deterministic unique ID for a command suggestion.
 * Commands with the same name from different sources get unique IDs.
 *
 * Only prompt commands can have duplicates (from user settings, project
 * settings, plugins, etc). Built-in commands (local, local-jsx) are
 * defined once in code and can't have duplicates.
 */
function getCommandId(cmd: Command): string {
  const commandName = getCommandName(cmd)
  if (cmd.type === 'prompt') {
    // For plugin commands, include the repository to disambiguate
    if (cmd.source === 'plugin' && cmd.pluginInfo?.repository) {
      return `${commandName}:${cmd.source}:${cmd.pluginInfo.repository}`
    }
    return `${commandName}:${cmd.source}`
  }
  // Built-in commands include type as fallback for future-proofing
  return `${commandName}:${cmd.type}`
}

/**
 * Checks if a query matches any of the command's aliases.
 * Returns the matched alias if found, otherwise undefined.
 */
function findMatchedAlias(
  query: string,
  aliases?: string[],
): string | undefined {
  if (!aliases || aliases.length === 0 || query === '') {
    return undefined
  }
  // Check if query is a prefix of any alias (case-insensitive)
  return aliases.find(alias => alias.toLowerCase().startsWith(query))
}

/**
 * Creates a suggestion item from a command.
 * Only shows the matched alias in parentheses if the user typed an alias.
 */
function createCommandSuggestionItem(
  cmd: Command,
  matchedAlias?: string,
): SuggestionItem {
  const commandName = getCommandName(cmd)
  // Only show the alias if the user typed it
  const aliasText = matchedAlias ? ` (${matchedAlias})` : ''

  const isWorkflow = cmd.type === 'prompt' && cmd.kind === 'workflow'

  // Show "local" tag for project-scoped prompt commands
  const scopeTag =
    cmd.type === 'prompt' &&
    !isWorkflow &&
    (cmd.source === 'projectSettings' || cmd.source === 'localSettings')
      ? 'local'
      : undefined

  const fullDescription =
    translateDescription(isWorkflow ? cmd.description : formatDescriptionWithSource(cmd)) +
    (cmd.type === 'prompt' && cmd.argNames?.length
      ? ` (arguments: ${cmd.argNames.join(', ')})`
      : '')

  return {
    id: getCommandId(cmd),
    displayText: `/${commandName}${aliasText}`,
    tag: isWorkflow ? 'workflow' : scopeTag,
    description: fullDescription,
    metadata: cmd,
  }
}

/**
 * Generate command suggestions based on input
 */
export function generateCommandSuggestions(
  input: string,
  commands: Command[],
): SuggestionItem[] {
  // Only process command input
  if (!isCommandInput(input)) {
    return []
  }

  // If there are arguments, don't show suggestions
  if (hasCommandArgs(input)) {
    return []
  }

  const query = input.slice(1).toLowerCase().trim()

  // When just typing '/' without additional text
  if (query === '') {
    const visibleCommands = commands.filter(cmd => !cmd.isHidden)

    // Find recently used skills (only prompt commands have usage tracking)
    const recentlyUsed: Command[] = []
    const commandsWithScores = visibleCommands
      .filter(cmd => cmd.type === 'prompt')
      .map(cmd => ({
        cmd,
        score: getSkillUsageScore(getCommandName(cmd)),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)

    // Take top 5 recently used skills
    for (const item of commandsWithScores.slice(0, 5)) {
      recentlyUsed.push(item.cmd)
    }

    // Create a set of recently used command IDs to avoid duplicates
    const recentlyUsedIds = new Set(recentlyUsed.map(cmd => getCommandId(cmd)))

    // Categorize remaining commands (excluding recently used)
    const builtinCommands: Command[] = []
    const userCommands: Command[] = []
    const projectCommands: Command[] = []
    const policyCommands: Command[] = []
    const otherCommands: Command[] = []

    visibleCommands.forEach(cmd => {
      // Skip if already in recently used
      if (recentlyUsedIds.has(getCommandId(cmd))) {
        return
      }

      if (cmd.type === 'local' || cmd.type === 'local-jsx') {
        builtinCommands.push(cmd)
      } else if (
        cmd.type === 'prompt' &&
        (cmd.source === 'userSettings' || cmd.source === 'localSettings')
      ) {
        userCommands.push(cmd)
      } else if (cmd.type === 'prompt' && cmd.source === 'projectSettings') {
        projectCommands.push(cmd)
      } else if (cmd.type === 'prompt' && cmd.source === 'policySettings') {
        policyCommands.push(cmd)
      } else {
        otherCommands.push(cmd)
      }
    })

    // Sort each category alphabetically
    const sortAlphabetically = (a: Command, b: Command) =>
      getCommandName(a).localeCompare(getCommandName(b))

    builtinCommands.sort(sortAlphabetically)
    userCommands.sort(sortAlphabetically)
    projectCommands.sort(sortAlphabetically)
    policyCommands.sort(sortAlphabetically)
    otherCommands.sort(sortAlphabetically)

    // Combine with built-in commands prioritized after recently used,
    // so they remain visible even when many skills are installed
    return [
      ...recentlyUsed,
      ...builtinCommands,
      ...userCommands,
      ...projectCommands,
      ...policyCommands,
      ...otherCommands,
    ].map(cmd => createCommandSuggestionItem(cmd))
  }

  // The Fuse index filters isHidden at build time and is keyed on the
  // (memoized) commands array identity, so a command that is hidden when Fuse
  // first builds stays invisible to Fuse for the whole session. If the user
  // types the exact name of a currently-hidden command, prepend it to the
  // Fuse results so exact-name always wins over weak description fuzzy
  // matches — but only when no visible command shares the name (that would
  // be the user's explicit override and should win). Prepend rather than
  // early-return so visible prefix siblings (e.g. /voice-memo) still appear
  // below, and getBestCommandMatch can still find a non-empty suffix.
  let hiddenExact = commands.find(
    cmd => cmd.isHidden && getCommandName(cmd).toLowerCase() === query,
  )
  if (
    hiddenExact &&
    commands.some(
      cmd => !cmd.isHidden && getCommandName(cmd).toLowerCase() === query,
    )
  ) {
    hiddenExact = undefined
  }

  const fuse = getCommandFuse(commands)
  const searchResults = fuse.search(query)

  // Sort results prioritizing exact/prefix command name matches over fuzzy description matches
  // Priority order:
  // 1. Exact name match (highest)
  // 2. Exact alias match
  // 3. Prefix name match
  // 4. Prefix alias match
  // 5. Fuzzy match (lowest)
  // Precompute per-item values once to avoid O(n log n) recomputation in comparator
  const withMeta = searchResults.map(r => {
    const name = r.item.commandName.toLowerCase()
    const aliases = r.item.aliasKey?.map(alias => alias.toLowerCase()) ?? []
    const usage =
      r.item.command.type === 'prompt'
        ? getSkillUsageScore(getCommandName(r.item.command))
        : 0
    return { r, name, aliases, usage }
  })

  const sortedResults = withMeta.sort((a, b) => {
    const aName = a.name
    const bName = b.name
    const aAliases = a.aliases
    const bAliases = b.aliases

    // Check for exact name match (highest priority)
    const aExactName = aName === query
    const bExactName = bName === query
    if (aExactName && !bExactName) return -1
    if (bExactName && !aExactName) return 1

    // Check for exact alias match
    const aExactAlias = aAliases.some(alias => alias === query)
    const bExactAlias = bAliases.some(alias => alias === query)
    if (aExactAlias && !bExactAlias) return -1
    if (bExactAlias && !aExactAlias) return 1

    // Check for prefix name match
    const aPrefixName = aName.startsWith(query)
    const bPrefixName = bName.startsWith(query)
    if (aPrefixName && !bPrefixName) return -1
    if (bPrefixName && !aPrefixName) return 1
    // Among prefix name matches, prefer the shorter name (closer to exact)
    if (aPrefixName && bPrefixName && aName.length !== bName.length) {
      return aName.length - bName.length
    }

    // Check for prefix alias match
    const aPrefixAlias = aAliases.find(alias => alias.startsWith(query))
    const bPrefixAlias = bAliases.find(alias => alias.startsWith(query))
    if (aPrefixAlias && !bPrefixAlias) return -1
    if (bPrefixAlias && !aPrefixAlias) return 1
    // Among prefix alias matches, prefer the shorter alias
    if (
      aPrefixAlias &&
      bPrefixAlias &&
      aPrefixAlias.length !== bPrefixAlias.length
    ) {
      return aPrefixAlias.length - bPrefixAlias.length
    }

    // For similar match types, use Fuse score with usage as tiebreaker
    const scoreDiff = (a.r.score ?? 0) - (b.r.score ?? 0)
    if (Math.abs(scoreDiff) > 0.1) {
      return scoreDiff
    }
    // For similar Fuse scores, prefer more frequently used skills
    return b.usage - a.usage
  })

  // Map search results to suggestion items
  // Note: We intentionally don't deduplicate here because commands with the same name
  // from different sources (e.g., projectSettings vs userSettings) may have different
  // implementations and should both be available to the user
  const fuseSuggestions = sortedResults.map(result => {
    const cmd = result.r.item.command
    // Only show alias in parentheses if the user typed an alias
    const matchedAlias = findMatchedAlias(query, cmd.aliases)
    return createCommandSuggestionItem(cmd, matchedAlias)
  })
  // Skip the prepend if hiddenExact is already in fuseSuggestions — this
  // happens when isHidden flips false→true mid-session (OAuth expiry,
  // GrowthBook kill-switch) and the stale Fuse index still holds the
  // command. Fuse already sorts exact-name matches first, so no reorder
  // is needed; we just don't want a duplicate id (duplicate React keys,
  // both rows rendering as selected).
  if (hiddenExact) {
    const hiddenId = getCommandId(hiddenExact)
    if (!fuseSuggestions.some(s => s.id === hiddenId)) {
      return [createCommandSuggestionItem(hiddenExact), ...fuseSuggestions]
    }
  }
  return fuseSuggestions
}

/**
 * Apply selected command to input
 */
export function applyCommandSuggestion(
  suggestion: string | SuggestionItem,
  shouldExecute: boolean,
  commands: Command[],
  onInputChange: (value: string) => void,
  setCursorOffset: (offset: number) => void,
  onSubmit: (value: string, isSubmittingSlashCommand?: boolean) => void,
): void {
  // Extract command name and object from string or SuggestionItem metadata
  let commandName: string
  let commandObj: Command | undefined
  if (typeof suggestion === 'string') {
    commandName = suggestion
    commandObj = shouldExecute ? getCommand(commandName, commands) : undefined
  } else {
    if (!isCommandMetadata(suggestion.metadata)) {
      return // Invalid suggestion, nothing to apply
    }
    commandName = getCommandName(suggestion.metadata)
    commandObj = suggestion.metadata
  }

  // Format the command input with trailing space
  const newInput = formatCommand(commandName)
  onInputChange(newInput)
  setCursorOffset(newInput.length)

  // Execute command if requested and it takes no arguments
  if (shouldExecute && commandObj) {
    if (
      commandObj.type !== 'prompt' ||
      (commandObj.argNames ?? []).length === 0
    ) {
      onSubmit(newInput, /* isSubmittingSlashCommand */ true)
    }
  }
}

// Helper function at bottom of file per CLAUDE.md
function cleanWord(word: string) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Find all /command patterns in text for highlighting.
 * Returns array of {start, end} positions.
 * Requires whitespace or start-of-string before the slash to avoid
 * matching paths like /usr/bin.
 */
export function findSlashCommandPositions(
  text: string,
): Array<{ start: number; end: number }> {
  const positions: Array<{ start: number; end: number }> = []
  // Match /command patterns preceded by whitespace or start-of-string
  const regex = /(^|[\s])(\/[a-zA-Z][a-zA-Z0-9:\-_]*)/g
  let match: RegExpExecArray | null = null
  while ((match = regex.exec(text)) !== null) {
    const precedingChar = match[1] ?? ''
    const commandName = match[2] ?? ''
    // Start position is after the whitespace (if any)
    const start = match.index + precedingChar.length
    positions.push({ start, end: start + commandName.length })
  }
  return positions
}
