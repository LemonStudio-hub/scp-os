# Release Notes - v0.1.0

## 🎉 Initial Release

SCP-OS (SCP Foundation Terminal System) v0.1.0 is the first official release of the project.

### What is SCP-OS?

A professional web-based terminal application themed around the SCP Foundation, featuring:
- Advanced command-line interface with 30+ SCP-themed commands
- Multi-tab support with independent sessions
- Mobile gesture controls and responsive design
- Real-time SCP data scraping from the SCP Wiki
- Desktop application via Tauri
- Cloudflare Worker API for live data
- Multi-room chat system with rate limiting
- User identity system with persistent UUID
- iOS-style GUI with full theme support

### 🌐 Live Demos

- **Web Application**: https://scpos.pages.dev (Cloudflare Pages)
- **API Endpoint**: https://api.scpos.site (Cloudflare Worker)

### Architecture

This release implements a complete 6-layer architecture:
1. **Core** - Dependency injection and lifecycle management
2. **Domain** - Business entities and repository interfaces
3. **Application** - Controllers and application services
4. **Infrastructure** - Repository implementations (IndexedDB, Memory)
5. **Platform** - Plugin system, event bus, capabilities
6. **Presentation** - Vue components and Pinia stores

### Key Features

| Feature | Description |
|---------|-------------|
| 🖥️ Terminal | Professional xterm.js-based terminal with 30+ commands |
| 🔌 Plugin System | Extensible command, theme, and data source plugins |
| 📱 Mobile | Responsive design with gesture controls |
| 💾 Persistence | IndexedDB-based data storage |
| ⚡ Performance | 87% initial load reduction via code splitting |
| 🤖 API | Cloudflare Worker with real-time SCP scraping |
| 🖥️ Desktop | Cross-platform desktop app (Linux, macOS, Windows) |
| 💬 Chat | Multi-room chat with rate limiting and unread badges |
| 👤 Identity | Auto-generated UUID on first visit |
| 🎨 Themes | 4 themes with full terminal/chat support |

### Tech Stack

- Vue 3.5 + TypeScript 5.9 + Vite 5
- Pinia 3.0 for state management
- xterm.js 5.3 for terminal emulation
- Tauri 2 for desktop application
- Cloudflare Workers for API
- uuid 13.0.0 for user identity
- Hammer.js 2.0 for gestures

### Installation

#### Web Application
```bash
git clone https://github.com/LemonStudio-hub/scp-os.git
cd scpos
pnpm install
pnpm run dev
```

#### Desktop Application
Download the appropriate installer for your platform from the assets below.

### Known Limitations

- Desktop application requires manual build (CI pipeline configured)
- Some performance monitoring features are stub implementations
- Chinese SCP Wiki support is partial

### Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

### License

- Code: [MIT License](LICENSE)
- SCP Content: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
