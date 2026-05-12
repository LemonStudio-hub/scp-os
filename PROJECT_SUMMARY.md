# SCP-OS 项目完整总结

> 生成时间：2026-05-12
> 项目名称：SCP-OS（SCP Foundation Web OS）
> 版本：0.4.0
> 仓库类型：Monorepo（pnpm workspace）

---

## 一、项目概述

SCP-OS 是一个以 **SCP 基金会** 为主题的 Web 操作系统，在浏览器中提供完整的桌面环境体验。系统内置命令行终端、文件管理器、代码编辑器、实时聊天、性能仪表盘、反馈系统、SCP 离线阅读器（Docs）等 7 款以上内置应用，支持桌面与移动端自适应适配。

**核心价值**：
- Web OS 体验：类 Windows 桌面 + 类 iOS 移动主屏
- 沉浸式设计：SCP 基金会世界观贯穿始终
- 数据集成：实时爬取 SCP Wiki 数据（中英文分部）
- 双端适配：桌面端与移动端无缝切换
- 可扩展性：内置插件系统、工具注册表与依赖注入容器
- 安全可靠：CSP 策略、速率限制、HTML 清洗、本地优先

---

## 二、整体技术栈

### 前端（Web 应用）
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5 | 前端框架 |
| TypeScript | 5.9 | 类型系统 |
| Vite | 6 | 构建工具 |
| Pinia | 3 | 状态管理 |
| Tailwind CSS | 4 | 原子化样式 |
| xterm.js | 5 | 终端模拟器 |
| CodeMirror | 6 | 代码编辑器 |
| Hammer.js | 2 | 手势识别 |
| axios | 1.14 | HTTP 客户端 |
| DOMPurify | 3.4 | HTML 消毒（防 XSS） |
| uuid | 13 | UUID 生成 |

### 桌面端
| 技术 | 版本 | 用途 |
|------|------|------|
| Tauri | 2.10 | 桌面应用框架 |
| Rust | stable | 原生后端语言 |

### 后端（Worker）
| 技术 | 版本 | 用途 |
|------|------|------|
| Cloudflare Workers | - | 无服务器边缘运行时 |
| Cloudflare D1 | - | SQLite 边缘数据库 |
| Cloudflare KV | - | 键值缓存 |
| Durable Objects | - | 聊天室状态持久化 |
| cheerio | 1.2 | HTML 解析（jQuery 风格） |
| linkedom | 0.18 | DOM 模拟（Defuddle 前置） |
| Defuddle | 1.0 | 文章内容提取 |

### 工程化
| 技术 | 版本 | 用途 |
|------|------|------|
| pnpm | 10.3.0 | 包管理器 + workspace |
| ESLint | 9 | 代码检查 |
| Prettier | 3 | 代码格式化 |
| Vitest | 4 | 单元测试 |
| vue-tsc | 3.2 | Vue 类型检查 |
| GitHub Actions | - | CI/CD |

---

## 三、Monorepo 目录结构总览

```
scp-os/
├── .github/workflows/          # CI/CD 工作流
├── .githooks/                  # Git 钩子（pre-commit、pre-push 等）
├── .vscode/                    # VS Code 推荐扩展配置
├── docs/                       # 项目文档
├── dist/                       # Web 构建产物（Vite 输出）
├── coverage/                   # 测试覆盖率报告
├── packages/
│   ├── app/                    # 前端 Web 应用（@scp-os/app）
│   ├── desktop/                # Tauri 桌面客户端（@scp-os/desktop）
│   └── worker/                 # Cloudflare Worker（scp-scraper-worker）
├── package.json                # 根 package.json（脚本聚合）
├── pnpm-workspace.yaml         # pnpm workspace 配置
├── pnpm-lock.yaml              # 依赖锁定文件
├── .env.example                # 环境变量模板
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── wrangler-pages.toml         # Cloudflare Pages 配置
├── .eslintrc.json              # ESLint 配置
├── .prettierrc                 # Prettier 配置
└── README.md                   # 项目主文档
```

---

## 四、根目录文件详解

| 文件/目录 | 说明 |
|-----------|------|
| `package.json` | 根级 package.json，定义全局脚本（dev/build/test/worker:dev/desktop:dev 等），不发布到 npm（private: true） |
| `pnpm-workspace.yaml` | 定义 workspace 包含 `packages/*`，使 pnpm 识别三个子包 |
| `pnpm-lock.yaml` | 全 Monorepo 的依赖锁定文件，确保构建可复现 |
| `.env.example` | 环境变量配置模板，包含 API 地址、缓存配置、终端配置、JWT 密钥等说明 |
| `.env.development` | 开发环境变量（Vite 开发模式加载） |
| `.env.production` | 生产环境变量（Vite 生产模式加载） |
| `wrangler-pages.toml` | Cloudflare Pages 部署配置（若前端托管到 Pages） |
| `.eslintrc.json` | 根级 ESLint 配置 |
| `.prettierrc` | 根级 Prettier 配置 |
| `.eslintignore` | ESLint 忽略列表 |
| `.prettierignore` | Prettier 忽略列表 |
| `.node-version` | 指定 Node.js 版本（供 nvm/fnm 使用） |
| `release-please-config.json` | release-please 自动化发版配置 |
| `.release-please-manifest.json` | release-please 版本清单 |
| `CHANGELOG.md` | 变更日志 |
| `CONTRIBUTING.md` | 贡献指南 |
| `LICENSE` | MIT 许可证 |

---

## 五、前端包详解：`packages/app`

这是项目的核心前端应用，一个完整的 Web OS GUI。

### 5.1 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 定义前端依赖（Vue、Pinia、Tailwind、xterm、CodeMirror、axios 等）和脚本（dev/build/test/lint/format/typecheck） |
| `vite.config.ts` | Vite 主配置：Vue 插件、Service Worker 编译（esbuild TS→JS）、PWA 资源复制、手动代码分割（vue-vendor/terminal/network/gestures/editor）、Terser 压缩、开发代理（/api → 生产 API）、安全响应头 |
| `vite-admin.config.ts` | 管理后台独立构建配置 |
| `tsconfig.json` | TypeScript 配置 |
| `vitest.config.ts` | Vitest 测试配置（含覆盖率） |
| `eslint.config.js` | ESLint 9 扁平配置 |
| `postcss.config.js` | PostCSS 配置（Tailwind CSS v4） |
| `.prettierrc` | Prettier 格式化规则 |
| `index.html` | Web 应用入口 HTML |
| `admin-index.html` | 管理后台入口 HTML |

### 5.2 入口与全局文件

| 文件 | 说明 |
|------|------|
| `src/main.ts` | **前端主入口**：创建 Vue 应用、注册 Pinia、初始化终端 Store、设置全局错误处理（window.onerror / unhandledrejection / Vue errorHandler）、注销旧 Service Worker、初始化用户 UUID |
| `src/admin-main.ts` | 管理后台独立入口 |
| `src/App.vue` | **根 Vue 组件**：包裹整个应用，根据设备类型渲染桌面端或移动端布局 |
| `src/style.css` | 全局样式（含 Tailwind 导入、SCP 主题变量） |
| `src/admin-style.css` | 管理后台全局样式 |

### 5.3 分层架构目录（DDD 风格）

#### `src/core/` —— 核心层（DI 容器）
| 文件 | 说明 |
|------|------|
| `container.ts` | 依赖注入容器实现，支持 Singleton / Scoped / Transient 三种生命周期，内置循环依赖检测 |
| `types.ts` | DI 容器相关类型定义 |

#### `src/domain/` —— 领域层（实体、值对象、仓库接口）
| 文件 | 说明 |
|------|------|
| `entities/command-history.entity.ts` | 命令历史领域实体 |
| `entities/scp.entity.ts` | SCP 数据领域实体 |
| `entities/tab.entity.ts` | 终端标签页领域实体 |
| `repositories/command-history-repository.interface.ts` | 命令历史仓库接口 |
| `repositories/scp-repository.interface.ts` | SCP 数据仓库接口 |
| `repositories/tab-repository.interface.ts` | 标签页仓库接口 |
| `value-objects/command-id.vo.ts` | 命令 ID 值对象 |
| `value-objects/scp-number.vo.ts` | SCP 编号值对象 |

#### `src/application/` —— 应用层（控制器、应用服务）
| 文件 | 说明 |
|------|------|
| `controllers/command.controller.ts` | 命令处理控制器 |
| `services/terminal-application.service.ts` | 终端应用服务，协调领域逻辑与基础设施 |

#### `src/infrastructure/` —— 基础设施层（仓库实现、HTTP 客户端）
| 文件 | 说明 |
|------|------|
| `http/fetch-http-client.ts` | fetch 封装 HTTP 客户端 |
| `repositories/command-history-indexeddb.repository.ts` | 命令历史 IndexedDB 仓库实现 |
| `repositories/command-history-memory.repository.ts` | 命令历史内存仓库实现（降级） |
| `repositories/tab-indexeddb.repository.ts` | 标签页 IndexedDB 仓库实现 |
| `repositories/tab-memory.repository.ts` | 标签页内存仓库实现 |
| `repositories/indexeddb-base.repository.ts` | IndexedDB 仓库基类 |
| `repositories/memory-base.repository.ts` | 内存仓库基类 |

#### `src/platform/` —— 平台层（插件、事件、扩展点）
| 文件 | 说明 |
|------|------|
| `events/event-bus.ts` | 事件总线，跨模块事件驱动通信 |
| `plugins/plugin-manager.ts` | 插件管理器，支持 4 种插件类型（命令/主题/数据源/UI 组件） |
| `plugins/plugin-loader.ts` | 插件加载器 |
| `plugins/plugin.interface.ts` | 插件接口定义 |
| `plugins/datasource-plugin.interface.ts` | 数据源插件接口 |
| `plugins/datasources/scp-wiki-datasource.plugin.ts` | SCP Wiki 数据源插件实现 |
| `extensions/extension-point.ts` | 扩展点注册与管理 |
| `capabilities/capability-manager.service.ts` | 能力管理器（运行时功能开关） |
| `performance/performance-monitor.service.ts` | 性能监控服务 |
| `performance/performance-optimizer.service.ts` | 性能优化服务 |
| `multi-tenant/tenant-manager.service.ts` | 多租户管理（预留） |

### 5.4 GUI 层（Vue 组件与交互）

#### `src/gui/desktop/` —— 桌面端界面
| 文件 | 说明 |
|------|------|
| `DesktopScreen.vue` | 桌面主屏幕（壁纸 + 桌面图标 + 右键菜单） |
| `PCLoginScreen.vue` | 桌面端登录界面 |

#### `src/gui/mobile/` —— 移动端界面
| 文件 | 说明 |
|------|------|
| `HomeScreen.vue` | iOS 风格主屏（应用图标网格） |
| `LoginScreen.vue` | 移动端登录界面 |
| `MobileApp.vue` | 移动端根布局（含 Dock、状态栏、手势区域） |

#### `src/gui/components/` —— 通用 GUI 组件
| 文件 | 说明 |
|------|------|
| `PCWindow.vue` | 桌面窗口组件（支持拖拽、缩放、最小化/最大化/关闭） |
| `MobileWindow.vue` | 移动端窗口/全屏页面组件 |
| `PCTaskbar.vue` | 桌面任务栏（开始按钮 + 打开窗口列表 + 系统托盘） |
| `PCStartMenu.vue` | 桌面开始菜单（工具列表 + 用户信息） |
| `MobileDock.vue` | 移动端底部 Dock |
| `MobileNavBar.vue` | 移动端顶部导航栏 |
| `MobileBottomSheet.vue` | 移动端底部抽屉面板 |
| `PCNotification.vue` | 桌面通知组件 |
| `SCPWindow.vue` | SCP 风格窗口壳（标题栏 + 内容区） |
| `SCPToolbar.vue` | 工具栏组件 |
| `WallpaperPicker.vue` | 壁纸选择器（预设 + 自定义上传） |
| `ui/SCPButton.vue` | SCP 风格按钮 |
| `ui/SCPInput.vue` | SCP 风格输入框 |
| `ui/SCPTabs.vue` | 标签页组件 |
| `ui/SCPContextMenu.vue` | 右键上下文菜单 |
| `ui/SCPStatusBar.vue` | 状态栏 |
| `ui/SCPBreadcrumbs.vue` | 面包屑导航 |
| `ui/SCPFileIcon.vue` | 文件图标组件 |
| `ui/GUIIcon.vue` | GUI 图标组件 |
| `ui/PCCContextMenu.vue` | 桌面右键菜单 |

#### `src/gui/tools/` —— 内置工具（桌面 + 移动双版本）

| 工具 | 桌面组件 | 移动组件 | 说明 |
|------|---------|---------|------|
| 终端 | `terminal/TerminalPanel.vue` | `terminal/MobileTerminal.vue` | xterm.js 终端，多标签支持 |
| 文件管理器 | `filemanager/FileManagerWindow.vue` | `filemanager/MobileFileManager.vue` | 虚拟文件系统 GUI，含图片/音频/视频/文本预览 |
| 代码编辑器 | `editor/EditorWindow.vue` | `editor/MobileEditor.vue` | CodeMirror 6，支持 CSS/HTML/JS/JSON/Markdown/Python/SQL 等 |
| 设置 | `settings/SettingsWindow.vue` | `settings/MobileSettings.vue` | 主题切换、壁纸管理、终端配置 |
| 聊天 | `chat/PCChatWindow.vue` | `chat/ChatWindow.vue` | 多房间实时聊天 |
| 仪表盘 | `dash/PCDashboard.vue` | `dash/MobileDash.vue` | 性能监控仪表盘 |
| 反馈 | `feedback/PCFeedbackWindow.vue` | `feedback/MobileFeedback.vue` | 反馈提交与浏览 |
| SCP 阅读器 | `docs/PCDocsWindow.vue` | `docs/MobileDocs.vue` | Docs 离线阅读器 |
| 通知中心 | `notification/PCNotificationCenter.vue` | `notification/MobileNotificationCenter.vue` | 系统通知管理 |
| 管理后台 | `admin/`（多页面） | - | 管理员后台（独立构建） |

**文件管理器预览组件**：
- `filemanager/ImageViewerModal.vue` — 图片查看器
- `filemanager/AudioPlayerModal.vue` — 音频播放器
- `filemanager/VideoPlayerModal.vue` — 视频播放器
- `filemanager/TextEditorModal.vue` — 文本预览编辑器
- `filemanager/DialogModal.vue` — 通用对话框

**管理后台目录 `src/gui/tools/admin/`**：
- `AdminLayout.vue` / `AdminSidebar.vue` / `AdminTopbar.vue` — 布局框架
- `pages/DashboardPage.vue` — 数据概览
- `pages/UserManagement.vue` — 用户管理
- `pages/ChatManagement.vue` — 聊天管理
- `pages/FeedbackManagement.vue` — 反馈管理
- `pages/ContentManagement.vue` — 内容管理
- `pages/AuditLog.vue` — 审计日志
- `pages/SystemSettings.vue` — 系统设置
- `services/adminApi.ts` — 管理后台 API 封装
- `stores/adminStore.ts` — 管理后台 Pinia Store
- `composables/useToast.ts` — Toast 通知组合式函数
- `components/` — 通用后台组件（DataTable、Pagination、Modal、StatCard、TrendChart 等）

#### `src/gui/composables/` —— GUI 组合式函数
| 文件 | 说明 |
|------|------|
| `useDraggable.ts` | 窗口拖拽逻辑（含 5px 阈值） |
| `useResizable.ts` | 窗口 8 方向缩放逻辑 |
| `useZIndex.ts` | 窗口层级（z-index）自动管理 |
| `useKeyboardShortcuts.ts` | 全局键盘快捷键（Ctrl+Shift+T 打开终端等） |
| `useTheme.ts` | 主题切换（8 种强调色 + CSS 变量注入） |
| `useMobile.ts` | 移动端检测与适配 |
| `useHammer.ts` | Hammer.js 手势封装 |
| `useSwipeGesture.ts` | 滑动手势封装 |
| `useChatWebSocket.ts` | 聊天 WebSocket（或轮询）连接管理 |
| `useDashboardData.ts` | 仪表盘数据获取与展示 |
| `useDocsReader.ts` | Docs 阅读器数据获取、缓存、阅读进度管理 |
| `useTerminalEmulator.ts` | xterm.js 终端实例生命周期管理 |
| `useNotification.ts` | 通知系统管理 |
| `useI18n.ts` | 国际化（预留） |

#### `src/gui/stores/` —— GUI 专用 Pinia Store
| 文件 | 说明 |
|------|------|
| `windowManager.ts` | 窗口管理 Store（打开/关闭/聚焦/最小化/最大化/层级） |
| `fileManager.ts` | 文件管理器状态（当前目录、选中文件等） |
| `terminalPanel.ts` | 终端面板状态 |
| `textEditor.ts` | 文本编辑器状态 |
| `themeStore.ts` | 主题状态（当前主题、壁纸） |

#### `src/gui/registry/` —— 工具注册表
| 文件 | 说明 |
|------|------|
| `ToolRegistry.ts` | 工具注册表实现，维护工具元数据与组件映射 |
| `registerTools.ts` | 注册所有内置工具到注册表 |

#### `src/gui/themes/` —— 主题定义
| 文件 | 说明 |
|------|------|
| `index.ts` | 8 种强调色主题定义（红/橙/黄/绿/蓝/紫/粉/灰），SCP 终端配色同步 |

#### `src/gui/design-tokens.ts` —— 设计令牌
统一 CSS 变量体系（iOS 暗色模式风格），通过 `injectGUITokens()` 注入全局。

#### `src/gui/events/EventBus.ts` —— 事件总线实现

### 5.5 其他核心目录

#### `src/commands/` —— 终端命令处理
| 文件 | 说明 |
|------|------|
| `index.ts` | 命令注册与分发中心，包含 40+ 条命令的映射 |
| `penetration.ts` | 渗透测试相关命令（独立模块） |

#### `src/components/` —— 通用组件
| 文件 | 说明 |
|------|------|
| `SCPTerminal.vue` | 终端主组件（嵌入 xterm.js） |
| `TabBar.vue` | 终端标签栏 |
| `Sidebar.vue` | 侧边栏 |
| `PerformanceDashboard.vue` | 性能仪表盘组件 |
| `DocReaderPanel.vue` | 文档阅读器面板 |
| `TalesListPanel.vue` | 故事列表面板 |
| `dashboard/` | 仪表盘子组件（Header、Footer、MetricCard、IssueList、PerformanceScore、RecommendationList） |

#### `src/composables/` —— 应用级组合式函数
| 文件 | 说明 |
|------|------|
| `useTerminal.ts` | 终端核心逻辑（命令解析、执行管道） |
| `useCommandHistory.ts` | 命令历史管理（内存 + IndexedDB） |
| `useTabsRefactored.ts` | 标签页管理（重构版） |
| `useTerminalRefactored.ts` | 终端管理（重构版） |

#### `src/stores/` —— Pinia Store（应用级）
| 文件 | 说明 |
|------|------|
| `terminal.ts` | 终端全局状态（字体大小、行高、回滚行数等） |
| `tabs.ts` | 标签页全局状态 |
| `command.ts` | 命令执行状态 |
| `scraper.ts` | SCP 数据获取状态 |
| `authStore.ts` | 用户认证状态（JWT、昵称、UUID） |
| `system.ts` | 系统状态（启动/关机、性能指标） |
| `notificationStore.ts` | 通知状态 |

#### `src/utils/` —— 工具函数
| 文件 | 说明 |
|------|------|
| `filesystem.ts` | 虚拟文件系统实现（Linux 风格目录结构、权限检查、CRUD、搜索、grep） |
| `terminal.ts` | 终端输出格式化、回车换行处理、CJK 字符宽度计算 |
| `commandAutocomplete.ts` | 命令自动补全（模糊匹配、子序列匹配、循环选择） |
| `commandFormatter.ts` | 命令格式化与着色 |
| `indexedDB.ts` | IndexedDB 封装（5 个 Object Store：tabs、commandHistory、wallpapers、settings、docsCache） |
| `scraper.ts` | SCP 数据抓取客户端封装 |
| `authFetch.ts` | 带 JWT 认证的 fetch 封装 |
| `jwt.ts` | JWT 生成与验证工具 |
| `wallpaperService.ts` | 壁纸上传、缩略图生成、IndexedDB 持久化 |
| `imageProxy.ts` | 图片代理（处理跨域） |
| `errorHandler.ts` | 全局错误处理与分类 |
| `logger.ts` | 日志工具 |
| `terminalResponsive.ts` | 终端响应式布局计算 |
| `infoQueryLogs.ts` | info 命令查询日志 |
| `networkTestLogs.ts` | network 命令测试日志 |
| `securityCheckLogs.ts` | check 命令安全检查日志 |

#### `src/types/` —— 类型定义
| 文件 | 说明 |
|------|------|
| `command.ts` | 命令相关类型 |
| `terminal.ts` | 终端相关类型 |
| `scp.ts` | SCP 数据类型 |
| `scraper.ts` | 爬虫相关类型 |
| `error.ts` | 错误类型 |
| `global.d.ts` | 全局类型声明（如 `window.__USER_ID__`） |
| `hammerjs.d.ts` | Hammer.js 类型补充 |

#### `src/constants/` —— 常量定义
| 文件 | 说明 |
|------|------|
| `commands.ts` | 所有可用命令的定义与元数据 |
| `theme.ts` | 主题常量 |
| `scraperConfig.ts` | 爬虫配置常量（重试次数、超时等） |
| `bootLogs.ts` | 系统启动日志文本（SCP 风格） |

#### `src/config/` —— 配置管理
| 文件 | 说明 |
|------|------|
| `index.ts` | 运行时配置聚合（从 import.meta.env 读取环境变量并设置默认值） |

#### `src/shared/` —— 共享配置
| 文件 | 说明 |
|------|------|
| `configs/config-manager.ts` | 配置管理器（支持多环境） |
| `configs/defaults.ts` | 默认配置值 |

#### `src/penetration/` —— 渗透测试模拟模块
| 文件 | 说明 |
|------|------|
| `engine.ts` | 渗透测试引擎核心 |
| `effects.ts` | 视觉效果模拟 |
| `output.ts` | 输出格式化 |
| `randomizer.ts` | 随机化工具 |
| `types.ts` | 渗透测试类型定义 |
| `scenarios/` | 各种渗透场景（recon、vulnscan、exploit、privesc、exfil、persist、scp-target） |
| `templates/` | 渗透工具模板（nmap、nikto、sqlmap、msfconsole、mimikatz、misc） |

### 5.6 静态资源 `packages/app/public/`

| 文件 | 说明 |
|------|------|
| `manifest.json` | PWA Web App Manifest |
| `sw.js` / `sw.ts` | Service Worker（离线缓存策略） |
| `offline.html` | 离线 fallback 页面 |
| `favicon.ico` / `favicon.svg` / `favicon-*.png` | 多尺寸网站图标 |
| `apple-touch-icon.png` | iOS 主屏图标 |
| `android-chrome-*.png` | Android 图标 |
| `browserconfig.xml` | IE/Edge tile 配置 |
| `robots.txt` | 搜索引擎爬虫规则 |
| `sitemap.xml` | 站点地图 |

---

## 六、桌面端包详解：`packages/desktop`

Tauri 2 桌面客户端，将前端 Web 应用打包为原生桌面应用。

### 6.1 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 桌面端 package.json，仅依赖 `@tauri-apps/cli` |
| `tauri.conf.json` | **Tauri 核心配置**：窗口尺寸（默认 1200x800，最小 800x600）、CSP 安全策略、打包目标（deb/appimage/dmg/msi/nsis）、图标路径 |
| `Cargo.toml` | Rust 项目配置 |
| `Cargo.lock` | Rust 依赖锁定 |
| `build.rs` | Rust 构建脚本 |

### 6.2 Rust 源码

| 文件 | 说明 |
|------|------|
| `src/main.rs` | **Rust 程序入口**：初始化 Tauri 运行时，加载前端 dist 产物，启动原生窗口 |
| `src/lib.rs` | Rust 库入口（命令/插件注册预留） |

### 6.3 资源

| 文件 | 说明 |
|------|------|
| `icons/` | 多平台应用图标（PNG/ICO/ICNS，尺寸从 32x32 到 512x512） |
| `capabilities/default.json` | Tauri 能力声明（权限配置） |

### 6.4 构建行为

- `beforeDevCommand`：运行 `pnpm run dev`（启动前端开发服务器）
- `beforeBuildCommand`：运行 `pnpm run build:production`（构建前端产物到 `dist/`）
- `frontendDist`：指向 `../../dist`（使用前端构建产物）

---

## 七、后端包详解：`packages/worker`

Cloudflare Workers 后端服务，负责 SCP 数据爬取、聊天、反馈、用户管理、Docs 索引查询等。

### 7.1 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | Worker 依赖（cheerio、linkedom、defuddle）和脚本（dev/deploy/tail/test） |
| `wrangler.toml` | **Cloudflare Wrangler 核心配置**：Worker 名称、D1 数据库绑定（SCP_DB + SCP_READER_DB）、KV 命名空间（SCP_CACHE）、Durable Objects（ChatRoomDO）、定时任务（每 10 分钟广播聊天消息）、生产/开发环境切换 |
| `tsconfig.json` / `tsconfig.ci.json` | TypeScript 配置 |
| `vitest.config.ts` | Vitest 测试配置 |

### 7.2 入口与路由

| 文件 | 说明 |
|------|------|
| `index.ts` | **Worker 主入口**：导出 `SCPScraper` 类和 `ChatRoomDO`，实例化解析器/清洗器/限流器/CORS 管理器，包含所有业务方法（爬取 SCP、搜索、聊天、反馈、统计、Docs 查询等） |
| `router.ts` | 自定义轻量级路由路由器，支持 GET/POST/PUT/DELETE、参数化路由、/api/admin/* 别名映射 |
| `routes.ts` | 路由注册中心，将所有 API 端点绑定到 Router |

### 7.3 API 路由模块 `api/`

| 文件 | 说明 |
|------|------|
| `admin.ts` | 管理后台聚合路由 |
| `admin-auth.ts` | 管理员认证路由（登录/验证） |
| `admin-logs.ts` | 审计日志路由 |
| `docs.ts` | Docs（SCP 阅读器）API：条目列表、单条元数据、正文获取（KV → GitHub Raw 回退）、故事列表、Hub 列表 |
| `feedback.ts` | 反馈系统路由（提交/列表/点赞/投票/评论/分类统计） |
| `user.ts` | 用户路由（注册/查询/昵称检查） |
| `notification.ts` | 通知路由 |

### 7.4 HTML 解析器 `parsers/`

| 文件 | 说明 |
|------|------|
| `htmlParser.ts` | HTML 结构解析、文本提取、HTML 验证 |
| `sectionParser.ts` | 章节分割（收容程序 / 描述 / 附录） |
| `classParser.ts` | SCP 项目等级解析与验证（Safe/Euclid/Keter/Thaumiel/Neutralized/Pending/Unknown） |

### 7.5 安全模块 `security/`

| 文件 | 说明 |
|------|------|
| `rateLimiter.ts` | 速率限制实现（IP 级 60 次/分钟、用户级 10 条消息/分钟），支持内存和 KV 两种后端 |
| `cors.ts` | CORS 策略管理 |
| `auth.ts` | JWT 认证中间件 |
| `admin-auth.ts` | 管理员认证逻辑 |

### 7.6 错误处理 `errors/`

| 文件 | 说明 |
|------|------|
| `scraperError.ts` | 爬虫错误类（网络/超时/解析/验证错误） |
| `retryStrategy.ts` | 重试策略（指数退避） |

### 7.7 工具函数 `utils/`

| 文件 | 说明 |
|------|------|
| `htmlCleaner.ts` | HTML 清理（移除广告、导航、版权信息） |
| `htmlSanitizer.ts` | HTML 消毒（防 XSS） |
| `htmlUtils.ts` | HTML 工具函数 |
| `paragraphFilter.ts` | 段落过滤（移除短文本、符号行） |
| `browserHeaders.ts` | 模拟浏览器请求头 |
| `logger.ts` | Worker 端日志工具 |
| `performanceMonitor.ts` | 性能监控计时器 |
| `regexCache.ts` | 正则表达式缓存 |

### 7.8 Durable Objects `durableObjects/`

| 文件 | 说明 |
|------|------|
| `ChatRoomDO.ts` | **ChatRoom Durable Object**：聊天室状态持久化，支持 WebSocket 实时消息广播 |

### 7.9 共享模块 `shared/`

| 文件 | 说明 |
|------|------|
| `types.ts` | Worker 全站类型定义（Env、SCPWikiData、ChatMessage、ChatRoom 等） |
| `errors.ts` | 统一错误响应工厂（validationError、notFoundError、rateLimitedError 等） |
| `config.ts` | Worker 运行时配置（超时、重试、缓存时长） |

### 7.10 数据库迁移 `migrations/`

| 文件 | 说明 |
|------|------|
| `0001_init.sql` | 初始化：scp_index 表 |
| `0002_fill_data.sql` | 填充基础数据 |
| `0003_quick_fill.sql` | 快速填充 |
| `0004_chat_messages.sql` | 聊天消息表 |
| `0005_chat_rooms.sql` | 聊天室表 |
| `0006_feedbacks.sql` | 反馈表 |
| `0007_users.sql` | 用户表 |
| `0008_feedback_votes_comments.sql` | 反馈投票与评论表 |
| `0009_scp_reader_tables.sql` | **Docs 索引表**：scp_items、scp_tales、scp_goi、scp_hubs、scp_search（FTS5 全文搜索） |
| `0010_user_settings.sql` | 用户设置表 |
| `0011_notifications.sql` | 通知表 |
| `0012_admin_system.sql` | 管理员系统表 |
| `schema.sql` | 完整数据库 Schema |

### 7.11 脚本 `scripts/`

| 文件 | 说明 |
|------|------|
| `migrate-scp-data.ts` | 将 scp-api 仓库的 JSON 数据迁移到 D1 数据库 |
| `preload-kv-content.ts` | 预加载 SCP 正文到 Cloudflare KV（每日 900 条限速） |
| `fillDatabase.ts` | 数据库填充工具 |
| `quickFill.ts` | 快速填充工具 |
| `bulkFillDatabase.ts` | 批量填充工具 |
| `scrapeAllScps.ts` | 全量 SCP 爬取脚本 |

### 7.12 测试 `__tests__/` / `benchmarks/`

| 文件 | 说明 |
|------|------|
| `classParser.test.ts` | 项目等级解析测试 |
| `htmlParser.test.ts` | HTML 解析测试 |
| `sectionParser.test.ts` | 章节分割测试 |
| `performance.test.ts` | 性能基准测试 |

---

## 八、Docs（SCP 离线阅读器）数据流

```
用户打开 Docs
    │
    ▼
前端调用 /docs/items（D1 索引查询）
    │
    ▼
用户点击某篇 SCP
    │
    ├── 优先查询 Cloudflare KV（<50ms）
    │       └── 命中 → 直接返回正文
    │
    └── KV 未命中
            └── 回退到 GitHub Raw API
                    └── 获取成功后写入 KV 缓存
                            └── 返回正文
    │
    ▼
前端将正文存入 IndexedDB（离线缓存）
    │
    ▼
断网后再次阅读 → 从 IndexedDB 读取（完全离线）
```

**数据库规模**：
- SCP 条目：9526+
- 故事：6487 篇
- GOI 条目：711
- Hub：126

---

## 九、关键业务流程

### 9.1 首次启动流程
1. 浏览器加载 `index.html` → `main.ts` 创建 Vue 应用
2. 初始化 Pinia → 终端 Store 检测设备类型（桌面/移动）
3. 用户进入登录界面 → 输入昵称 → 前端生成 UUID → 调用 Worker `/api/user/register`
4. 登录成功 → 渲染桌面/移动端主界面
5. 终端显示启动日志（`bootLogs.ts` 中的 SCP 风格文本）
6. 用户输入 `start` 命令完成系统初始化

### 9.2 终端命令执行流程
1. 用户在 xterm.js 输入命令 → `SCPTerminal.vue` 捕获输入
2. `useTerminal.ts` 解析命令字符串
3. `commands/index.ts` 查找对应命令处理器
4. 命令分类处理：
   - **SCP 查询** → 调用 `scraper.ts` → HTTP 请求 Worker `/scrape` 或 `/search`
   - **文件系统** → 调用 `filesystem.ts`（纯前端虚拟文件系统）
   - **系统命令** → 直接操作前端状态（Store）
5. 结果格式化后通过 xterm.js API 输出到终端

### 9.3 窗口管理流程（桌面端）
1. 用户双击桌面图标或点击开始菜单 → `ToolRegistry` 查找工具定义
2. `windowManager.ts` Store 创建新窗口状态（位置、尺寸、标题、内容组件）
3. `PCWindow.vue` 渲染窗口，注入 `useDraggable` + `useResizable` + `useZIndex`
4. 窗口拖拽/缩放时更新 Store 状态 → 响应式更新视图
5. 任务栏 `PCTaskbar.vue` 订阅窗口列表 → 显示所有打开窗口

### 9.4 聊天消息流程
1. 用户输入消息 → 前端调用 Worker `POST /chat/send`
2. Worker `index.ts` 检查频率限制（D1 查询最近 1 分钟消息数）
3. 通过限制 → 插入 D1 `chat_messages` 表
4. 更新 `chat_rooms` 消息计数
5. 定时任务（每 10 分钟 Cron Trigger）调用 `broadcastNewMessages()` 标记未广播消息
6. 或 Durable Object `ChatRoomDO` 维护 WebSocket 实时推送

---

## 十、CI/CD 与 GitHub Actions

目录 `.github/workflows/` 包含自动化工作流（具体内容需查看 workflow 文件）：

- **测试工作流**：运行 Vitest 单元测试（app + worker）
- **构建工作流**：构建前端产物、类型检查、Lint 检查
- **Tauri 构建工作流**：多平台桌面端构建（Linux/macOS/Windows）
- **安全扫描**：依赖漏洞检测
- **发布工作流**：release-please 自动发版

---

## 十一、Git 钩子 `.githooks/`

| 文件 | 说明 |
|------|------|
| `pre-commit` / `pre-commit.ps1` | 提交前自动运行 ESLint 和 Prettier |
| `post-checkout` | 切换分支后钩子 |
| `post-commit` | 提交后钩子 |
| `post-merge` | 合并后钩子 |
| `pre-push` | 推送前钩子 |

---

## 十二、环境变量完整清单

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `VITE_WORKER_API_URL` | `https://api.woodcat.online` | Worker API 地址 |
| `VITE_API_TIMEOUT` | `15000` | API 超时（ms） |
| `VITE_CACHE_DURATION` | `1800000` | 缓存有效期（30 分钟） |
| `VITE_CACHE_MAX_SIZE` | `100` | 最大缓存条目数 |
| `VITE_SCRAPER_RETRY_ATTEMPTS` | `3` | 爬虫重试次数 |
| `VITE_SCRAPER_RETRY_DELAY` | `1000` | 爬虫重试延迟（ms） |
| `VITE_TERMINAL_SCROLLBACK` | `1000` | 终端回滚行数 |
| `VITE_TERMINAL_TAB_STOP_WIDTH` | `4` | Tab 宽度 |
| `VITE_APP_VERSION` | `0.1.0` | 应用版本 |
| `VITE_APP_NAME` | `SCP-OS` | 应用名称 |
| `VITE_FAST_BOOT` | `false` | 快速启动（跳过动画） |
| `VITE_JWT_SECRET` | - | JWT 签名密钥（需配置） |
| `VITE_DOWNLOAD_MAX_FILE_SIZE` | `524288000` | 最大下载文件大小（500MB） |
| `VITE_DOWNLOAD_DEFAULT_RATE_LIMIT` | `0` | 下载限速（KB/s，0=不限） |
| `VITE_DOWNLOAD_STREAM_BUFFER_SIZE` | `65536` | 下载流缓冲区 |
| `VITE_DOWNLOAD_HISTORY_MAX_SIZE` | `200` | 下载历史最大条数 |

---

## 十三、代码分割策略（Vite）

| Chunk 名称 | 包含内容 | 说明 |
|-----------|---------|------|
| `vue-vendor` | Vue 核心库 | 框架基础 |
| `terminal` | xterm.js + 相关 | 终端模拟器 |
| `network` | axios | HTTP 客户端 |
| `gestures` | Hammer.js | 手势库 |
| `editor` | CodeMirror 6 全家桶 | 代码编辑器 |

---

## 十四、IndexedDB 结构（前端持久化）

数据库名：`scp-os-db`

| Object Store | 用途 |
|-------------|------|
| `tabs` | 终端标签页状态持久化 |
| `commandHistory` | 命令历史（跨会话保留） |
| `wallpapers` | 自定义壁纸图片数据 |
| `settings` | 用户设置（主题、终端配置等） |
| `docsCache` | Docs 阅读器正文缓存（离线阅读） |

---

> 本文档由项目代码自动生成，涵盖所有主要目录和关键文件的作用说明。
