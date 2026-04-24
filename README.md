<p align="center">
  <img src="packages/app/public/android-chrome-192x192.png" alt="SCP-OS Logo" width="120" height="120">
</p>

<h1 align="center">SCP-OS</h1>

<p align="center">
  <strong>SCP 基金会模拟操作系统终端</strong>
</p>

<p align="center">
  <a href="#安装"><img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green" alt="Node.js"></a>
  <a href="#安装"><img src="https://img.shields.io/badge/pnpm-%3E%3D8.0.0-F69220" alt="pnpm"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6" alt="TypeScript"></a>
  <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.5-4FC08D" alt="Vue"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-2.10-FFC131" alt="Tauri"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#安装">安装</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#项目架构">架构</a> •
  <a href="#终端命令">命令</a> •
  <a href="docs/API.md">API</a> •
  <a href="docs/CONTRIBUTING.md">贡献</a> •
  <a href="docs/FAQ.md">FAQ</a>
</p>

---

## 项目简介

SCP-OS 是一个以 **SCP 基金会**为主题的模拟操作系统，将 SCP 维基的内容以沉浸式终端体验呈现。用户可以通过命令行界面查询 SCP 对象信息、浏览收容程序、管理虚拟文件系统，并享受桌面/移动双端适配的完整 GUI 体验。

项目采用 **Monorepo** 架构，包含三个核心包：

| 包 | 说明 | 技术栈 |
|---|------|--------|
| `@scp-os/app` | 前端 Web 应用 | Vue 3 + TypeScript + Pinia + Tailwind CSS |
| `@scp-os/desktop` | 桌面客户端 | Tauri 2 + Rust |
| `scp-scraper-worker` | 后端 API 服务 | Cloudflare Workers + D1 + KV |

## 功能特性

### 🖥️ 模拟操作系统

- **终端模拟器**：支持 40+ 条命令，包含文件系统操作、SCP 查询、系统管理等
- **虚拟文件系统**：Linux 风格目录结构，支持权限检查、文件 CRUD、搜索与 grep
- **窗口管理器**：可拖拽、可调整大小、可最小化/最大化/关闭的窗口系统
- **多标签页**：终端多标签管理，支持创建/切换/关闭/锁定/重命名

### 🔍 SCP 数据查询

- **实时爬取**：从 SCP Wiki（英文/中文分部）实时抓取 SCP 对象数据
- **智能搜索**：支持关键词搜索、编号查询、项目等级筛选
- **数据缓存**：KV 缓存层 + 内存缓存层，减少重复请求
- **CJK 优化**：精确计算中日韩字符宽度，终端输出自动换行

### 💬 社交功能

- **实时聊天**：多房间聊天系统，支持昵称、频率限制
- **反馈系统**：提交反馈、点赞/踩、评论、分类筛选

### 📱 双端适配

- **桌面模式**：类 Windows 桌面环境，任务栏 + 开始菜单 + 右键菜单 + 桌面图标
- **移动模式**：类 iOS 主屏，手势操作 + 底部 Dock + 触觉反馈
- **自适应布局**：响应式字体大小、安全区域适配、横竖屏切换

### 🎨 主题与个性化

- **8 种强调色主题**：一键切换，终端主题同步
- **壁纸系统**：自定义壁纸上传、缩略图生成、IndexedDB 持久化
- **设计令牌**：统一的 CSS 变量体系，iOS 暗色模式风格

### 🔌 扩展性

- **插件系统**：4 种插件类型（命令/主题/数据源/UI 组件），完整生命周期管理
- **工具注册表**：模块化工具注册，新增工具零修改核心代码
- **DI 容器**：支持 Singleton/Scoped/Transient 三种生命周期 + 循环依赖检测
- **事件总线**：跨模块事件驱动通信

### 🔒 安全

- **CSP 策略**：Tauri 桌面端严格内容安全策略
- **速率限制**：API 请求频率限制 + 聊天消息频率限制
- **HTML 清洗**：服务端 HTML 消毒 + XSS 防护
- **本地优先**：IndexedDB 持久化，离线可用

## 安装

### 前置要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0（推荐使用 `corepack enable` 启用）
- **Rust** stable（仅桌面端构建需要）
- **Cloudflare Workers** 账户（仅 Worker 部署需要）

### 克隆项目

```bash
git clone https://github.com/your-username/scp-os.git
cd scp-os
```

### 安装依赖

```bash
pnpm install
```

### 环境配置

```bash
cp .env.example .env.development
```

编辑 `.env.development` 配置你的环境变量，参考 [.env.example](.env.example)：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_WORKER_API_URL` | Worker API 地址 | `https://api.woodcat.online` |
| `VITE_API_TIMEOUT` | API 超时时间（ms） | `15000` |
| `VITE_CACHE_DURATION` | 缓存有效期（ms） | `1800000`（30分钟） |
| `VITE_CACHE_MAX_SIZE` | 最大缓存条目数 | `100` |
| `VITE_SCRAPER_RETRY_ATTEMPTS` | 爬虫重试次数 | `3` |
| `VITE_SCRAPER_RETRY_DELAY` | 爬虫重试延迟（ms） | `1000` |
| `VITE_TERMINAL_SCROLLBACK` | 终端回滚行数 | `1000` |
| `VITE_TERMINAL_TAB_STOP_WIDTH` | Tab 宽度 | `4` |
| `VITE_APP_VERSION` | 应用版本 | `0.1.0` |
| `VITE_APP_NAME` | 应用名称 | `SCP Foundation Terminal` |

## 快速开始

### Web 开发模式

```bash
# 开发模式（development 环境）
pnpm dev:development

# 开发模式（production 环境）
pnpm dev:production
```

### 构建

```bash
# 构建
pnpm build

# 按环境构建
pnpm build:development
pnpm build:production
```

### 桌面端开发

```bash
# Tauri 开发模式
pnpm desktop:dev

# Tauri 构建
pnpm desktop:build
```

### Worker 开发

```bash
# Worker 本地开发
pnpm worker:dev

# Worker 部署
pnpm worker:deploy

# Worker 日志查看
pnpm worker:tail
```

### 测试

```bash
# 运行测试
pnpm test

# 测试 UI
pnpm test:ui

# 测试覆盖率
pnpm test:coverage
```

### 代码质量

```bash
# 类型检查
pnpm typecheck

# ESLint 检查
pnpm lint:check

# ESLint 自动修复
pnpm lint

# Prettier 格式化
pnpm format
```

## 项目架构

### Monorepo 结构

```
scp-os/
├── packages/
│   ├── app/                    # 前端 Web 应用
│   │   ├── src/
│   │   │   ├── application/    # 应用层（控制器、服务）
│   │   │   ├── commands/       # 命令处理
│   │   │   ├── components/     # 通用组件
│   │   │   ├── composables/    # 组合式函数
│   │   │   ├── config/         # 配置管理
│   │   │   ├── constants/      # 常量定义
│   │   │   ├── core/           # DI 容器
│   │   │   ├── domain/         # 领域层（DDD）
│   │   │   ├── gui/            # GUI 层
│   │   │   │   ├── components/ # GUI 组件
│   │   │   │   ├── composables/# GUI 组合式函数
│   │   │   │   ├── desktop/    # 桌面端界面
│   │   │   │   ├── mobile/     # 移动端界面
│   │   │   │   ├── registry/   # 工具注册表
│   │   │   │   ├── stores/     # GUI Store
│   │   │   │   ├── themes/     # 主题定义
│   │   │   │   └── tools/      # 工具组件
│   │   │   ├── infrastructure/ # 基础设施层
│   │   │   ├── platform/       # 平台层（插件、事件、扩展）
│   │   │   ├── shared/         # 共享配置
│   │   │   ├── stores/         # Pinia Store
│   │   │   ├── types/          # 类型定义
│   │   │   └── utils/          # 工具函数
│   │   └── public/             # 静态资源 + PWA
│   ├── desktop/                # Tauri 桌面客户端
│   │   ├── src/                # Rust 源码
│   │   └── icons/              # 应用图标
│   └── worker/                 # Cloudflare Worker
│       ├── api/                # API 路由
│       ├── errors/             # 错误处理
│       ├── migrations/         # D1 数据库迁移
│       ├── parsers/            # HTML 解析器
│       ├── security/           # 安全（CORS、限流）
│       └── utils/              # 工具函数
├── .github/workflows/          # CI/CD
└── pnpm-workspace.yaml         # 工作区配置
```

### 分层架构

项目遵循 **DDD（领域驱动设计）** 分层思想：

```
┌─────────────────────────────────────┐
│            GUI 层                    │  Vue 组件 + Composables
├─────────────────────────────────────┤
│          应用层                      │  控制器 + 应用服务
├─────────────────────────────────────┤
│          领域层                      │  实体 + 值对象 + 仓库接口
├─────────────────────────────────────┤
│         基础设施层                   │  仓库实现 + HTTP 客户端
├─────────────────────────────────────┤
│          平台层                      │  插件 + 事件 + 扩展点
├─────────────────────────────────────┤
│          核心层                      │  DI 容器 + 类型
└─────────────────────────────────────┘
```

## 终端命令

### 系统命令

| 命令 | 说明 | 用法 |
|------|------|------|
| `start` | 首次启动系统初始化 | `start` |
| `restart` | 重启系统 | `restart` |
| `shutdown` | 关闭系统 | `shutdown now` |
| `status` | 显示系统状态和收容统计 | `status` |
| `version` | 显示系统版本 | `version` |
| `about` | 显示系统信息 | `about` |
| `help` | 显示可用命令 | `help` |
| `clear` / `cls` | 清屏 | `clear` |
| `logout` | 安全登出 | `logout` |

### SCP 查询命令

| 命令 | 说明 | 用法 |
|------|------|------|
| `info` | 查询 SCP 详细信息 | `info <number>` / `info CN-<number>` |
| `scp-list` | 列出已知 SCP 对象 | `scp-list` |
| `search` | 搜索 SCP 数据库 | `search <keyword>` |
| `containment` | 显示收容协议分类 | `containment` |
| `protocol` | 显示安全协议和特遣队 | `protocol` |
| `emergency` | 显示紧急联系信息 | `emergency` |

### 文件系统命令

| 命令 | 说明 | 用法 |
|------|------|------|
| `ls` | 列出目录内容 | `ls [path]` |
| `cd` | 切换目录 | `cd <path>` |
| `pwd` | 显示当前目录 | `pwd` |
| `mkdir` | 创建目录 | `mkdir <directory>` |
| `rm` | 删除文件或目录 | `rm <file\|directory>` |
| `cat` | 显示文件内容 | `cat <file>` |
| `echo` | 输出文本或写入文件 | `echo <text> [> <file>]` |
| `touch` | 创建空文件 | `touch <file>` |
| `cp` | 复制文件或目录 | `cp <source> <destination>` |
| `mv` | 移动或重命名 | `mv <source> <destination>` |
| `find` | 查找文件 | `find <path> -name <pattern>` |
| `grep` | 搜索文件内容 | `grep <pattern> <file>` |
| `chmod` | 修改文件权限 | `chmod <permissions> <file>` |
| `chown` | 修改文件所有者 | `chown <owner>:<group> <file>` |

### 系统诊断命令

| 命令 | 说明 | 用法 |
|------|------|------|
| `network` | 测试与基金会 Wiki 的网络连接 | `network` |
| `performance` | 打开性能监控面板 | `performance` |
| `check` | 运行系统安全检查 | `check` |
| `uname` | 显示系统信息 | `uname [-a]` |
| `df` | 显示磁盘空间 | `df` |
| `free` | 显示内存使用 | `free` |
| `uptime` | 显示系统运行时间 | `uptime` |

### 键盘快捷键

| 快捷键 | 说明 |
|--------|------|
| `Ctrl+Shift+T` | 打开新终端窗口 |
| `Ctrl+W` | 关闭当前窗口 |
| `Ctrl+Shift+P` | 切换性能面板 |
| `F11` | 切换全屏 |
| `↑` / `↓` | 浏览命令历史 |
| `Tab` | 命令自动补全 |

## GUI 工具

系统内置 7 个工具模块，每个工具均提供桌面端和移动端双版本：

| 工具 | 桌面组件 | 移动组件 | 说明 |
|------|---------|---------|------|
| 🖥️ Terminal | TerminalPanel | MobileTerminal | 终端模拟器 |
| 📁 FileManager | FileManagerWindow | MobileFileManager | 文件管理器（含图片/音频/视频/文本预览） |
| 📝 Editor | EditorWindow | MobileEditor | 代码编辑器（CodeMirror，多语言高亮） |
| ⚙️ Settings | SettingsWindow | MobileSettings | 系统设置 |
| 💬 Chat | PCChatWindow | ChatWindow | 实时聊天 |
| 📊 Dashboard | PCDashboard | MobileDash | 性能仪表盘 |
| 📮 Feedback | PCFeedbackWindow | MobileFeedback | 反馈系统 |

## 技术栈

### 前端

- **框架**：Vue 3.5 + TypeScript 5.9
- **构建**：Vite 6 + esbuild
- **状态管理**：Pinia 3
- **样式**：Tailwind CSS 4 + CSS 自定义属性
- **终端**：xterm.js 5
- **编辑器**：CodeMirror 6（CSS/HTML/JS/JSON/Markdown/Python/SQL）
- **手势**：Hammer.js 2
- **持久化**：IndexedDB（5 个 Object Store）
- **PWA**：Service Worker + Web App Manifest

### 桌面端

- **框架**：Tauri 2
- **语言**：Rust (stable)
- **安全**：严格 CSP 策略

### 后端

- **运行时**：Cloudflare Workers
- **数据库**：Cloudflare D1（SQLite）
- **缓存**：Cloudflare KV
- **解析**：cheerio + linkedom + Defuddle
- **安全**：CORS + 速率限制 + HTML 消毒

### 工程化

- **包管理**：pnpm 10（Monorepo）
- **测试**：Vitest 4 + @vue/test-utils
- **代码质量**：ESLint 9 + Prettier 3 + vue-tsc
- **CI/CD**：GitHub Actions（测试 + 构建 + 安全扫描 + Tauri 构建）

## 许可协议

- **代码**：[MIT License](LICENSE)
- **SCP 基金会内容**：[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

本项目仅供教育和娱乐目的使用。SCP 基金会内容的使用遵循知识共享署名-相同方式共享 3.0 许可协议。
