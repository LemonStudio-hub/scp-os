# 安装与配置指南

本文档详细说明 SCP-OS 项目的安装、配置和部署流程。

---

## 目录

- [环境要求](#环境要求)
- [安装步骤](#安装步骤)
- [环境变量配置](#环境变量配置)
- [Worker 部署配置](#worker-部署配置)
- [Tauri 桌面端配置](#tauri-桌面端配置)
- [构建与部署](#构建与部署)
- [开发工具配置](#开发工具配置)

---

## 环境要求

### 必需

| 工具 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| Node.js | 18.0.0 | 20.x LTS | JavaScript 运行时 |
| pnpm | 8.0.0 | 10.3.0 | 包管理器（项目指定） |

### 可选

| 工具 | 说明 |
|------|------|
| Rust stable | Tauri 桌面端构建 |
| Wrangler CLI | Cloudflare Worker 本地开发与部署 |
| GTK3 + WebKit2GTK | Linux 下 Tauri 构建（仅 Linux） |

### 安装 Node.js

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm) 管理 Node.js 版本：

```bash
# 使用 nvm
nvm install 20
nvm use 20

# 使用 fnm
fnm install 20
fnm use 20
```

### 启用 pnpm

```bash
corepack enable
corepack prepare pnpm@10.3.0 --activate
```

### 安装 Rust（桌面端开发）

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/scp-os.git
cd scp-os
```

### 2. 安装依赖

```bash
pnpm install
```

项目使用 pnpm workspace 管理 Monorepo，此命令会自动安装所有子包的依赖。

### 3. 配置环境变量

```bash
cp .env.example .env.development
```

根据 [环境变量配置](#环境变量配置) 章节编辑 `.env.development`。

### 4. 启动开发服务器

```bash
pnpm dev
```

浏览器访问 `http://localhost:5173` 即可看到应用。

---

## 环境变量配置

环境变量文件位于项目根目录，支持三种环境：

| 文件 | 用途 |
|------|------|
| `.env.development` | 开发环境 |
| `.env.production` | 生产环境 |
| `.env.example` | 配置模板（已提交到版本控制） |

### 完整配置项

```bash
# ==================== API 配置 ====================

# Worker API 地址
# 开发环境可使用本地 Worker 地址：http://localhost:8787
# 生产环境使用线上地址：https://api.scpos.site
VITE_WORKER_API_URL=https://api.woodcat.online

# API 请求超时时间（毫秒）
VITE_API_TIMEOUT=15000

# ==================== 缓存配置 ====================

# 缓存有效期（毫秒），默认 30 分钟
VITE_CACHE_DURATION=1800000

# 最大缓存条目数
VITE_CACHE_MAX_SIZE=100

# ==================== 爬虫配置 ====================

# 爬虫重试次数
VITE_SCRAPER_RETRY_ATTEMPTS=3

# 爬虫重试延迟（毫秒）
VITE_SCRAPER_RETRY_DELAY=1000

# ==================== 终端配置 ====================

# 终端回滚缓冲区行数
VITE_TERMINAL_SCROLLBACK=1000

# Tab 键宽度（空格数）
VITE_TERMINAL_TAB_STOP_WIDTH=4

# ==================== 应用配置 ====================

# 应用版本号
VITE_APP_VERSION=0.1.0

# 应用名称
VITE_APP_NAME=SCP Foundation Terminal

# 快速启动模式（跳过启动动画）
VITE_FAST_BOOT=false
```

### 配置优先级

1. 环境特定文件（`.env.development` / `.env.production`）
2. 代码中的默认值（见 `packages/app/src/config/index.ts`）

Vite 会根据 `--mode` 参数自动加载对应的环境文件：

```bash
vite --mode development   # 加载 .env.development
vite --mode production    # 加载 .env.production
```

---

## Worker 部署配置

Worker 配置位于 `packages/worker/wrangler.toml`。

### 关键配置项

```toml
name = "scp-scraper-worker"
main = "index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# D1 数据库绑定
[[d1_databases]]
binding = "SCP_DB"
database_name = "scp-database"
database_id = "<your-database-id>"
migrations_dir = "migrations"

# KV 命名空间（缓存）
[[kv_namespaces]]
binding = "SCP_CACHE"
id = "<your-kv-namespace-id>"

# 路由配置
[[routes]]
pattern = "api.scpos.site/*"
zone_name = "scpos.site"

# 定时任务
[triggers]
crons = ["*/10 * * * *"]
```

### 初始化 D1 数据库

```bash
cd packages/worker

# 创建数据库
wrangler d1 create scp-database

# 执行迁移
wrangler d1 execute scp-database --file=migrations/0001_init.sql
wrangler d1 execute scp-database --file=migrations/0002_fill_data.sql
wrangler d1 execute scp-database --file=migrations/0003_quick_fill.sql
wrangler d1 execute scp-database --file=migrations/0004_chat_messages.sql
wrangler d1 execute scp-database --file=migrations/0005_chat_rooms.sql
wrangler d1 execute scp-database --file=migrations/0006_feedbacks.sql
wrangler d1 execute scp-database --file=migrations/0007_users.sql
wrangler d1 execute scp-database --file=migrations/0008_feedback_votes_comments.sql
```

### 创建 KV 命名空间

```bash
wrangler kv:namespace create SCP_CACHE
```

将返回的 `id` 填入 `wrangler.toml`。

### 本地开发 Worker

```bash
cd packages/worker
pnpm dev
```

Worker 本地运行在 `http://localhost:8787`。

### 部署 Worker

```bash
cd packages/worker
pnpm deploy
```

### 数据填充

```bash
# 快速填充（推荐）
wrangler d1 execute scp-database --file=migrations/0003_quick_fill.sql

# 批量填充（需要较长时间）
npx tsx scripts/bulkFillDatabase.ts

# 爬取所有 SCP 数据
npx tsx scripts/scrapeAllScps.ts
```

---

## Tauri 桌面端配置

Tauri 配置位于 `packages/desktop/tauri.conf.json`。

### 关键配置项

```json
{
  "productName": "SCP Foundation Terminal",
  "version": "0.2.0",
  "identifier": "online.scpos.terminal",
  "app": {
    "windows": [
      {
        "title": "SCP Foundation Terminal",
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

### CSP 安全策略

Tauri 桌面端启用了严格的内容安全策略：

- `default-src 'self'` — 仅允许加载同源资源
- `connect-src 'self' https://api.scpos.site` — 仅允许连接 API 服务器
- 禁止 `frame-src`、`object-src` 嵌入外部内容

如需连接其他 API，需修改 `csp.connect-src` 配置。

### 构建 Tauri 应用

```bash
# 开发模式
pnpm desktop:dev

# 构建安装包
pnpm desktop:build
```

构建产物位于 `packages/desktop/src-tauri/target/release/bundle/`：

| 平台 | 产物格式 |
|------|---------|
| Linux | `.deb` |
| macOS | `.dmg` |
| Windows | `.msi` / `.exe`（NSIS） |

### Linux 依赖

在 Linux 上构建 Tauri 需要安装系统依赖：

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libxdo-devel libappindicator-gtk3-devel librsvg2-devel

# Arch
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module libxdo libappindicator-gtk3 librsvg
```

---

## 构建与部署

### Web 应用构建

```bash
# 标准构建
pnpm build

# 按环境构建
pnpm build:development
pnpm build:production
```

构建产物输出到项目根目录的 `dist/` 文件夹，包含：

- 静态 HTML/CSS/JS
- Service Worker（`sw.js`）
- PWA Manifest（`manifest.json`）
- 离线页面（`offline.html`）

### 代码分割策略

Vite 构建配置了手动代码分割，优化加载性能：

| Chunk | 包含内容 |
|-------|---------|
| `vue-vendor` | Vue 核心库 |
| `terminal` | xterm.js 终端 |
| `network` | axios 网络库 |
| `gestures` | Hammer.js 手势库 |

### 部署到静态托管

`dist/` 目录可直接部署到任何静态托管服务：

- **Cloudflare Pages**
- **Vercel**
- **Netlify**
- **GitHub Pages**
- **Nginx / Apache**

> **注意**：SPA 应用需要配置所有路由回退到 `index.html`。

---

## 开发工具配置

### VS Code 推荐扩展

项目已配置 `.vscode/extensions.json`，推荐安装以下扩展：

- Vue Language Features (Volar)
- TypeScript Vue Plugin
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### ESLint 配置

ESLint 配置位于 `packages/app/eslint.config.js`，使用 ESLint 9 扁平配置格式：

```bash
# 检查代码
pnpm lint:check

# 自动修复
pnpm lint
```

### Prettier 配置

Prettier 配置位于 `packages/app/.prettierrc`：

```bash
# 格式化代码
pnpm format

# 检查格式
pnpm format:check
```

### TypeScript 配置

TypeScript 配置位于 `packages/app/tsconfig.json`：

```bash
# 类型检查
pnpm typecheck
```

### 测试配置

测试使用 Vitest，配置位于 `packages/app/vitest.config.ts`：

```bash
# 运行测试
pnpm test

# 测试 UI
pnpm test:ui

# 覆盖率
pnpm test:coverage
```
