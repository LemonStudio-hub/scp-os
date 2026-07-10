# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SCP-OS is an SCP Foundation-themed Web Operating System — a browser-based desktop environment with terminal, file manager, code editor, real-time chat, dashboard, feedback system, and SCP offline reader. It's a **pnpm monorepo** with three packages.

## Common Commands

```bash
# Install dependencies (pnpm 10.3.0, Node 20)
pnpm install

# Development
pnpm dev                          # Start app dev server
pnpm worker:dev                   # Start Cloudflare Worker dev server (wrangler)
pnpm desktop:dev                  # Start Tauri desktop dev

# Build
pnpm build                        # Build app
pnpm build:production             # Production build
pnpm desktop:build                # Build Tauri desktop app

# Testing
pnpm test                         # Run all tests (app + worker)
pnpm --filter @scp-os/app vitest run src/path/to/test.test.ts   # Single test file
pnpm test:coverage                # Tests with coverage
pnpm test:ui                      # Vitest UI mode (app only)

# Quality checks (CI runs these in order: typecheck → lint → format check)
pnpm typecheck                    # Type check app + worker
pnpm lint:check                   # ESLint check
pnpm lint                         # ESLint with --fix
pnpm format                       # Prettier format all

# Worker deployment
pnpm worker:deploy                # Deploy to Cloudflare
pnpm worker:tail                  # Tail worker logs
```

## Architecture

### Monorepo Layout

```
packages/
  app/          # @scp-os/app — Vue 3 + TypeScript frontend (Vite, Pinia, Tailwind CSS)
  desktop/      # @scp-os/desktop — Tauri 2 + Rust desktop wrapper
  worker/       # scp-os-worker — Cloudflare Workers backend (Hono framework)
```

### Frontend (`packages/app`) — DDD Layered Architecture

The app follows Domain-Driven Design with clear layer separation:

- `src/domain/` — Entities, value objects, repository interfaces, domain services (pure business logic, no framework deps)
- `src/application/` — Controllers, application services (orchestrate domain logic)
- `src/infrastructure/` — Repository implementations, HTTP client (concrete implementations of domain interfaces)
- `src/gui/` — Vue components, composables, desktop/mobile views, tool registry, themes, stores
- `src/platform/` — Plugins, event bus, extensions, capabilities
- `src/core/` — DI container

**Tool Registry Pattern**: GUI tools (terminal, filemanager, editor, settings, chat, dash, feedback, docs, notification, admin) are registered in `gui/registry/registerTools.ts`. Each tool has both `PC*.vue` (desktop) and `Mobile*.vue` components.

**Key frontend tech**: Vue 3.5 (`<script setup lang="ts">`), Pinia 3 stores, Tailwind CSS 4, xterm.js 5 (terminal), CodeMirror 6 (editor), Hammer.js 2 (gestures), IndexedDB (local persistence), PWA with Service Worker.

### Backend (`packages/worker`)

- **Framework**: Hono on Cloudflare Workers
- **Databases**: D1 (SQLite) — two databases: `SCP_DB` (main), `SCP_READER_DB` (SCP content reader)
- **Caching**: KV (`SCP_CACHE`)
- **Real-time**: Durable Objects (`ChatRoomDO`) for chat room state
- **Routes**: `src/routes/`
- **Security**: CORS, rate limiting, HTML sanitization via DOMPurify

### Desktop (`packages/desktop`)

Tauri 2 + Rust wrapper. Strict CSP policy. Targets: deb, appimage, dmg, msi, nsis. Identifier: `online.scpos.terminal`.

## Code Conventions

- **TypeScript**: Strict mode. `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **Vue**: `<script setup lang="ts">`, PascalCase component filenames, `defineProps<T>()` generic syntax.
- **State**: Pinia stores named `use[Name]Store` in camelCase files.
- **Styling**: Tailwind CSS utilities + scoped styles + CSS custom properties (`--gui-*` for theming, 8 accent color themes).
- **Imports**: `@` alias maps to `./src` in the app package.
- **Formatting**: Semicolons, single quotes, 2-space indent, 120 char width, trailing commas (enforced by Prettier).
- **i18n**: Bilingual (English + Chinese) via `useI18n` composable.
- **Testing**: Vitest 4 + `@vue/test-utils` + jsdom (app), node environment (worker). Test files colocated or in `__tests__/`. Setup file at `src/test/setup.ts` provides common mocks.
- **ESLint**: App uses ESLint 9 flat config (`packages/app/eslint.config.js`). Key rules: `no-var: error`, `prefer-const: warn`, `@typescript-eslint/no-explicit-any: warn`, `vue/multi-word-component-names: off`.

## Commit & Branch Conventions

- **Commits**: Conventional Commits — `<type>(<scope>): <subject>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`
  - Scopes: `app`, `desktop`, `worker`, `terminal`, `gui`, `domain`, `plugin`
- **Branches**: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/` prefixes
- **Releases**: Automated via release-please

## CI Pipeline

GitHub Actions (`ci.yml`) on push/PR to `main` and `develop`:
1. **lint** → typecheck (app + worker), ESLint, Prettier format check
2. **test** → `pnpm test` (depends on lint)
3. **build** → production build + bundle size check (depends on lint + test)
4. **security** → pnpm audit + Trivy scan (push only, depends on lint)

Worker has its own deploy pipeline (`deploy-worker.yml`) triggered on changes to `packages/worker/**`.

## Environment Variables

Frontend env vars must be prefixed with `VITE_`. Key ones: `VITE_WORKER_API_URL`, `VITE_API_TIMEOUT`, `VITE_CACHE_DURATION`, `VITE_FAST_BOOT`.

## Git Hooks

Located in `.githooks/`. Pre-commit enforces a 500KB file size limit. Configure with `git config core.hooksPath .githooks`.
