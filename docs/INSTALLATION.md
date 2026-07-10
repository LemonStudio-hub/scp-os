# Installation & Configuration Guide

This document provides detailed instructions for setting up, configuring, and deploying the SCP-OS project.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Environment Variables](#environment-variables)
- [Worker Deployment Configuration](#worker-deployment-configuration)
- [Tauri Desktop Configuration](#tauri-desktop-configuration)
- [Build & Deploy](#build--deploy)
- [Development Tools Configuration](#development-tools-configuration)

---

## System Requirements

### Required

| Tool | Minimum Version | Recommended | Description |
|------|-----------------|-------------|-------------|
| Node.js | 18.0.0 | 20.x LTS | JavaScript runtime |
| pnpm | 8.0.0 | 10.3.0 | Package manager (project-specified) |

### Optional

| Tool | Description |
|------|-------------|
| Rust stable | Tauri desktop build |
| Wrangler CLI | Cloudflare Worker local development and deployment |
| GTK3 + WebKit2GTK | Tauri build on Linux (Linux only) |

### Installing Node.js

Recommended to use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node.js versions:

```bash
# Using nvm
nvm install 20
nvm use 20

# Using fnm
fnm install 20
fnm use 20
```

### Enabling pnpm

```bash
corepack enable
corepack prepare pnpm@10.3.0 --activate
```

### Installing Rust (Desktop Development)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/LemonStudio-hub/scp-os.git
cd scp-os
```

### 2. Install Dependencies

```bash
pnpm install
```

The project uses pnpm workspace to manage the monorepo. This command will automatically install all sub-package dependencies.

### 3. Configure Environment Variables

```bash
cp .env.example .env.development
```

Edit `.env.development` according to the [Environment Variables](#environment-variables) section.

### 4. Start Development Server

```bash
pnpm dev
```

Access `http://localhost:5173` in your browser to see the application.

---

## Environment Variables

Environment variable files are located in the project root directory, supporting three environments:

| File | Purpose |
|------|---------|
| `.env.development` | Development environment |
| `.env.production` | Production environment |
| `.env.example` | Configuration template (committed to version control) |

### Complete Configuration

```bash
# ==================== API Configuration ====================

# Worker API URL
# Development can use local Worker URL: http://localhost:8787
# Production uses online URL: https://api.scpos.site
VITE_WORKER_API_URL=https://api.woodcat.online

# API request timeout (milliseconds)
VITE_API_TIMEOUT=15000

# ==================== Cache Configuration ====================

# Cache duration (milliseconds), default 30 minutes
VITE_CACHE_DURATION=1800000

# Maximum cache entries
VITE_CACHE_MAX_SIZE=100

# ==================== Scraper Configuration ====================

# Scraper retry attempts
VITE_SCRAPER_RETRY_ATTEMPTS=3

# Scraper retry delay (milliseconds)
VITE_SCRAPER_RETRY_DELAY=1000

# ==================== Terminal Configuration ====================

# Terminal scrollback buffer lines
VITE_TERMINAL_SCROLLBACK=1000

# Tab key width (spaces)
VITE_TERMINAL_TAB_STOP_WIDTH=4

# ==================== Application Configuration ====================

# Application version
VITE_APP_VERSION=0.2.0

# Application name
VITE_APP_NAME=SCP-OS

# Fast boot mode (skip boot animation)
VITE_FAST_BOOT=false
```

### Configuration Priority

1. Environment-specific file (`.env.development` / `.env.production`)
2. Default values in code (see `packages/app/src/config/index.ts`)

Vite automatically loads the corresponding environment file based on the `--mode` parameter:

```bash
vite --mode development   # Loads .env.development
vite --mode production    # Loads .env.production
```

---

## Worker Deployment Configuration

Worker configuration is located at `packages/worker/wrangler.toml`.

### Key Configuration Items

```toml
name = "scp-os-worker"
main = "index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# D1 database bindings (root level, shared across all environments)
[[d1_databases]]
binding = "SCP_DB"
database_name = "scp-database"
database_id = "77dff909-beb0-4870-bb52-90e810b2e5c1"
migrations_dir = "migrations"

[[d1_databases]]
binding = "SCP_READER_DB"
database_name = "scp-reader-db"
database_id = "7454655f-d3a5-49b6-9832-b5a146c192de"
migrations_dir = "migrations"

# KV namespace (content cache)
[[kv_namespaces]]
binding = "SCP_CACHE"
id = "40f0d23a05e14f7484232bc1960e217f"

# Cron trigger: broadcast chat messages every 10 minutes
[triggers]
crons = ["*/10 * * * *"]
```

### Initialize D1 Database

```bash
cd packages/worker

# View database list
wrangler d1 list

# Run main database migration (chat, feedback, users)
wrangler d1 execute scp-database --file=migrations/0001_init.sql --remote

# Run SCP index database migration (9 tables: scp_items, scp_tales, scp_goi, scp_hubs, scp_search FTS5)
wrangler d1 execute scp-reader-db --file=migrations/0009_scp_reader_tables.sql --remote

# Migration script location: packages/worker/scripts/migrate-scp-data.ts
# Usage: npx tsx scripts/migrate-scp-data.ts
```

### Create KV Namespace

```bash
wrangler kv:namespace create SCP_CACHE
```

Enter the returned `id` into `wrangler.toml`.

### Local Worker Development

```bash
cd packages/worker
pnpm dev
```

Worker runs locally at `http://localhost:8787`.

### Deploy Worker

```bash
cd packages/worker
pnpm deploy
```

### Data Population

Docs index data is imported via the `migrate-scp-data.ts` script (requires configuring `SCP_DATA_REPO_PATH` environment variable pointing to the scp-api repository):

```bash
# Set data repository path (configure in .env)
SCP_DATA_REPO_PATH=d:/backup/scp-api/scp-api-main/docs/data/scp

# Run migration script (converts JSON to SQL and imports to D1)
npx tsx scripts/migrate-scp-data.ts
```

KV content cache is preloaded via the `preload-kv-content.ts` script (900 entries/day rate limit):

```bash
# Run KV preload (respects free tier daily 1000 write limit)
npx tsx scripts/preload-kv-content.ts

# View progress
cat scripts/.kv-preload-progress.json
```

---

## Tauri Desktop Configuration

Tauri configuration is located at `packages/desktop/tauri.conf.json`.

### Key Configuration Items

```json
{
  "productName": "SCP-OS",
  "version": "0.2.0",
  "identifier": "online.scpos.terminal",
  "app": {
    "windows": [
      {
        "title": "SCP-OS",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' https://api.scpos.site; ..."
    }
  }
}
```

### CSP Security Policy

The Tauri desktop enables a strict Content Security Policy:

- `default-src 'self'` — Only allows loading same-origin resources
- `connect-src 'self' https://api.scpos.site` — Only allows connecting to the specified API server
- Blocks embedding external content via `frame-src`, `object-src`

To connect to other APIs, modify the `csp.connect-src` configuration.

### Building the Tauri Application

```bash
# Development mode
pnpm desktop:dev

# Build installer
pnpm desktop:build
```

Build output is located at `packages/desktop/src-tauri/target/release/bundle/`:

| Platform | Output Format |
|----------|---------------|
| Linux | `.deb` |
| macOS | `.dmg` |
| Windows | `.msi` / `.exe` (NSIS) |

### Linux Dependencies

Building Tauri on Linux requires installing system dependencies:

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libxdo-devel libappindicator-gtk3-devel librsvg2-devel

# Arch
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module libxdo libappindicator-gtk3 librsvg
```

---

## Build & Deploy

### Web Application Build

```bash
# Standard build
pnpm build

# Build by environment
pnpm build:development
pnpm build:production
```

Build output is written to the project root `dist/` directory, containing:

- Static HTML/CSS/JS
- Service Worker (`sw.js`)
- PWA Manifest (`manifest.json`)
- Offline page (`offline.html`)

### Code Splitting Strategy

Vite build is configured with manual code splitting to optimize loading performance:

| Chunk | Contents |
|-------|----------|
| `vue-vendor` | Vue core library |
| `terminal` | xterm.js terminal |
| `network` | axios network library |
| `gestures` | Hammer.js gesture library |

### Deploy to Static Hosting

The `dist/` directory can be directly deployed to any static hosting service:

- **Cloudflare Pages**
- **Vercel**
- **Netlify**
- **GitHub Pages**
- **Nginx / Apache**

> **Note**: SPA applications need to configure all routes to fall back to `index.html`.

---

## Development Tools Configuration

### VS Code Recommended Extensions

The project has configured `.vscode/extensions.json`. The following extensions are recommended:

- Vue Language Features (Volar)
- TypeScript Vue Plugin
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### ESLint Configuration

ESLint configuration is located at `packages/app/eslint.config.js`, using ESLint 9 flat config format:

```bash
# Check code
pnpm lint:check

# Auto-fix
pnpm lint
```

### Prettier Configuration

Prettier configuration is located at `packages/app/.prettierrc`:

```bash
# Format code
pnpm format

# Check formatting
pnpm format
```

### TypeScript Configuration

TypeScript configuration is located at `packages/app/tsconfig.json`:

```bash
# Type checking
pnpm typecheck
```

### Test Configuration

Tests use Vitest, configured at `packages/app/vitest.config.ts`:

```bash
# Run tests
pnpm test

# Test UI
pnpm test:ui

# Coverage
pnpm test:coverage
```
