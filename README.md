<p align="center">
  <img src="packages/app/public/android-chrome-192x192.png" alt="SCP-OS Logo" width="120" height="120">
</p>

<h1 align="center">SCP-OS</h1>

<p align="center">
  <strong>SCP Foundation-Themed Web Operating System</strong>
</p>

<p align="center">
  A fully-featured browser-based desktop environment with an SCP Foundation theme. Built-in command-line terminal, file manager, code editor, real-time chat, performance dashboard, feedback system, <strong>SCP offline reader (Docs)</strong>, and more. Supports seamless desktop and mobile responsive adaptation. Powered by Cloudflare Workers serverless architecture with global edge acceleration.
</p>

<p align="center">
  <a href="#installation"><img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green" alt="Node.js"></a>
  <a href="#installation"><img src="https://img.shields.io/badge/pnpm-%3E%3D8.0.0-F69220" alt="pnpm"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6" alt="TypeScript"></a>
  <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.5-4FC08D" alt="Vue"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-2.10-FFC131" alt="Tauri"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>
  <a href="https://github.com/LemonStudio-hub/scp-os/stargazers"><img src="https://img.shields.io/github/stars/LemonStudio-hub/scp-os" alt="Stars"></a>
  <a href="https://github.com/LemonStudio-hub/scp-os/issues"><img src="https://img.shields.io/github/issues/LemonStudio-hub/scp-os" alt="Issues"></a>
  <a href="https://github.com/LemonStudio-hub/scp-os/pulls"><img src="https://img.shields.io/github/issues-pr/LemonStudio-hub/scp-os" alt="Pull Requests"></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#project-architecture">Architecture</a> •
  <a href="#terminal-commands">Commands</a> •
  <a href="docs/API.md">API</a> •
  <a href="CONTRIBUTING.md">Contributing</a> •
  <a href="docs/FAQ.md">FAQ</a>
</p>

---

## 📖 Introduction

SCP-OS is a **SCP Foundation**-themed Web Operating System that provides a complete desktop environment experience in the browser. The system includes a command-line terminal, file manager, code editor, real-time chat, performance dashboard, and over 7 built-in applications, with seamless desktop and mobile responsive adaptation.

### Core Values

- **Web OS Experience**: Windows-like desktop combined with iOS-like mobile home screen, providing complete window management and a rich application ecosystem
- **Immersive Design**: SCP Foundation worldview permeates throughout — terminal, file system, and UI components share a unified visual style
- **Data Integration**: Real-time SCP Wiki data scraping, supporting both English and Chinese branches
- **Dual-Platform Adaptation**: Seamless switching between desktop and mobile, responsive design covering multiple devices
- **Extensibility**: Built-in plugin system, tool registry, and dependency injection container
- **Security & Reliability**: Multi-layered protection — CSP policies, rate limiting, HTML sanitization, local-first approach

### Project Architecture

SCP-OS uses a **Monorepo** architecture containing three core packages:

| Package | Description | Tech Stack |
|---------|-------------|------------|
| `@scp-os/app` | Frontend Web Application | Vue 3 + TypeScript + Pinia + Tailwind CSS |
| `@scp-os/desktop` | Desktop Client | Tauri 2 + Rust |
| `scp-os-worker` | Backend API Service | Cloudflare Workers + D1 + KV |

---

## ✨ Features

### 🖥️ Desktop Operating System

- **Command-Line Terminal**: Supports 40+ commands covering file system operations, SCP queries, system management, and more
- **Virtual File System**: Linux-style directory structure with permission checks, file CRUD, search, and grep
- **Window Manager**: Draggable, resizable, minimizable/maximizable/closable complete window system
- **Multi-Tab Support**: Terminal multi-tab management with create, switch, close, lock, and rename capabilities

### 🔍 SCP Data Query

- **Real-Time Scraping**: Fetch SCP object data from SCP Wiki (English/Chinese branches) in real time
- **Smart Search**: Keyword search, number lookup, and object class filtering
- **Data Caching**: Dual acceleration with KV cache layer and memory cache layer, effectively reducing redundant requests
- **CJK Optimization**: Accurate CJK character width calculation with automatic terminal line wrapping

### 💬 Social Features

- **Real-Time Chat**: Multi-room chat system with nickname display, message edit/delete, and rate limiting
- **Feedback System**: Submit feedback, upvote/downvote, comment, and filter by category

### 📱 Dual-Platform Adaptation

- **Desktop Mode**: Windows-like desktop environment with taskbar, start menu, right-click context menu, and desktop icons
- **Mobile Mode**: iOS-like home screen with gesture support, bottom Dock, and haptic feedback
- **Responsive Layout**: Responsive font sizes, safe area adaptation, and free portrait/landscape switching

### 🎨 Themes & Personalization

- **8 Accent Color Themes**: One-click switching with synchronized terminal theme updates
- **Wallpaper System**: Custom wallpaper upload, thumbnail generation, and IndexedDB persistence
- **Design Tokens**: Unified CSS variable system with iOS dark mode style

### 🔌 Extensibility

- **Plugin System**: Supports 4 plugin types (command/theme/data source/UI component) with complete lifecycle management
- **Tool Registry**: Modular tool registration — adding new tools requires no core code changes
- **DI Container**: Supports Singleton, Scoped, and Transient lifecycles with built-in circular dependency detection
- **Event Bus**: Cross-module event-driven communication, decoupling component dependencies

### 🔒 Security

- **CSP Policy**: Strict Content Security Policy enforced on Tauri desktop
- **Rate Limiting**: API request rate limiting and chat message rate limiting in parallel
- **HTML Sanitization**: Server-side HTML sanitization for effective XSS attack prevention
- **Local-First**: IndexedDB persistent storage, fully functional even offline

### 🔐 Authentication System
- JWT token management with automatic login state persistence
- Global nickname system, deeply integrated with chat

### 📖 SCP Offline Reader (Docs)
- **D1 Index**: 9526+ SCP entries, 6487 tales, 711 GOI entries, 126 Hubs with full-text search
- **Multi-Level Caching**: KV (server-side, <50ms) → IndexedDB (client-side, offline-readable) → GitHub Raw (fallback)
- **Dual-Platform Reader**: Desktop left-list/right-content layout, mobile card + fullscreen reading + gesture controls
- **Offline-First**: Cached content requires no network, automatic degradation with indicators when offline
- **Personalization**: Reading progress memory, font/line-height/dark theme, favorites

### ⚡ Performance Monitoring

---

## 📦 Installation

### Prerequisites

| Tool | Minimum Version | Recommended | Description |
|------|-----------------|-------------|-------------|
| Node.js | 18.0.0 | 20.x LTS | JavaScript runtime |
| pnpm | 8.0.0 | 10.3.0 | Package manager (project-specified) |
| Rust | - | stable | Tauri desktop build (optional) |
| Cloudflare Workers | - | - | Worker deployment (optional) |

### Installation Steps

1. **Clone the Project**

   ```bash
   git clone https://github.com/LemonStudio-hub/scp-os.git
   cd scp-os
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env.development
   ```

   Edit `.env.development` to configure your environment variables. See [.env.example](.env.example):

   | Variable | Description | Default |
   |----------|-------------|---------|
   | `VITE_WORKER_API_URL` | Worker API URL | `https://api.woodcat.online` |
   | `VITE_API_TIMEOUT` | API timeout (ms) | `15000` |
   | `VITE_CACHE_DURATION` | Cache duration (ms) | `1800000` (30 minutes) |
   | `VITE_CACHE_MAX_SIZE` | Maximum cache entries | `100` |
   | `VITE_SCRAPER_RETRY_ATTEMPTS` | Scraper retry attempts | `3` |
   | `VITE_SCRAPER_RETRY_DELAY` | Scraper retry delay (ms) | `1000` |
   | `VITE_TERMINAL_SCROLLBACK` | Terminal scrollback lines | `1000` |
   | `VITE_TERMINAL_TAB_STOP_WIDTH` | Tab width | `4` |
   | `VITE_APP_VERSION` | Application version | `0.2.0` |
   | `VITE_APP_NAME` | Application name | `SCP-OS` |

---

## 🚀 Quick Start

### Web Development Mode

```bash
# Development mode (development environment)
pnpm dev:development

# Development mode (production environment)
pnpm dev:production
```

### Build

```bash
# Build
pnpm build

# Build by environment
pnpm build:development
pnpm build:production
```

### Desktop Development

```bash
# Tauri development mode
pnpm desktop:dev

# Tauri build
pnpm desktop:build
```

### Worker Development

```bash
# Worker local development
pnpm worker:dev

# Worker deploy
pnpm worker:deploy

# Worker log tailing
pnpm worker:tail
```

### Testing

```bash
# Run tests
pnpm test

# Test UI
pnpm test:ui

# Test coverage
pnpm test:coverage
```

### Code Quality

```bash
# Type checking
pnpm typecheck

# ESLint check
pnpm lint:check

# ESLint auto-fix
pnpm lint

# Prettier formatting
pnpm format
```

---

## 🏗️ Project Architecture

### Monorepo Structure

```
scp-os/
├── packages/
│   ├── app/                    # Frontend Web Application
│   │   ├── src/
│   │   │   ├── application/    # Application layer (controllers, services)
│   │   │   ├── commands/       # Command handling
│   │   │   ├── components/     # Shared components
│   │   │   ├── composables/    # Composables
│   │   │   ├── config/         # Configuration management
│   │   │   ├── constants/      # Constants
│   │   │   ├── core/           # DI container
│   │   │   ├── domain/         # Domain layer (DDD)
│   │   │   ├── gui/            # GUI layer
│   │   │   │   ├── components/ # GUI components
│   │   │   │   ├── composables/# GUI composables
│   │   │   │   ├── desktop/    # Desktop UI
│   │   │   │   ├── mobile/     # Mobile UI
│   │   │   │   ├── registry/   # Tool registry
│   │   │   │   ├── stores/     # GUI stores
│   │   │   │   ├── themes/     # Theme definitions
│   │   │   │   └── tools/      # Tool components
│   │   │   ├── infrastructure/ # Infrastructure layer
│   │   │   ├── platform/       # Platform layer (plugins, events, extensions)
│   │   │   ├── shared/         # Shared configuration
│   │   │   ├── stores/         # Pinia stores
│   │   │   ├── types/          # Type definitions
│   │   │   └── utils/          # Utility functions
│   │   └── public/             # Static assets + PWA
│   ├── desktop/                # Tauri Desktop Client
│   │   ├── src/                # Rust source code
│   │   └── icons/              # Application icons
│   └── worker/                 # Cloudflare Worker
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── security/       # Security (CORS, rate limiting)
│       │   └── ...             # Other source modules
│       ├── migrations/         # D1 database migrations
│       └── scripts/            # Utility scripts
├── .github/workflows/          # CI/CD
└── pnpm-workspace.yaml         # Workspace configuration
```

### Layered Architecture

The project follows **Domain-Driven Design (DDD)** layered principles:

```
┌─────────────────────────────────────┐
│            GUI Layer                 │  Vue Components + Composables
├─────────────────────────────────────┤
│         Application Layer            │  Controllers + Application Services
├─────────────────────────────────────┤
│           Domain Layer               │  Entities + Value Objects + Repository Interfaces
├─────────────────────────────────────┤
│       Infrastructure Layer           │  Repository Implementations + HTTP Client
├─────────────────────────────────────┤
│          Platform Layer              │  Plugins + Events + Extension Points
├─────────────────────────────────────┤
│           Core Layer                 │  DI Container + Types
└─────────────────────────────────────┘
```

---

## 📟 Terminal Commands

### System Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `start` | First-time system initialization | `start` |
| `restart` | Restart the system | `restart` |
| `shutdown` | Shut down the system | `shutdown now` |
| `status` | Display system status and containment statistics | `status` |
| `version` | Display system version | `version` |
| `about` | Display system information | `about` |
| `help` | Display available commands | `help` |
| `clear` / `cls` | Clear screen | `clear` |
| `logout` | Secure logout | `logout` |

### SCP Query Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `info` | Query SCP details | `info <number>` / `info CN-<number>` |
| `scp-list` | List known SCP objects | `scp-list` |
| `search` | Search SCP database | `search <keyword>` |
| `containment` | Display containment protocol categories | `containment` |
| `protocol` | Display security protocols and task forces | `protocol` |
| `emergency` | Display emergency contact information | `emergency` |

### File System Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `ls` | List directory contents | `ls [path]` |
| `cd` | Change directory | `cd <path>` |
| `pwd` | Print working directory | `pwd` |
| `mkdir` | Create directory | `mkdir <directory>` |
| `rm` | Remove file or directory | `rm <file\|directory>` |
| `cat` | Display file contents | `cat <file>` |
| `echo` | Output text or write to file | `echo <text> [> <file>]` |
| `touch` | Create empty file | `touch <file>` |
| `cp` | Copy file or directory | `cp <source> <destination>` |
| `mv` | Move or rename | `mv <source> <destination>` |
| `find` | Find files | `find <path> -name <pattern>` |
| `grep` | Search file contents | `grep <pattern> <file>` |
| `chmod` | Change file permissions | `chmod <permissions> <file>` |
| `chown` | Change file ownership | `chown <owner>:<group> <file>` |

### System Diagnostic Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `network` | Test network connectivity to Foundation Wiki | `network` |
| `performance` | Open performance monitoring panel | `performance` |
| `check` | Run system security check | `check` |
| `uname` | Display system information | `uname [-a]` |
| `df` | Display disk space | `df` |
| `free` | Display memory usage | `free` |
| `uptime` | Display system uptime | `uptime` |

### Keyboard Shortcuts

| Shortcut | Description |
|----------|-------------|
| `Ctrl+Shift+T` | Open new terminal window |
| `Ctrl+W` | Close current window |
| `Ctrl+Shift+P` | Toggle performance panel |
| `F11` | Toggle fullscreen |
| `↑` / `↓` | Browse command history |
| `Tab` | Command auto-completion |

---

## 🎯 GUI Tools

The system includes 10 built-in tool modules, each with both desktop and mobile versions:

| Tool | Desktop Component | Mobile Component | Description |
|------|-------------------|------------------|-------------|
| 🖥️ Terminal | TerminalPanel | MobileTerminal | Command-line terminal |
| 📁 FileManager | FileManagerWindow | MobileFileManager | File manager (with image/audio/video/text preview) |
| 📝 Editor | EditorWindow | MobileEditor | Code editor (CodeMirror, multi-language highlighting) |
| ⚙️ Settings | SettingsWindow | MobileSettings | System settings |
| 💬 Chat | PCChatWindow | ChatWindow | Real-time chat (supports message edit/delete) |
| 📊 Dashboard | PCDashboard | MobileDash | Performance dashboard |
| 📮 Feedback | PCFeedbackWindow | MobileFeedback | Feedback system |
| 📖 Docs | PCDocsWindow | MobileDocs | SCP offline reader |
| 🔔 Notification | PCNotificationCenter | MobileNotificationCenter | Notification center |
| 🧩 App Manager | AppManagerWindow | MobileAppManager | Local app platform (install & manage local apps) |

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Vue 3.5 + TypeScript 5.9
- **Build**: Vite 6 + Terser
- **State Management**: Pinia 3
- **Styling**: Tailwind CSS 4 + CSS custom properties
- **Terminal**: xterm.js 5
- **Editor**: CodeMirror 6 (CSS/HTML/JS/JSON/Markdown/Python/SQL)
- **Gestures**: Hammer.js 2
- **Persistence**: IndexedDB (5 Object Stores)
- **PWA**: Service Worker + Web App Manifest

### Desktop

- **Framework**: Tauri 2
- **Language**: Rust (stable)
- **Security**: Strict CSP policy

### Backend

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV
- **Parsing**: cheerio + linkedom + Defuddle
- **Security**: CORS + Rate Limiting + HTML Sanitization

### Tooling

- **Package Manager**: pnpm 10 (Monorepo)
- **Testing**: Vitest 4 + @vue/test-utils
- **Code Quality**: ESLint 9 + Prettier 3 + vue-tsc
- **CI/CD**: GitHub Actions (test + build + security scan + Tauri build)

### Cloudflare Resources

- **Workers**: `scp-os-worker` (production + root environment)
  - D1: `SCP_DB` (main database), `SCP_READER_DB` (SCP index database, 9526+ entries)
  - KV: `SCP_CACHE` (content cache)
  - DO: `ChatRoomDO` (chat room state)

---

## 📄 License

- **Code**: [MIT License](LICENSE)
- **SCP Foundation Content**: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

This project is for educational and entertainment purposes only. Use of SCP Foundation content follows the Creative Commons Attribution-ShareAlike 3.0 License.

---

## 🤝 Contributing

We welcome contributions of all kinds! Please see the [Contributing Guide](CONTRIBUTING.md) for details on how to participate in project development.

## 📚 Documentation

- [API Reference](docs/API.md)
- [Installation & Configuration](docs/INSTALLATION.md)
- [Usage Guide](docs/USAGE.md)
- [FAQ](docs/FAQ.md)

## 🌟 Acknowledgments

- [SCP Foundation](https://scp-wiki.net/) — For providing rich creative content
- [Vue.js](https://vuejs.org/) — Frontend framework
- [Tauri](https://tauri.app/) — Desktop application framework
- [Cloudflare Workers](https://workers.cloudflare.com/) — Backend service
- [Cloudflare](https://www.cloudflare.com/) — CDN and edge computing services
- [All Contributors](https://github.com/LemonStudio-hub/scp-os/graphs/contributors) — Thank you for your efforts!
