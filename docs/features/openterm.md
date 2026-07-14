# OpenTerm 产品与技术方案

OpenTerm 是一个原创的跨平台终端与远程连接客户端，目标是提供接近现代专业终端工具的高效率工作流，同时避免复制任何专有产品的品牌、图标、私有源码或像素级界面。

## 边界与复用策略

- OpenTerm 可以参考同类工具的公开能力集合：SSH、Telnet、Serial、Local Shell、SFTP、标签页、分屏、会话管理、日志、主题、快捷键和跳板机。
- WindTerm 官方仓库说明其是 partial open source project，开源范围包含可独立使用的类、算法、GUI widgets、网络/协议库以及许可证要求必须开放的类型；因此只能复用明确公开且许可证允许的代码。
- 任何复用都必须保留许可证、版权声明和 NOTICE；默认把第三方代码放入 `third_party/` 或独立 workspace，并记录来源、版本、许可证和本地改动。
- 不复制 WindTerm 的名称、Logo、图标、截图、专有资源、未公开代码、完整视觉外观或可识别的商业外观。
- 对于仅学习用途的实验，可以做功能验证；但进入仓库主线时必须采用原创实现或合规依赖。

## 产品定位

OpenTerm 面向 DevOps、后端工程师、SRE、嵌入式开发者和 AI coding 用户，提供一个轻量、可扩展、可脚本化的远程工作台。

核心目标：

1. 快速建立 SSH / Shell / Serial / SFTP 连接。
2. 在一个窗口内管理多主机、多项目、多标签和多分屏。
3. 把终端、文件传输、命令片段、会话日志和 AI 辅助工作流整合到同一工作台。
4. 支持跨平台桌面端，并保留未来嵌入现有 CLI / Remote Control Server 的可能。

## 非目标

- 不做 WindTerm 的像素级复刻。
- 不复制任何专有资源。
- MVP 阶段不自研完整终端渲染引擎，优先复用成熟库。
- MVP 阶段不实现企业级同步、团队空间和云端账号体系。

## 推荐技术栈

### 桌面壳

首选：Tauri 2 + React + TypeScript。

理由：

- 产物体积较 Electron 小。
- Rust 后端适合实现 SSH、SFTP、Serial、加密存储和本地进程管理。
- React 前端便于快速构建复杂面板、标签页和设置页。

备选：Electron + React + Node-PTY。

适用场景：快速原型、依赖 Node 生态、团队更熟悉 Web 桌面应用。

### 终端渲染

- `xterm.js` 作为 MVP 终端组件。
- 启用 WebGL / Canvas 渲染插件。
- 支持链接识别、搜索、Unicode 宽字符、复制粘贴和 bracketed paste。

### 后端能力

- SSH：Rust `russh` 或 Node `ssh2`。
- SFTP：Rust SFTP 实现或 Node `ssh2-sftp-client`。
- Local shell：Unix PTY / Windows ConPTY。
- Serial：Rust `serialport` 或 Node SerialPort。
- 配置存储：SQLite + JSON schema migration。
- 密钥存储：系统 Keychain / Credential Manager / libsecret。

## 信息架构

```text
OpenTerm
├── Workspace
│   ├── Session Tree
│   ├── Favorites
│   └── Recent Connections
├── Terminal Area
│   ├── Tabs
│   ├── Split Panes
│   └── Terminal Instances
├── Side Panels
│   ├── SFTP
│   ├── Snippets
│   ├── Logs
│   ├── Port Forwarding
│   └── AI Assistant
└── Settings
    ├── Profiles
    ├── Themes
    ├── Keys
    ├── Security
    └── Plugins
```

## MVP 功能清单

### P0：可用终端

- 本地 Shell 会话。
- SSH 密码登录。
- SSH 私钥登录。
- 多标签页。
- 基础分屏。
- 会话保存与最近连接。
- 主题：浅色、深色、暖色暗色。
- 字体、字号、行高配置。
- 复制、粘贴、搜索。

### P1：远程工作流

- SFTP 文件浏览、上传、下载、删除、重命名。
- 命令片段库。
- 会话日志记录。
- 跳板机 / ProxyJump。
- 端口转发：local、remote、dynamic。
- Known hosts 管理。
- 主密码或系统密钥链保护凭据。

### P2：高级能力

- Serial / Telnet / Raw TCP。
- Tmux 集成视图。
- 同步输入到多个 Pane。
- 连接健康监控与自动重连。
- 插件 API。
- AI 命令解释、报错解释、Shell 辅助。
- Remote Control Server 集成。

## 原创视觉方向

OpenTerm 使用温暖、清晰、高密度但不拥挤的视觉语言。

### 设计原则

- Considered over clever：每个交互选择都要有明确用途。
- Warmth through subtlety：通过暖色中性色和克制强调色建立亲和感。
- Density with clarity：面向专业用户，允许信息密度，但层级必须清楚。
- Community voice：默认配置和文案偏开发者友好，而不是企业 SaaS 风格。

### 基础色板

- Primary：`#D77757`
- Accent：`#5769F7`
- Dark background：`#171412`
- Panel background：`#211D1A`
- Border：`#3A312C`
- Text primary：`#F4EEE8`
- Text muted：`#B8AAA0`

## 数据模型草案

```ts
interface OpenTermSession {
  id: string;
  name: string;
  kind: "local" | "ssh" | "telnet" | "serial" | "rawTcp";
  groupId?: string;
  host?: string;
  port?: number;
  username?: string;
  authRef?: string;
  shell?: string;
  startupCommand?: string;
  themeId?: string;
  createdAt: string;
  updatedAt: string;
}

interface OpenTermCredentialRef {
  id: string;
  kind: "password" | "privateKey" | "agent";
  label: string;
  storage: "keychain" | "file" | "agent";
}

interface OpenTermLayout {
  id: string;
  workspaceId: string;
  tabs: OpenTermTab[];
}

interface OpenTermTab {
  id: string;
  title: string;
  rootPaneId: string;
}
```

## 模块划分建议

```text
packages/openterm-core/
  src/session/
  src/connection/
  src/credentials/
  src/layout/
  src/theme/

packages/openterm-desktop/
  src-tauri/
  src/components/
  src/features/terminal/
  src/features/sftp/
  src/features/sessions/
  src/features/settings/

packages/openterm-protocols/
  src/ssh/
  src/sftp/
  src/serial/
  src/telnet/
```

如果集成到当前仓库，可以先以 `packages/openterm-core` 和 `packages/openterm-desktop` 的形式落地，避免影响现有 CLI 主流程。

## 里程碑

### Milestone 1：原型

- 创建 Tauri + React 桌面应用。
- 嵌入 xterm.js。
- 打开本地 shell。
- 支持标签页和主题切换。

### Milestone 2：SSH MVP

- 实现 SSH 密码和私钥登录。
- 支持会话保存。
- 支持 known hosts 基础校验。
- 支持断线提示和重连。

### Milestone 3：SFTP 与工作台

- 左侧 SFTP 面板。
- 拖拽上传下载。
- 传输队列。
- 文件操作确认和错误提示。

### Milestone 4：专业增强

- 分屏布局持久化。
- 端口转发。
- 命令片段库。
- 日志记录。
- 快捷键配置。

### Milestone 5：AI 与自动化

- 接入当前项目的 Claude Code 能力。
- 支持解释命令、解释错误、生成命令片段。
- 支持远程会话上下文摘要。

## 合规复用流程

1. 确认第三方组件是否真正开源，以及具体目录是否在许可证覆盖范围内。
2. 记录来源 URL、commit、许可证和版权声明。
3. 只复制许可证允许复用的源码，不复制资源文件和商标元素。
4. 对 Apache-2.0 组件保留 LICENSE / NOTICE，并在 OpenTerm 的第三方声明中列出。
5. 修改第三方代码时保留修改记录。
6. 无法确认许可证的代码一律不进入主线。

## 下一步实现建议

推荐先做 `packages/openterm-core` 的纯 TypeScript 数据模型与状态机，再做桌面 UI。这样可以在不引入 Tauri 大量依赖的情况下，先稳定会话、布局、主题和连接状态抽象。
