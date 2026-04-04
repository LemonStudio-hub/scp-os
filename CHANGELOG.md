# Changelog

All notable changes to SCP-OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Cloudflare Pages Deployment** (2026-04-04)
  - Added missing `uuid@13.0.0` dependency (critical fix for build failures)
  - Fixed Service Worker compilation: `sw.ts` now properly compiled to `sw.js` using esbuild
  - Added memory limits: `NODE_OPTIONS='--max-old-space-size=4096'` to prevent OOM errors
  - Added build output cleanup: `emptyOutDir: true` in vite config
  - Deployment now successful and accessible at https://scpos.pages.dev

- **Terminal Scraper API** (2026-04-04)
  - Fixed all hardcoded API URLs from `api.woodcat.online` (unreachable) to `api.scpos.site` (working)
  - Updated `defaults.ts` worker-url default value
  - Updated `scp-wiki-datasource.plugin.ts` constructor default parameter
  - Updated `default-config.ts` Cloudflare Workers deployment URL
  - All terminal commands (info, search, scp-list, network) now working properly

## [0.1.0] - 2026-04-03

### 🎉 Initial Release

First official release of SCP-OS - SCP Foundation Terminal System.

### Added

#### Core Platform Architecture
- **6-Layer Architecture** with clear separation of concerns
  - Core Layer: Dependency injection container with lifecycle management
  - Domain Layer: Business entities, repositories, and domain services
  - Application Layer: Controllers and application services
  - Infrastructure Layer: Repository implementations (IndexedDB, Memory)
  - Platform Layer: Plugin system, event bus, capabilities
  - Presentation Layer: Vue components, Pinia stores, composables

#### Plugin System
- **Command Plugins**: Dynamic command registration and discovery
  - HelpCommandPlugin, SystemCommandPlugin
- **Theme Plugins**: UI theme customization
  - RetroThemePlugin, ModernThemePlugin
- **Data Source Plugins**: External data integration
  - SCPWikiDatasourcePlugin
- **Plugin Lifecycle**: Load, enable, disable, unload

#### Terminal Features
- **Professional Terminal Interface** powered by xterm.js
- **14 SCP-themed commands** with intelligent autocomplete
  - help, status, clear/cls, containment, scp-list, info, protocol, emergency, version, about, search, network, logout
- **Command History**: Navigate previous commands (500 entry limit)
- **Tab Autocomplete**: Intelligent command completion
- **Boot Animation**: Simulated Linux boot log with SCP-themed content
- **Multi-Tab Support**: Independent terminal sessions
- **Command Highlighting**: Syntax highlighting for command input

#### Data & Persistence
- **IndexedDB Storage**: Persistent terminal state and tab management
- **Data Persistence**: Terminal sessions survive browser restarts
- **Memory Management**: Automatic cleanup of old entries

#### Performance
- **Code Splitting**: 87% initial load reduction through optimized bundle splitting
- **Lazy Loading**: On-demand loading of commands and heavy modules
- **Performance Monitoring**: Real-time metrics collection and scoring
  - PerformanceMonitorService: Memory, navigation, resource tracking
  - PerformanceOptimizerService: 6 built-in optimization strategies
- **Bundle Optimization**: Main bundle reduced from 440KB to 55KB

#### Mobile Support
- **Responsive Design**: 4 breakpoints (1200px, 768px, 480px)
- **Gesture Controls**: Multi-touch gestures via Hammer.js
  - Three Finger Swipe Up: Clear screen
  - Two Finger Swipe Left/Right: Command history navigation
  - Long Press: Clear screen
- **Dynamic Font Scaling**: Optimized readability
- **Virtual Keyboard Support**: Mobile keyboard optimization

#### Theme & Design
- **SCP Foundation Theme**: Authentic green/red/yellow color scheme
- **ANSI Color Support**: Rich colored output
- **Full-Screen Mode**: Immersive terminal experience
- **Custom Scrollbar**: Themed scrollbar

#### Cloudflare Worker API
- **Real-time SCP Scraping**: Live data from SCP Wiki
- **API Endpoints**: /scrape, /search, /list, /stats, /debug
- **KV Caching**: 30-minute cache for API responses
- **Rate Limiting**: IP-based request limiting
- **XSS Protection**: HTML sanitization with isomorphic-dompurify
- **Retry Mechanism**: Automatic 3-retry with exponential backoff
- **Error Classification**: 7 error types with automatic detection

#### Desktop Application (Tauri)
- **Cross-Platform**: Linux (.deb), macOS (.dmg), Windows (.msi/.nsis)
- **Native Window**: 1200x800 resizable window
- **Security**: CSP configuration for secure webview

#### CI/CD
- **GitHub Actions**: Automated testing, building, and deployment
- **Security Scanning**: Trivy filesystem scanning
- **Cloudflare Workers**: Automated worker deployment
- **GitHub Pages**: Automated static site deployment
- **Tauri Build**: Multi-platform desktop build pipeline

#### Testing
- **87+ Tests**: 100% pass rate
- **Vitest**: Modern testing framework
- **Edge Case Coverage**: Comprehensive scenario testing

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3.5 (Composition API) |
| Language | TypeScript 5.9 |
| Build Tool | Vite 5 |
| Terminal | xterm.js 5.3 |
| Gestures | Hammer.js 2.0 |
| HTTP Client | Axios 1.14 |
| State Management | Pinia 3.0 |
| Testing | Vitest 2.1 |
| Desktop | Tauri 2 |
| API | Cloudflare Workers |
| Package Manager | pnpm 8.15 |

### Security

- No sensitive data storage
- Pure client-side application (except Worker API)
- Input sanitization
- Error handling with sensitive data masking
- AES-256-GCM encryption for network communication
- XSS protection via HTML sanitization
- Rate limiting on API endpoints

### License

- **Code**: MIT License
- **SCP Foundation Content**: CC BY-SA 3.0

---

## [0.1.0-dev] - Pre-release Development

### Development Phases

#### Phase 1: Infrastructure (Completed)
- Dependency injection container
- Event bus implementation
- Plugin system core
- Configuration system

#### Phase 2: Layered Architecture (Completed)
- Domain layer with entities and repositories
- Infrastructure layer with repository implementations
- Application layer with controllers and services
- Presentation layer refactoring

#### Phase 3: Pluginization (Completed)
- Command plugin system
- Theme plugin system
- Data source plugins
- UI component plugins

#### Phase 4: Platform Features (Completed)
- Capability abstractions (Terminal, Data, UI)
- Multi-tenant support
- Deployment configurations
- Application templates

#### Phase 5: Optimization & Testing (Completed)
- Performance monitoring service
- Performance optimizer service
- Test suite expansion (144 tests, 100% pass)
- Comprehensive code review

[Unreleased]: https://github.com/LemonStudio-hub/scp-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/LemonStudio-hub/scp-os/releases/tag/v0.1.0
