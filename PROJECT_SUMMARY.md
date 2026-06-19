# SCP-OS Project Complete Summary

> Generated: 2026-05-12
> Project Name: SCP-OS (SCP Foundation Web OS)
> Version: 0.5.0
> Repository Type: Monorepo (pnpm workspace)

---

## 1. Project Overview

SCP-OS is a **SCP Foundation**-themed Web Operating System that provides a complete desktop environment experience in the browser. The system includes a command-line terminal, file manager, code editor, real-time chat, performance dashboard, feedback system, SCP offline reader (Docs), and over 7 built-in applications, with seamless desktop and mobile responsive adaptation.

**Core Values**:
- Web OS Experience: Windows-like desktop + iOS-like mobile home screen
- Immersive Design: SCP Foundation worldview permeates throughout
- Data Integration: Real-time SCP Wiki data scraping (English/Chinese branches)
- Dual-Platform Adaptation: Seamless switching between desktop and mobile
- Extensibility: Built-in plugin system, tool registry, and dependency injection container
- Security & Reliability: CSP policies, rate limiting, HTML sanitization, local-first approach

---

## 2. Complete Tech Stack

### Frontend (Web Application)
| Technology | Version | Purpose |
|------------|---------|---------|
| Vue | 3.5 | Frontend framework |
| TypeScript | 5.9 | Type system |
| Vite | 6 | Build tool |
| Pinia | 3 | State management |
| Tailwind CSS | 4 | Utility-first CSS |
| xterm.js | 5 | Terminal emulator |
| CodeMirror | 6 | Code editor |
| Hammer.js | 2 | Gesture recognition |
| axios | 1.14 | HTTP client |
| DOMPurify | 3.4 | HTML sanitization (XSS prevention) |
| uuid | 13 | UUID generation |

### Desktop
| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.10 | Desktop application framework |
| Rust | stable | Native backend language |

### Backend (Worker)
| Technology | Version | Purpose |
|------------|---------|---------|
| Cloudflare Workers | - | Serverless edge runtime |
| Cloudflare D1 | - | SQLite edge database |
| Cloudflare KV | - | Key-value cache |
| Durable Objects | - | Chat room state persistence |
| cheerio | 1.2 | HTML parsing (jQuery-style) |
| linkedom | 0.18 | DOM simulation (Defuddle prerequisite) |
| Defuddle | 1.0 | Article content extraction |

### Tooling
| Technology | Version | Purpose |
|------------|---------|---------|
| pnpm | 10.3.0 | Package manager + workspace |
| ESLint | 9 | Code linting |
| Prettier | 3 | Code formatting |
| Vitest | 4 | Unit testing |
| vue-tsc | 3.2 | Vue type checking |
| GitHub Actions | - | CI/CD |

---

## 3. Monorepo Directory Structure Overview

```
scp-os/
├── .github/workflows/          # CI/CD workflows
├── .githooks/                  # Git hooks (pre-commit, pre-push, etc.)
├── .vscode/                    # VS Code recommended extensions config
├── docs/                       # Project documentation
├── dist/                       # Web build output (Vite output)
├── coverage/                   # Test coverage reports
├── packages/
│   ├── app/                    # Frontend Web Application (@scp-os/app)
│   ├── desktop/                # Tauri Desktop Client (@scp-os/desktop)
│   └── worker/                 # Cloudflare Worker (scp-os-worker)
├── package.json                # Root package.json (script aggregation)
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── pnpm-lock.yaml              # Dependency lockfile
├── .env.example                # Environment variable template
├── .env.development            # Development environment variables
├── .env.production             # Production environment variables
├── wrangler-pages.toml         # Cloudflare Pages configuration
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── README.md                   # Project main documentation
```

---

## 4. Root Directory Files Detail

| File/Directory | Description |
|----------------|-------------|
| `package.json` | Root-level package.json, defines global scripts (dev/build/test/worker:dev/desktop:dev, etc.), not published to npm (private: true) |
| `pnpm-workspace.yaml` | Defines workspace containing `packages/*`, enabling pnpm to recognize the three sub-packages |
| `pnpm-lock.yaml` | Full monorepo dependency lockfile, ensuring reproducible builds |
| `.env.example` | Environment variable configuration template, includes API URL, cache config, terminal config, JWT secret, etc. |
| `.env.development` | Development environment variables (loaded by Vite in development mode) |
| `.env.production` | Production environment variables (loaded by Vite in production mode) |
| `wrangler-pages.toml` | Cloudflare Pages deployment configuration (if frontend is hosted on Pages) |
| `.eslintrc.json` | Root-level ESLint configuration |
| `.prettierrc` | Root-level Prettier configuration |
| `.eslintignore` | ESLint ignore list |
| `.prettierignore` | Prettier ignore list |
| `.node-version` | Specifies Node.js version (for nvm/fnm) |
| `release-please-config.json` | release-please automated release configuration |
| `.release-please-manifest.json` | release-please version manifest |
| `CHANGELOG.md` | Changelog |
| `CONTRIBUTING.md` | Contributing guide |
| `LICENSE` | MIT License |

---

## 5. Frontend Package Detail: `packages/app`

This is the project's core frontend application — a complete Web OS GUI.

### 5.1 Configuration Files

| File | Description |
|------|-------------|
| `package.json` | Defines frontend dependencies (Vue, Pinia, Tailwind, xterm, CodeMirror, axios, etc.) and scripts (dev/build/test/lint/format/typecheck) |
| `vite.config.ts` | Vite main config: Vue plugin, Service Worker compilation (TypeScript → JS via custom plugin), PWA asset copying, manual code splitting (vue-vendor/terminal/network/gestures/editor), Terser minification, dev proxy (/api → production API), security response headers |
| `vite-admin.config.ts` | Admin panel standalone build configuration |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Vitest test configuration (with coverage) |
| `eslint.config.js` | ESLint 9 flat config |
| `postcss.config.js` | PostCSS configuration (Tailwind CSS v4) |
| `.prettierrc` | Prettier formatting rules |
| `index.html` | Web application entry HTML |
| `admin-index.html` | Admin panel entry HTML |

### 5.2 Entry Points & Global Files

| File | Description |
|------|-------------|
| `src/main.ts` | **Frontend main entry**: Creates Vue app, registers Pinia, initializes terminal store, sets up global error handling (window.onerror / unhandledrejection / Vue errorHandler), unregisters old Service Workers, initializes user UUID |
| `src/admin-main.ts` | Admin panel standalone entry |
| `src/App.vue` | **Root Vue component**: Wraps the entire app, renders desktop or mobile layout based on device type |
| `src/style.css` | Global styles (includes Tailwind imports, SCP theme variables) |
| `src/admin-style.css` | Admin panel global styles |

### 5.3 Layered Architecture Directories (DDD Style)

#### `src/core/` — Core Layer (DI Container)
| File | Description |
|------|-------------|
| `container.ts` | Dependency injection container implementation, supports Singleton / Scoped / Transient lifecycles with built-in circular dependency detection |
| `types.ts` | DI container related type definitions |

#### `src/domain/` — Domain Layer (Entities, Value Objects, Repository Interfaces)
| File | Description |
|------|-------------|
| `entities/command-history.entity.ts` | Command history domain entity |
| `entities/scp.entity.ts` | SCP data domain entity |
| `entities/tab.entity.ts` | Terminal tab domain entity |
| `repositories/command-history-repository.interface.ts` | Command history repository interface |
| `repositories/scp-repository.interface.ts` | SCP data repository interface |
| `repositories/tab-repository.interface.ts` | Tab repository interface |
| `value-objects/command-id.vo.ts` | Command ID value object |
| `value-objects/scp-number.vo.ts` | SCP number value object |

#### `src/application/` — Application Layer (Controllers, Application Services)
| File | Description |
|------|-------------|
| `controllers/command.controller.ts` | Command handling controller |
| `services/terminal-application.service.ts` | Terminal application service, coordinates domain logic with infrastructure |

#### `src/infrastructure/` — Infrastructure Layer (Repository Implementations, HTTP Client)
| File | Description |
|------|-------------|
| `http/fetch-http-client.ts` | fetch-based HTTP client wrapper |
| `repositories/command-history-indexeddb.repository.ts` | Command history IndexedDB repository implementation |
| `repositories/command-history-memory.repository.ts` | Command history in-memory repository implementation (fallback) |
| `repositories/tab-indexeddb.repository.ts` | Tab IndexedDB repository implementation |
| `repositories/tab-memory.repository.ts` | Tab in-memory repository implementation |
| `repositories/indexeddb-base.repository.ts` | IndexedDB repository base class |
| `repositories/memory-base.repository.ts` | In-memory repository base class |

#### `src/platform/` — Platform Layer (Plugins, Events, Extension Points)
| File | Description |
|------|-------------|
| `events/event-bus.ts` | Event bus, cross-module event-driven communication |
| `plugins/plugin-manager.ts` | Plugin manager, supports 4 plugin types (command/theme/data source/UI component) |
| `plugins/plugin-loader.ts` | Plugin loader |
| `plugins/plugin.interface.ts` | Plugin interface definition |
| `plugins/datasource-plugin.interface.ts` | Data source plugin interface |
| `plugins/datasources/scp-wiki-datasource.plugin.ts` | SCP Wiki data source plugin implementation |
| `extensions/extension-point.ts` | Extension point registration and management |
| `capabilities/capability-manager.service.ts` | Capability manager (runtime feature flags) |
| `performance/performance-monitor.service.ts` | Performance monitoring service |
| `performance/performance-optimizer.service.ts` | Performance optimization service |
| `multi-tenant/tenant-manager.service.ts` | Multi-tenant management (reserved) |

### 5.4 GUI Layer (Vue Components & Interaction)

#### `src/gui/desktop/` — Desktop UI
| File | Description |
|------|-------------|
| `DesktopScreen.vue` | Desktop main screen (wallpaper + desktop icons + right-click menu) |
| `PCLoginScreen.vue` | Desktop login screen |

#### `src/gui/mobile/` — Mobile UI
| File | Description |
|------|-------------|
| `HomeScreen.vue` | iOS-style home screen (app icon grid) |
| `LoginScreen.vue` | Mobile login screen |
| `MobileApp.vue` | Mobile root layout (includes Dock, status bar, gesture areas) |

#### `src/gui/components/` — Shared GUI Components
| File | Description |
|------|-------------|
| `PCWindow.vue` | Desktop window component (draggable, resizable, minimizable/maximizable/closable) |
| `MobileWindow.vue` | Mobile window/fullscreen page component |
| `PCTaskbar.vue` | Desktop taskbar (start button + open window list + system tray) |
| `PCStartMenu.vue` | Desktop start menu (tool list + user info) |
| `MobileDock.vue` | Mobile bottom Dock |
| `MobileNavBar.vue` | Mobile top navigation bar |
| `MobileBottomSheet.vue` | Mobile bottom sheet panel |
| `PCNotification.vue` | Desktop notification component |
| `SCPWindow.vue` | SCP-style window shell (title bar + content area) |
| `SCPToolbar.vue` | Toolbar component |
| `WallpaperPicker.vue` | Wallpaper picker (presets + custom upload) |
| `ui/SCPButton.vue` | SCP-style button |
| `ui/SCPInput.vue` | SCP-style input |
| `ui/SCPTabs.vue` | Tab component |
| `ui/SCPContextMenu.vue` | Right-click context menu |
| `ui/SCPStatusBar.vue` | Status bar |
| `ui/SCPBreadcrumbs.vue` | Breadcrumb navigation |
| `ui/SCPFileIcon.vue` | File icon component |
| `ui/GUIIcon.vue` | GUI icon component |
| `ui/PCCContextMenu.vue` | Desktop right-click menu |

#### `src/gui/tools/` — Built-in Tools (Desktop + Mobile Dual Versions)

| Tool | Desktop Component | Mobile Component | Description |
|------|-------------------|------------------|-------------|
| Terminal | `terminal/TerminalPanel.vue` | `terminal/MobileTerminal.vue` | xterm.js terminal, multi-tab support |
| File Manager | `filemanager/FileManagerWindow.vue` | `filemanager/MobileFileManager.vue` | Virtual file system GUI, with image/audio/video/text preview |
| Code Editor | `editor/EditorWindow.vue` | `editor/MobileEditor.vue` | CodeMirror 6, supports CSS/HTML/JS/JSON/Markdown/Python/SQL, etc. |
| Settings | `settings/SettingsWindow.vue` | `settings/MobileSettings.vue` | Theme switching, wallpaper management, terminal configuration |
| Chat | `chat/PCChatWindow.vue` | `chat/ChatWindow.vue` | Multi-room real-time chat |
| Dashboard | `dash/PCDashboard.vue` | `dash/MobileDash.vue` | Performance monitoring dashboard |
| Feedback | `feedback/PCFeedbackWindow.vue` | `feedback/MobileFeedback.vue` | Feedback submission and browsing |
| SCP Reader | `docs/PCDocsWindow.vue` | `docs/MobileDocs.vue` | Docs offline reader |
| Notification | `notification/PCNotificationCenter.vue` | `notification/MobileNotificationCenter.vue` | System notification management |
| Admin Panel | `admin/` (multi-page) | - | Admin panel (standalone build) |

**File Manager Preview Components**:
- `filemanager/ImageViewerModal.vue` — Image viewer
- `filemanager/AudioPlayerModal.vue` — Audio player
- `filemanager/VideoPlayerModal.vue` — Video player
- `filemanager/TextEditorModal.vue` — Text preview editor
- `filemanager/DialogModal.vue` — Generic dialog

**Admin Panel Directory `src/gui/tools/admin/`**:
- `AdminLayout.vue` / `AdminSidebar.vue` / `AdminTopbar.vue` — Layout framework
- `AdminLogin.vue` — Admin login page
- `pages/DashboardPage.vue` — Data overview
- `pages/UserManagement.vue` — User management
- `pages/ChatManagement.vue` — Chat management
- `pages/FeedbackManagement.vue` — Feedback management
- `pages/ContentManagement.vue` — Content management
- `pages/AuditLog.vue` — Audit log
- `pages/SystemSettings.vue` — System settings
- `services/adminApi.ts` — Admin panel API wrapper
- `stores/adminStore.ts` — Admin panel Pinia store
- `composables/useToast.ts` — Toast notification composable
- `components/` — Shared admin components (DataTable, Pagination, Modal, StatCard, TrendChart, etc.)

#### `src/gui/composables/` — GUI Composables
| File | Description |
|------|-------------|
| `useDraggable.ts` | Window drag logic (with 5px threshold) |
| `useResizable.ts` | Window 8-direction resize logic |
| `useZIndex.ts` | Window z-index automatic management |
| `useKeyboardShortcuts.ts` | Global keyboard shortcuts (Ctrl+Shift+T opens terminal, etc.) |
| `useTheme.ts` | Theme switching (8 accent colors + CSS variable injection) |
| `useMobile.ts` | Mobile detection and adaptation |
| `useHammer.ts` | Hammer.js gesture wrapper |
| `useSwipeGesture.ts` | Swipe gesture wrapper |
| `useChatWebSocket.ts` | Chat WebSocket (or polling) connection management |
| `useDashboardData.ts` | Dashboard data fetching and display |
| `useDocsReader.ts` | Docs reader data fetching, caching, reading progress management |
| `useTerminalEmulator.ts` | xterm.js terminal instance lifecycle management |
| `useNotification.ts` | Notification system management |
| `useI18n.ts` | Internationalization |

#### `src/gui/stores/` — GUI-Specific Pinia Stores
| File | Description |
|------|-------------|
| `windowManager.ts` | Window management store (open/close/focus/minimize/maximize/z-index) |
| `fileManager.ts` | File manager state (current directory, selected files, etc.) |
| `terminalPanel.ts` | Terminal panel state |
| `textEditor.ts` | Text editor state |
| `themeStore.ts` | Theme state (current theme, wallpaper) |

#### `src/gui/registry/` — Tool Registry
| File | Description |
|------|-------------|
| `ToolRegistry.ts` | Tool registry implementation, maintains tool metadata and component mapping |
| `registerTools.ts` | Registers all built-in tools to the registry |

#### `src/gui/themes/` — Theme Definitions
| File | Description |
|------|-------------|
| `index.ts` | 8 accent color theme definitions (red/orange/yellow/green/blue/purple/pink/gray), synchronized SCP terminal color scheme |

#### `src/gui/design-tokens.ts` — Design Tokens
Unified CSS variable system (iOS dark mode style), injected globally via `injectGUITokens()`.

#### `src/gui/events/EventBus.ts` — Event Bus Implementation

### 5.5 Other Core Directories

#### `src/commands/` — Terminal Command Handling
| File | Description |
|------|-------------|
| `index.ts` | Command registration and dispatch center, contains 40+ command mappings |
| `penetration.ts` | Penetration testing related commands (standalone module) |

#### `src/components/` — Shared Components
| File | Description |
|------|-------------|
| `SCPTerminal.vue` | Terminal main component (embeds xterm.js) |
| `TabBar.vue` | Terminal tab bar |
| `Sidebar.vue` | Sidebar |
| `PerformanceDashboard.vue` | Performance dashboard component |
| `DocReaderPanel.vue` | Document reader panel |
| `TalesListPanel.vue` | Tales list panel |
| `dashboard/` | Dashboard sub-components (Header, Footer, MetricCard, IssueList, PerformanceScore, RecommendationList) |

#### `src/composables/` — Application-Level Composables
| File | Description |
|------|-------------|
| `useTerminal.ts` | Terminal core logic (command parsing, execution pipeline) |
| `useCommandHistory.ts` | Command history management (memory + IndexedDB) |
| `useTabsRefactored.ts` | Tab management (refactored version) |
| `useTerminalRefactored.ts` | Terminal management (refactored version) |

#### `src/stores/` — Pinia Stores (Application-Level)
| File | Description |
|------|-------------|
| `terminal.ts` | Terminal global state (font size, line height, scrollback lines, etc.) |
| `tabs.ts` | Tab global state |
| `command.ts` | Command execution state |
| `scraper.ts` | SCP data fetching state |
| `authStore.ts` | User authentication state (JWT, nickname, UUID) |
| `system.ts` | System state (boot/shutdown, performance metrics) |
| `notificationStore.ts` | Notification state |

#### `src/utils/` — Utility Functions
| File | Description |
|------|-------------|
| `filesystem.ts` | Virtual file system implementation (Linux-style directory structure, permission checks, CRUD, search, grep) |
| `terminal.ts` | Terminal output formatting, newline handling, CJK character width calculation |
| `commandAutocomplete.ts` | Command auto-completion (fuzzy matching, subsequence matching, cycle selection) |
| `commandFormatter.ts` | Command formatting and coloring |
| `indexedDB.ts` | IndexedDB wrapper (5 Object Stores: tabs, commandHistory, wallpapers, settings, docsCache) |
| `scraper.ts` | SCP data scraping client wrapper |
| `authFetch.ts` | JWT-authenticated fetch wrapper |
| `jwt.ts` | JWT generation and verification utilities |
| `wallpaperService.ts` | Wallpaper upload, thumbnail generation, IndexedDB persistence |
| `imageProxy.ts` | Image proxy (handles cross-origin) |
| `errorHandler.ts` | Global error handling and classification |
| `logger.ts` | Logging utility |
| `terminalResponsive.ts` | Terminal responsive layout calculation |
| `infoQueryLogs.ts` | info command query logs |
| `networkTestLogs.ts` | network command test logs |
| `securityCheckLogs.ts` | check command security check logs |

#### `src/types/` — Type Definitions
| File | Description |
|------|-------------|
| `command.ts` | Command-related types |
| `terminal.ts` | Terminal-related types |
| `scp.ts` | SCP data types |
| `scraper.ts` | Scraper-related types |
| `error.ts` | Error types |
| `global.d.ts` | Global type declarations (e.g., `window.__USER_ID__`) |
| `hammerjs.d.ts` | Hammer.js type supplements |

#### `src/constants/` — Constants
| File | Description |
|------|-------------|
| `commands.ts` | All available command definitions and metadata |
| `theme.ts` | Theme constants |
| `scraperConfig.ts` | Scraper configuration constants (retry count, timeout, etc.) |
| `bootLogs.ts` | System boot log text (SCP-style) |

#### `src/config/` — Configuration Management
| File | Description |
|------|-------------|
| `index.ts` | Runtime configuration aggregation (reads environment variables from import.meta.env and sets defaults) |

#### `src/shared/` — Shared Configuration
| File | Description |
|------|-------------|
| `configs/config-manager.ts` | Configuration manager (supports multiple environments) |
| `configs/defaults.ts` | Default configuration values |

#### `src/penetration/` — Penetration Testing Simulation Module
| File | Description |
|------|-------------|
| `engine.ts` | Penetration testing engine core |
| `effects.ts` | Visual effects simulation |
| `output.ts` | Output formatting |
| `randomizer.ts` | Randomization utilities |
| `types.ts` | Penetration testing type definitions |
| `scenarios/` | Various penetration scenarios (recon, vulnscan, exploit, privesc, exfil, persist, scp-target) |
| `templates/` | Penetration tool templates (nmap, nikto, sqlmap, msfconsole, mimikatz, misc) |

### 5.6 Static Assets `packages/app/public/`

| File | Description |
|------|-------------|
| `manifest.json` | PWA Web App Manifest |
| `sw.js` / `sw.ts` | Service Worker (offline caching strategy) |
| `offline.html` | Offline fallback page |
| `favicon.ico` / `favicon.svg` / `favicon-*.png` | Multi-size favicons |
| `apple-touch-icon.png` | iOS home screen icon |
| `android-chrome-*.png` | Android icons |
| `browserconfig.xml` | IE/Edge tile configuration |
| `robots.txt` | Search engine crawler rules |
| `sitemap.xml` | Sitemap |

---

## 6. Desktop Package Detail: `packages/desktop`

Tauri 2 desktop client, packages the frontend web application as a native desktop application.

### 6.1 Configuration Files

| File | Description |
|------|-------------|
| `package.json` | Desktop package.json, only depends on `@tauri-apps/cli` |
| `tauri.conf.json` | **Tauri core configuration**: Window size (default 1200x800, minimum 800x600), CSP security policy, packaging targets (deb/appimage/dmg/msi/nsis), icon paths |
| `Cargo.toml` | Rust project configuration |
| `Cargo.lock` | Rust dependency lockfile |
| `build.rs` | Rust build script |

### 6.2 Rust Source Code

| File | Description |
|------|-------------|
| `src/main.rs` | **Rust program entry**: Initializes Tauri runtime, loads frontend dist output, starts native window |
| `src/lib.rs` | Rust library entry (command/plugin registration reserved) |

### 6.3 Resources

| File | Description |
|------|-------------|
| `icons/` | Multi-platform application icons (PNG/ICO/ICNS, sizes from 32x32 to 512x512) |
| `capabilities/default.json` | Tauri capability declarations (permission configuration) |

### 6.4 Build Behavior

- `beforeDevCommand`: Runs `pnpm run dev` (starts frontend dev server)
- `beforeBuildCommand`: Runs `pnpm run build:production` (builds frontend output to `dist/`)
- `frontendDist`: Points to `../../dist` (uses frontend build output)

---

## 7. Backend Package Detail: `packages/worker`

Cloudflare Workers backend service, responsible for SCP data scraping, chat, feedback, user management, Docs index queries, and more.

### 7.1 Configuration Files

| File | Description |
|------|-------------|
| `package.json` | Worker dependencies (cheerio, linkedom, defuddle) and scripts (dev/deploy/tail/test) |
| `wrangler.toml` | **Cloudflare Wrangler core configuration**: Worker name, D1 database bindings (SCP_DB + SCP_READER_DB), KV namespace (SCP_CACHE), Durable Objects (ChatRoomDO), cron triggers (every 10 minutes for chat message broadcasting), production/development environment switching |
| `tsconfig.json` / `tsconfig.ci.json` | TypeScript configuration |
| `vitest.config.ts` | Vitest test configuration |

### 7.2 Entry Point & Source Modules

| File | Description |
|------|-------------|
| `src/app.ts` | **Worker main application**: Sets up Hono app with middleware and route registration |
| `src/chat-room.ts` | ChatRoom Durable Object implementation |
| `src/db.ts` | Database query helpers |
| `src/helpers.ts` | Shared helper functions |
| `src/http.ts` | HTTP client utilities |
| `src/security.ts` | Security middleware (CORS, rate limiting, auth) |
| `src/types.ts` | Worker-wide type definitions |

### 7.3 API Route Modules `src/routes/`

| File | Description |
|------|-------------|
| `admin.ts` | Admin panel aggregated routes |
| `auth.ts` | Authentication routes (login/verify) |
| `chat.ts` | Chat routes (send messages, rooms, nicknames) |
| `docs.ts` | Docs (SCP reader) API: entry list, single entry metadata, content fetching (KV → GitHub Raw fallback), tales list, Hub list |
| `feedback.ts` | Feedback system routes (submit/list/like/vote/comment/category stats) |
| `files.ts` | File-related routes |
| `notifications.ts` | Notification routes |
| `performance.ts` | Performance monitoring routes |
| `users.ts` | User routes (register/query/nickname check) |

### 7.4 Database Migrations `migrations/`

| File | Description |
|------|-------------|
| `0001_init.sql` | Initialization: scp_index table |
| `0002_fill_data.sql` | Fill basic data |
| `0003_quick_fill.sql` | Quick fill |
| `0004_chat_messages.sql` | Chat messages table |
| `0005_chat_rooms.sql` | Chat rooms table |
| `0006_feedbacks.sql` | Feedback table |
| `0007_users.sql` | Users table |
| `0008_feedback_votes_comments.sql` | Feedback votes and comments table |
| `0009_scp_reader_tables.sql` | **Docs index tables**: scp_items, scp_tales, scp_goi, scp_hubs, scp_search (FTS5 full-text search) |
| `0010_user_settings.sql` | User settings table |
| `0011_notifications.sql` | Notifications table |
| `0012_admin_system.sql` | Admin system table |
| `schema.sql` | Complete database schema |

### 7.5 Scripts `scripts/`

| File | Description |
|------|-------------|
| `migrate-scp-data.ts` | Migrates JSON data from scp-api repository to D1 database |
| `preload-kv-content.ts` | Preloads SCP content into Cloudflare KV (900 entries/day rate limit) |
| `fillDatabase.ts` | Database fill utility |
| `quickFill.ts` | Quick fill utility |
| `bulkFillDatabase.ts` | Bulk fill utility |
| `scrapeAllScps.ts` | Full SCP scraping script |

### 7.6 Tests `__tests__/` / `benchmarks/`

| File | Description |
|------|-------------|
| `classParser.test.ts` | Object class parsing tests |
| `htmlParser.test.ts` | HTML parsing tests |
| `sectionParser.test.ts` | Section splitting tests |
| `performance.test.ts` | Performance benchmark tests |

---

## 8. Docs (SCP Offline Reader) Data Flow

```
User opens Docs
    │
    ▼
Frontend calls /docs/items (D1 index query)
    │
    ▼
User clicks on an SCP entry
    │
    ├── Priority: Query Cloudflare KV (<50ms)
    │       └── Hit → Return content directly
    │
    └── KV miss
            └── Fallback to GitHub Raw API
                    └── On success, write to KV cache
                            └── Return content
    │
    ▼
Frontend stores content in IndexedDB (offline cache)
    │
    ▼
Offline re-read → Read from IndexedDB (fully offline)
```

**Database Scale**:
- SCP Entries: 9526+
- Tales: 6487
- GOI Entries: 711
- Hubs: 126

---

## 9. Key Business Flows

### 9.1 First Launch Flow
1. Browser loads `index.html` → `main.ts` creates Vue app
2. Initialize Pinia → Terminal store detects device type (desktop/mobile)
3. User enters login screen → Enters nickname → Frontend generates UUID → Calls Worker `/api/user/register`
4. Login success → Renders desktop/mobile main interface
5. Terminal displays boot logs (SCP-style text from `bootLogs.ts`)
6. User enters `start` command to complete first-time system initialization

### 9.2 Terminal Command Execution Flow
1. User enters command in xterm.js → `SCPTerminal.vue` captures input
2. `useTerminal.ts` parses command string
3. `commands/index.ts` looks up corresponding command handler
4. Command classification handling:
   - **SCP Query** → Calls `scraper.ts` → HTTP request to Worker `/scrape` or `/search`
   - **File System** → Calls `filesystem.ts` (pure frontend virtual file system)
   - **System Commands** → Directly operates frontend state (Store)
5. Results formatted and output to terminal via xterm.js API

### 9.3 Window Management Flow (Desktop)
1. User double-clicks desktop icon or clicks start menu → `ToolRegistry` looks up tool definition
2. `windowManager.ts` store creates new window state (position, size, title, content component)
3. `PCWindow.vue` renders window, injects `useDraggable` + `useResizable` + `useZIndex`
4. Window drag/resize updates store state → Reactive view update
5. Taskbar `PCTaskbar.vue` subscribes to window list → Displays all open windows

### 9.4 Chat Message Flow
1. User enters message → Frontend calls Worker `POST /chat/send`
2. Worker `src/app.ts` checks rate limit (D1 query for messages in last 1 minute)
3. Passes limit → Inserts into D1 `chat_messages` table
4. Updates `chat_rooms` message count
5. Cron trigger (every 10 minutes) calls `broadcastNewMessages()` to mark unboardcasted messages
6. Or Durable Object `ChatRoomDO` maintains WebSocket real-time push

---

## 10. CI/CD & GitHub Actions

The `.github/workflows/` directory contains automated workflows (specific content should be checked in workflow files):

- **Test Workflow**: Runs Vitest unit tests (app + worker)
- **Build Workflow**: Builds frontend output, type checking, lint checking
- **Tauri Build Workflow**: Multi-platform desktop builds (Linux/macOS/Windows)
- **Security Scan**: Dependency vulnerability detection
- **Release Workflow**: release-please automated releases

---

## 11. Git Hooks `.githooks/`

| File | Description |
|------|-------------|
| `pre-commit` / `pre-commit.ps1` | Runs ESLint and Prettier before commit |
| `post-checkout` | Post branch-switch hook |
| `post-commit` | Post commit hook |
| `post-merge` | Post merge hook |
| `pre-push` | Pre-push hook |

---

## 12. Complete Environment Variables List

| Variable Name | Default Value | Description |
|---------------|---------------|-------------|
| `VITE_WORKER_API_URL` | `https://api.woodcat.online` | Worker API URL |
| `VITE_API_TIMEOUT` | `15000` | API timeout (ms) |
| `VITE_CACHE_DURATION` | `1800000` | Cache duration (30 minutes) |
| `VITE_CACHE_MAX_SIZE` | `100` | Maximum cache entries |
| `VITE_SCRAPER_RETRY_ATTEMPTS` | `3` | Scraper retry attempts |
| `VITE_SCRAPER_RETRY_DELAY` | `1000` | Scraper retry delay (ms) |
| `VITE_TERMINAL_SCROLLBACK` | `1000` | Terminal scrollback lines |
| `VITE_TERMINAL_TAB_STOP_WIDTH` | `4` | Tab width |
| `VITE_APP_VERSION` | `0.2.0` | Application version |
| `VITE_APP_NAME` | `SCP-OS` | Application name |
| `VITE_FAST_BOOT` | `false` | Fast boot (skip animations) |
| `VITE_JWT_SECRET` | - | JWT signing secret (must be configured) |
| `VITE_DOWNLOAD_MAX_FILE_SIZE` | `524288000` | Maximum download file size (500MB) |
| `VITE_DOWNLOAD_DEFAULT_RATE_LIMIT` | `0` | Download rate limit (KB/s, 0=unlimited) |
| `VITE_DOWNLOAD_STREAM_BUFFER_SIZE` | `65536` | Download stream buffer size |
| `VITE_DOWNLOAD_HISTORY_MAX_SIZE` | `200` | Maximum download history entries |

---

## 13. Code Splitting Strategy (Vite)

| Chunk Name | Contents | Description |
|------------|----------|-------------|
| `vue-vendor` | Vue core library | Framework foundation |
| `terminal` | xterm.js + related | Terminal emulator |
| `network` | axios | HTTP client |
| `gestures` | Hammer.js | Gesture library |
| `editor` | CodeMirror 6 suite | Code editor |

---

## 14. IndexedDB Structure (Frontend Persistence)

Database name: `scp-os-db`

| Object Store | Purpose |
|-------------|---------|
| `tabs` | Terminal tab state persistence |
| `commandHistory` | Command history (cross-session retention) |
| `wallpapers` | Custom wallpaper image data |
| `settings` | User settings (theme, terminal config, etc.) |
| `docsCache` | Docs reader content cache (offline reading) |

---

> This document was generated from the project codebase, covering all major directories and key file descriptions.
