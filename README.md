# SCP-OS - SCP Foundation Terminal System

[![CI](https://github.com/LemonStudio-hub/scp-os/actions/workflows/ci.yml/badge.svg)](https://github.com/LemonStudio-hub/scp-os/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 项目概述

SCP-OS 是一个基于 SCP 基金会主题的专业双端应用，同时提供先进的命令行界面和现代化的图形用户界面（GUI），支持 PC 端和移动端，具有全面的功能和优化的性能。

- **生产环境**: https://scpos.pages.dev (Cloudflare Pages)
- **API**: https://api.scpos.site (Cloudflare Worker)

## 🚀 快速开始

### 前置要求

- Node.js 18+ 和 npm/yarn/pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/LemonStudio-hub/scp-os.git
cd scpos

# 安装依赖
pnpm install
```

### 环境配置

复制环境变量模板文件：

```bash
cp .env.example .env.development
```

**可用的环境变量：**

```bash
# API 配置
VITE_WORKER_API_URL=https://api.scpos.site
VITE_API_TIMEOUT=15000

# 缓存配置
VITE_CACHE_DURATION=1800000
VITE_CACHE_MAX_SIZE=100

# 爬虫配置
VITE_SCRAPER_RETRY_ATTEMPTS=3
VITE_SCRAPER_RETRY_DELAY=1000

# 终端配置
VITE_TERMINAL_SCROLLBACK=1000
VITE_TERMINAL_TAB_STOP_WIDTH=4

# 应用配置
VITE_APP_VERSION=0.1.0
VITE_APP_NAME=SCP Foundation Terminal
```

### 开发

```bash
# 启动开发服务器（开发模式）
pnpm run dev:development

# 启动开发服务器（生产模式）
pnpm run dev:production

# 启动默认开发服务器
pnpm run dev

# 访问 http://localhost:5173
```

### 构建

```bash
# 构建开发版本
pnpm run build:development

# 构建生产版本
pnpm run build:production

# 使用默认配置构建
pnpm run build

# 预览生产构建
pnpm run preview
```

### 测试

```bash
# 运行测试
pnpm run test

# 运行带 UI 的测试
pnpm run test:ui

# 运行带覆盖率报告的测试
pnpm run test:coverage

# 类型检查
pnpm run lint
```

## 🌟 核心功能

### 终端功能
- **专业终端界面**: 使用 xterm.js 实现的真实终端体验
- **手势控制**: 移动和桌面的多点触控手势（由 Hammer.js 提供支持）
- **命令系统**: 30+ SCP 主题命令，支持智能自动完成
- **命令历史**: 浏览以前的命令（限制为 500 条记录）
- **标签自动完成**: 智能命令完成
- **启动动画**: 模拟 Linux 启动日志，带有 SCP ASCII 艺术和主题内容（支持快速模式）
- **多标签支持**: 打开多个具有独立会话的终端标签
- **数据持久化**: IndexedDB 存储用于终端状态和标签管理
- **响应式输出**: 所有终端命令适应终端宽度（移动优化）

### 聊天系统
- **多房间聊天**: 多个聊天室，可自由切换
  - 3 个默认房间：General、Random、Tech
  - 创建自定义房间
  - 未读消息徽章（进入时自动清除）
- **用户身份**: 首次访问时自动生成 UUID（持久）
- **昵称**: 设置自定义显示名称
- **速率限制**: 每用户每分钟 10 条消息，防止垃圾信息
- **iOS 风格 UI**: 气泡消息、对话框、平滑动画
- **主题支持**: 所有聊天 UI 元素响应主题变化

### 性能优化
- **代码分割**: 优化的捆绑分割，加快初始加载
- **延迟加载**: 按需加载命令
- **图像优化**: 压缩资产以加快加载速度
- **高效缓存**: API 响应的 30 分钟 KV 命名空间缓存
- **内存管理**: 命令历史限制为 500 条记录
- **Service Worker**: 网络优先用于 HTML，缓存优先用于资产（v2）

### 移动支持
- **响应式设计**: 自动适应任何屏幕尺寸（4 个断点）
- **动态字体缩放**: 在所有尺寸下优化可读性
- **触摸优化**: 增强的触摸目标和手势
- **虚拟键盘支持**: 针对移动键盘交互进行优化
- **平滑滚动**: 固定终端触摸处理，实现流畅滚动
- **PWA 就绪**: 具有元标签的渐进式 Web 应用支持

### 主题与设计
- **SCP 基金会主题**: 真实的 SCP 配色方案（绿色/红色/黄色）
- **4 种主题**: 深色、浅色、复古、现代，全面支持终端/聊天
- **全屏模式**: 沉浸式终端体验
- **ANSI 颜色支持**: 丰富的彩色输出
- **自定义滚动条**: 主题滚动条，保持一致性
- **响应式 UI**: 侧边栏和标签栏，提高导航性

### 双端GUI功能
- **PC端GUI**: 现代化的桌面界面，支持多窗口管理
  - **任务栏**: 应用程序快速访问和状态显示
  - **开始菜单**: 应用程序列表和系统功能
  - **窗口管理**: 最小化、最大化、关闭等标准窗口操作
  - **应用程序**: 聊天、反馈、仪表盘等专用应用
  - **视觉效果**: 悬停动画、阴影效果、玻璃态设计

- **移动端GUI**: 针对触摸设备优化的界面
  - **响应式布局**: 自动适应不同屏幕尺寸
  - **触摸优化**: 增大触摸目标，支持手势操作
  - **虚拟键盘**: 智能键盘适配，提升输入体验
  - **移动应用**: 聊天、反馈等功能的移动专用版本
  - **性能优化**: 针对移动设备的资源使用优化

- **跨平台一致性**: 
  - 统一的设计语言和用户体验
  - 同步的主题支持
  - 一致的应用功能和操作逻辑
  - 无缝的设备切换体验

## 📋 可用命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `help` | 显示所有可用命令 | `help` |
| `status` | 显示系统状态和信息 | `status` |
| `clear` / `cls` | 清除终端屏幕 | `clear` |
| `containment` | 显示收容协议信息 | `containment` |
| `scp-list` | 列出已知的 SCP 对象 | `scp-list` |
| `info [number]` | 显示特定 SCP 的详细信息 | `info 173` |
| `protocol` | 显示安全协议和特遣队 | `protocol` |
| `emergency` | 显示紧急联系信息 | `emergency` |
| `version` | 显示系统版本 | `version` |
| `about` | 显示系统信息 | `about` |
| `search [keyword]` | 搜索 SCP 数据库 | `search statue` |
| `network` | 测试与基金会 Wiki 的网络连接 | `network` |
| `logout` | 安全登出 | `logout` |

## 🌐 API 与 Web 爬虫

项目包含一个 Cloudflare Worker，提供从 SCP Wiki 实时抓取 SCP 信息的功能。

### 部署
- **API 端点**: https://api.scpos.site
- **平台**: Cloudflare Workers
- **缓存**: 30 分钟 KV 命名空间缓存
- **重试机制**: 失败请求的自动 3 次重试逻辑
- **数据库**: D1 数据库，包含 500+ SCP 条目和全文搜索

### API 端点

#### 1. 抓取 SCP 信息
```
GET /scrape?number={number}
```
检索特定 SCP 对象的详细信息。

**示例**:
```bash
curl "https://api.scpos.site/scrape?number=682"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "SCP-682",
    "number": "682",
    "name": "不灭孽蜥",
    "objectClass": "KETER",
    "containment": ["特殊收容措施：..."],
    "description": ["描述：..."],
    "appendix": ["附录：..."],
    "author": "作者：...",
    "url": "https://scp-wiki-cn.wikidot.com/scp-682"
  }
}
```

#### 2. 搜索 SCP 数据库
```
GET /search?keyword={keyword}
```
搜索匹配关键字的 SCP 对象。

**示例**:
```bash
curl "https://api.scpos.site/search?keyword=173"
```

#### 3. 列出 SCP 对象
```
GET /list?limit={limit}&offset={offset}
```
分页列出 SCP 对象。

**示例**:
```bash
curl "https://api.scpos.site/list?limit=10&offset=0"
```

#### 4. 获取统计信息
```
GET /stats
```
返回 API 统计信息。

**示例**:
```bash
curl "https://api.scpos.site/stats"
```

#### 5. 调试模式
```
GET /debug?number={number}
```
返回原始 HTML 内容用于调试目的。

**示例**:
```bash
curl "https://api.scpos.site/debug?number=173"
```

#### 6. 聊天 API
```
POST /chat/send
GET /chat/messages?room_id={id}
GET /chat/rooms
POST /chat/rooms
POST /chat/nickname
```
带速率限制的多房间聊天系统。

**示例**:
```bash
# 发送消息
curl -X POST "https://api.scpos.site/chat/send" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"my-id","content":"Hello!","room_id":1}'

# 获取房间 1 的消息
curl "https://api.scpos.site/chat/messages?room_id=1"
```

#### 7. API 信息
```
GET /
```
返回 API 信息。

**示例**:
```bash
curl "https://api.scpos.site/"
```

### 爬虫功能

- **基于文本的解析器**: 使用针对 Wikidot 语法优化的正则表达式模式
- **多行匹配**: 使用 `[\s\S]*?` 模式正确处理多行内容
- **格式灵活性**: 支持多种格式变体（中文/英文标点）
- **高成功率**: 内容提取成功率 90%+
- **对象类别识别**: 自动检测 SAFE/EUCLID/KETER/THAUMIEL/NEUTRALIZED/PENDING 类别

## 🏗️ 项目结构

```
scpos/
├── packages/                  # Monorepo 包
│   ├── app/                   # Vue Web 应用
│   │   ├── src/              # 主要源代码
│   │   │   ├── commands/     # 命令处理程序
│   │   │   ├── composables/  # Vue 组合式 API
│   │   │   ├── components/   # Vue 组件
│   │   │   ├── config/       # 配置管理
│   │   │   ├── constants/    # 常量和配置
│   │   │   ├── stores/       # Pinia 状态管理
│   │   │   ├── types/        # TypeScript 类型定义
│   │   │   ├── utils/        # 实用函数
│   │   │   ├── platform/     # 平台层（第 1-5 阶段）
│   │   │   ├── core/         # 核心基础设施
│   │   │   ├── domain/       # 领域层
│   │   │   ├── application/  # 应用层
│   │   │   ├── infrastructure/ # 基础设施层
│   │   │   ├── shared/       # 共享实用程序
│   │   │   ├── gui/          # 图形用户界面
│   │   │   │   ├── components/ # GUI 组件
│   │   │   │   ├── tools/     # 应用工具
│   │   │   │   ├── registry/  # 工具注册
│   │   │   │   └── stores/    # GUI 状态管理
│   │   │   ├── App.vue       # 根组件
│   │   │   └── main.ts       # 应用入口点
│   │   ├── public/           # 静态资产
│   │   ├── index.html        # 入口 HTML
│   │   ├── vite.config.ts    # Vite 构建配置
│   │   ├── tsconfig.json     # TypeScript 配置
│   │   └── package.json      # 应用依赖
│   ├── desktop/              # Tauri 桌面应用
│   │   ├── src/             # Rust 源代码
│   │   ├── Cargo.toml       # Rust 依赖
│   │   ├── tauri.conf.json  # Tauri 配置
│   │   └── package.json      # 桌面脚本
│   ├── worker/               # Cloudflare Worker
│   │   ├── index.ts         # Worker 实现
│   │   ├── package.json     # Worker 依赖
│   │   ├── wrangler.toml    # Worker 配置
│   │   ├── parsers/         # HTML 解析器
│   │   ├── utils/           # Worker 实用程序
│   │   ├── security/        # 安全模块
│   │   ├── scripts/         # 数据库脚本
│   │   └── migrations/      # 数据库迁移
│   └── shared/               # 共享实用程序
├── .env.example              # 环境变量模板
├── .env.development          # 开发环境配置
├── .env.production           # 生产环境配置
├── .github/workflows/        # CI/CD 配置
├── package.json              # 根工作区配置
├── pnpm-workspace.yaml       # 工作区定义
└── pnpm-lock.yaml            # 锁定文件
```

## 🚀 平台架构（第 1-5 阶段）

项目经历了全面的重构，实现了具有高级平台功能的分层架构。

### 分层架构

**1. 核心层** (`src/core/`)
- 依赖注入容器
- 核心类型定义和接口
- 生命周期管理

**2. 领域层** (`src/domain/`)
- 业务实体（TabEntity、CommandHistoryEntity、SCPEntity）
- 存储库接口
- 业务逻辑和规则

**3. 应用层** (`src/application/`)
- 应用控制器（CommandController、TabController）
- 应用服务（TerminalApplicationService）
- 用例编排

**4. 基础设施层** (`src/infrastructure/`)
- 存储库实现（IndexedDB、内存）
- 事件总线实现
- HTTP 客户端和数据源

**5. 平台层** (`src/platform/`)
- 插件系统（命令、主题、数据源、UI 组件）
- 能力抽象（终端、数据、UI）
- 多租户支持
- 部署配置
- 性能监控和优化
- 应用模板

**6. 表示层** (`src/presentation/`)
- Vue 组件
- Pinia 存储
- 组合式 API
- UI 集成

### 平台功能

**插件系统**
- 命令插件（HelpCommandPlugin、SystemCommandPlugin）
- 主题插件（RetroThemePlugin、ModernThemePlugin）
- 数据源插件（SCPWikiDatasourcePlugin）
- UI 组件插件
- 插件生命周期管理

**能力**
- ITerminalCapability - 终端操作
- IDataCapability - 数据操作
- IUICapability - UI 操作
- 能力管理器，支持动态注册

**多租户支持**
- 租户隔离
- 租户上下文管理
- 每租户配置

**部署系统**
- 环境特定配置（开发、暂存、生产）
- 部署配置管理
- 功能标志

**性能模块**
- 实时性能监控
- 性能评分（0-100）
- 问题检测和建议
- 优化策略，带工作量估算
- 优化实施验证系统

### 性能监控与优化

性能模块 (`src/platform/performance/`) 提供：

**PerformanceMonitorService**
- 实时指标收集（内存、导航、资源）
- 性能评分和问题检测
- 事件驱动架构
- 可配置的监控间隔

**PerformanceOptimizerService**
- 六种内置优化策略
- 基于检测到的问题的智能建议
- 改进估计和工作量分类
- 实施验证

### 依赖注入

DIContainer 提供：
- 单例、瞬态和作用域生命周期
- 自动依赖解析
- 循环依赖检测
- 生命周期钩子

### 事件系统

EventBus 提供：
- 发布-订阅模式
- 事件过滤和路由
- 一次性事件处理
- 性能优化

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3（组合式 API）
- **语言**: TypeScript 5.9
- **构建工具**: Vite 8.0
- **终端**: xterm.js 5.3
- **手势**: Hammer.js 2.0
- **HTTP 客户端**: Axios 1.14
- **状态管理**: Pinia 3.0
- **存储**: IndexedDB（持久数据存储）

### 开发工具
- **测试**: Vitest 4.1
- **类型检查**: vue-tsc 3.2
- **Linting**: TypeScript 严格模式

### 基础设施
- **API**: Cloudflare Workers
- **缓存**: KV 命名空间（30 分钟 TTL）
- **域名**: api.scpos.site

## 📦 构建输出

生产构建创建优化的块：

```
dist/
├── index.html                    (2.80 kB)
├── assets/
│   ├── index-DqBl2W1z.css        (4.98 kB)
│   ├── rolldown-runtime.js       (0.68 kB)
│   ├── gestures-BSf9QL0u.js     (20.37 kB)
│   ├── network-Db_EQ46M.js       (36.07 kB)
│   ├── index-DBlrtW-l.js         (55.41 kB)
│   ├── vue-vendor-CHAgholh.js    (58.35 kB)
│   └── terminal-BN0BBKTc.js     (280.11 kB)
```

**捆绑优化：**
- 代码分割将初始加载减少 87%
- 主捆绑：440KB → 55KB
- 延迟加载命令和重型模块
- 优化资产压缩

## 📱 响应式断点

| 屏幕尺寸 | 字体大小 | 用例 |
|---------|---------|------|
| ≥1200px | 16px     | 大型桌面 |
| ≥768px  | 14px     | 桌面/平板 |
| ≥480px  | 12px     | 大型移动设备 |
| <480px  | 10px     | 小型移动设备 |

## 🎮 手势控制

### 移动手势
- **三指向上滑动** - 清除屏幕
- **两指向左滑动** - 历史记录中的上一个命令
- **两指向右滑动** - 历史记录中的下一个命令
- **两指向下滑动** - 滚动到底部
- **长按** - 清除屏幕

### 桌面手势
- **单指向上滑动** - 滚动到顶部
- **单指向下滑动** - 滚动到底部
- **点击** - 聚焦终端

## 🧪 测试

项目维护 87 个测试，100% 通过率：

```bash
# 测试覆盖率
✓ src/commands/index.test.ts (26 tests)
✓ src/composables/useCommandHistory.test.ts (21 tests)
✓ src/utils/terminal.test.ts (19 tests)
✓ worker/security/__tests__/rateLimiter.test.ts (15 tests)
✓ worker/utils/__tests__/htmlSanitizer.test.ts (20 tests)
✓ worker/benchmarks/performance.test.ts
```

## 🔒 安全特性

- 无敏感数据存储
- 无外部 API 调用（除了 worker）
- 纯客户端应用
- 输入清理
- 带有敏感数据掩码的错误处理
- 网络通信的 AES-256-GCM 加密

## ⚡ 性能

### 已实施的优化

1. **代码分割**
   - 供应商库分离到块中
   - 延迟加载命令
   - 按需加载重型模块

2. **图像优化**
   - 压缩资产（scp-logo.jpg: 167KB → 146KB）
   - 优化应用图标（icon-512x512.png: 64KB → 62KB）

3. **缓存策略**
   - API 响应的 30 分钟 KV 缓存
   - 静态资产的浏览器缓存头
   - 命令历史限制为 500 条记录

4. **内存管理**
   - 事件监听器清理
   - 终端实例处理
   - 命令历史限制
   - 缓存大小管理

### 性能指标

- **初始加载**: 0.8-1 秒（使用快速启动模式）
- **启动时间**: 0.5 秒（快速模式）/ 2-3 秒（正常模式）
- **捆绑大小**: 55KB（主）+ 分割块
- **测试覆盖率**: 87/87 (100%)

## 🔄 CI/CD

项目使用 GitHub Actions 进行持续集成和部署。

### 工作流程

- **CI 工作流程**: 在推送/PR 时自动运行测试、构建和安全扫描
- **发布工作流程**: 当推送版本标签时创建带有构建工件的发布
- **手动部署**: 使用自定义参数手动触发部署

### 部署

- **Cloudflare Pages**: 自动部署到 `main` 分支
  - 生产 URL: https://scpos.pages.dev
  - 构建命令: `pnpm install --frozen-lockfile && pnpm run build:production`
  - 输出目录: `dist`
  
- **Cloudflare Worker**: 自动部署到 `main`
  - API URL: https://api.scpos.site
  - 包括 D1 数据库和 KV 缓存
  
- **GitHub Pages**: 也可在推送到 master 时使用

### 最近的部署修复

**2026-04-04**: 修复 Cloudflare Pages 部署失败
- 添加缺失的 `uuid` 依赖（关键修复）
- 修复 Service Worker 编译（使用 esbuild 将 sw.ts → sw.js）
- 添加内存限制（NODE_OPTIONS='--max-old-space-size=4096'）
- 添加构建输出目录清理（emptyOutDir: true）
- 所有修复成功部署到生产环境

## 📚 Cloudflare Worker 部署指南

### 前置要求

1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

2. 登录 Cloudflare
```bash
wrangler login
```

### 部署步骤

#### 1. 验证配置

检查 `wrangler.toml` 配置：

```toml
name = "scp-scraper-worker"
main = "index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "SCP_CACHE"
id = "40f0d23a05e14f7484232bc1960e217f"
```

#### 2. 本地测试

启动本地开发服务器：

```bash
cd worker
wrangler dev
```

测试端点：

- `http://localhost:8787/` - API 信息
- `http://localhost:8787/scrape?number=173` - 爬取 SCP-173
- `http://localhost:8787/search?keyword=173` - 搜索 SCP
- `http://localhost:8787/debug?number=173` - 调试模式

#### 3. 部署到 Cloudflare

```bash
cd worker
wrangler deploy
```

#### 4. 验证部署

部署成功后，访问：

```
https://api.scpos.site/
```

### 环境变量

如需配置环境变量，在 `wrangler.toml` 中添加：

```toml
[vars]
ENVIRONMENT = "production"
```

或使用命令行：

```bash
wrangler secret put ENVIRONMENT
```

### KV 命名空间

#### 创建 KV 命名空间

```bash
wrangler kv:namespace create "SCP_CACHE"
```

更新 `wrangler.toml` 中的 `id`。

### 监控

#### 查看日志

```bash
wrangler tail
```

### 故障排查

#### 常见问题

1. **部署失败**
   - 检查 `wrangler.toml` 配置
   - 验证 KV 命名空间 ID
   - 确认依赖已安装

2. **速率限制**
   - 检查 `RateLimiter` 配置
   - 验证 IP 地址获取

3. **CORS 错误**
   - 检查 `CORSManager` 配置
   - 验证允许的来源列表

## 🤝 贡献指南

欢迎贡献！请遵循以下指南：

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

### 开发工作流程

1. **分支策略**
   - `master` - 主要生产分支
   - 功能分支用于新功能
   - Bugfix 分支用于修复

2. **提交消息**
   - 使用常规提交格式
   - 示例：`feat: add new command`, `fix: resolve bug`, `refactor: optimize code`

3. **测试**
   - 合并前所有测试必须通过
   - 保持 100% 测试覆盖率
   - 为新功能添加测试

4. **代码风格**
   - 使用 TypeScript 严格模式
   - 遵循现有代码模式
   - 为复杂逻辑添加注释

## 📄 许可证

本项目使用双重许可模式：

### MIT 许可证（代码）

所有源代码，包括但不限于：
- 应用逻辑和算法
- UI/UX 组件
- 实用函数
- 配置文件

均在 MIT 许可证下许可。有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

### CC BY-SA 3.0（SCP 基金会内容）

所有与 SCP 基金会相关的内容，包括但不限于：
- SCP 对象描述和分类
- SCP 基金会术语和传说
- 收容程序和协议
- 站点信息和安全分类
- 任何对 SCP 基金会实体的引用

均在知识共享署名-相同方式共享 3.0 许可证（CC BY-SA 3.0）下许可。

**您可以：**
- 共享 — 以任何媒介或格式复制和再分发材料
- 改编 — 混音、转换和基于材料构建

**在以下条件下：**
- **署名** — 您必须给予适当的署名，提供许可证的链接，并表明是否进行了更改
- **相同方式共享** — 如果您混音、转换或基于材料构建，您必须以相同的许可证分发您的贡献

SCP 基金会是一个协作创意写作项目。更多信息：
- [SCP Foundation Wiki](https://scp-wiki.net/)
- [CC BY-SA 3.0 License](https://creativecommons.org/licenses/by-sa/3.0/)

## 🙏 鸣谢

- [SCP Foundation](https://scp-wiki.net/) - 灵感来源
- [xterm.js](https://xtermjs.org/) - 终端模拟器库
- [Hammer.js](https://hammerjs.github.io/) - 触摸手势库
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端工具
- [Cloudflare Workers](https://workers.cloudflare.com/) - 无服务器平台

## 📞 联系

如有问题或反馈，请在仓库中打开一个 issue。

## 📝 变更日志

### 版本 0.1.0 (2026-04-02) - 首次正式发布
- **完整平台架构**: 6 层架构实现
  - 核心层：带生命周期管理的依赖注入容器
  - 领域层：业务实体、存储库和服务
  - 应用层：控制器和应用服务
  - 基础设施层：存储库实现和数据访问
  - 平台层：插件系统、事件总线、能力
  - 表示层：Vue 组件和存储

- **插件系统**: 可扩展插件架构
  - 用于动态命令注册的命令插件
  - 用于 UI 定制的主题插件
  - 用于外部数据集成的数据源插件
  - 用于自定义组件的 UI 组件插件

- **性能监控**: 实时性能跟踪
  - PerformanceMonitorService: 指标收集和评分
  - PerformanceOptimizerService: 优化策略
  - 事件驱动架构
  - 可配置的监控间隔

- **多租户支持**: 隔离的租户上下文
  - 租户上下文管理
  - 每租户配置
  - 租户隔离

- **应用模板**: 应用模板系统
  - 用于通用功能的 BaseApplicationTemplate
  - 用于基本模板的 SimpleApplicationTemplate
  - 用于应用生命周期的模板管理器

- **质量保证**: 全面测试
  - 236 个测试通过（100% 通过率）
  - 零 TypeScript 错误
  - 完整类型覆盖
  - 性能基准测试

- **文档**: 广泛的文档
  - 平台架构文档
  - 插件开发指南
  - API 文档
  - 部署指南

### 版本 3.1.0 (2026-04-02) - 平台转型完成
- **第 4 阶段完成**: 平台层实现
  - 能力抽象系统（ITerminalCapability、IDataCapability、IUICapability）
  - 应用模板系统，带有基础模板
  - 多租户支持，带有隔离上下文
  - 部署配置管理（开发、暂存、生产）
  - 用于应用生命周期的模板管理器

- **第 5 阶段完成**: 优化和测试
  - 性能监控系统，带有实时指标
  - 性能优化策略，带有建议
  - 全面测试套件（144 个测试，100% 通过率）
  - 增强的文档和代码审查
  - 性能评分和问题检测

- **架构改进**
  - 完整的分层架构实现
  - 带生命周期管理的依赖注入
  - 事件驱动通信系统
  - 用于可扩展性的插件系统
  - 贯穿始终的类型安全接口

- **质量保证**
  - 所有测试通过（144/144）
  - 零错误的类型检查
  - 全面的文档
  - 性能基准测试

### 版本 3.0.3 (2026-04-02) - 增强的持久性
- 实现 IndexedDB 用于持久数据存储
- 多标签支持，带有状态保存
- 切换标签时保存终端内容
- 侧边栏颜色更新以匹配终端主题
- 改进的移动导航，带有手势控制

### 版本 3.0.2 (2026-04-01) - 主要重构
- 完整的爬虫系统重构
- 70% 代码减少（829 → 255 行）
- 4-6x 性能改进
- 使用 DOMPurify 进行 XSS 保护
- 速率限制（10 req/min/IP）
- 严格的 CORS 控制
- 结构化日志记录和监控
- 全面的安全测试
- 性能基准测试套件
- 部署文档

### 版本 3.0.1 (2026-03-31)
- 性能优化，带有代码分割
- 捆绑大小从 440KB 减少到 55KB（主）
- 添加快速启动模式，加快启动速度
- 改进的移动手势处理
- 增强的错误处理和日志记录
- 添加命令历史限制（500 条记录）
- 优化图像资产

### 版本 3.0.0 (2026-03-30)
- 初始稳定版本
- 完整的命令系统
- 全面的移动支持
- Cloudflare Worker 集成
- 全面的测试套件

---

**安全 • 收容 • 保护**

*SCP Foundation Terminal System v0.1.0*
*安全级别: 4*
*状态: 运行中*
*架构: 分层，支持平台*