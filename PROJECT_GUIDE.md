# SCP-OS 项目架构与快速定位指南

> 本文档旨在帮助开发者快速理解项目结构、定位代码位置，并判断某功能的前后端实现状态。
> 最后更新：2026-05-18

***

## 1. 项目概述

SCP-OS 是一个以 **SCP 基金会** 为主题的 Web 操作系统，采用 Monorepo 架构，包含三个核心包：

| 包                    | 路径                  | 说明        | 技术栈                                         |
| -------------------- | ------------------- | --------- | ------------------------------------------- |
| `@scp-os/app`        | `packages/app/`     | 前端 Web 应用 | Vue 3.5 + TypeScript + Pinia + Tailwind CSS |
| `@scp-os/desktop`    | `packages/desktop/` | 桌面客户端     | Tauri 2 + Rust                              |
| `scp-scraper-worker` | `packages/worker/`  | 后端 API 服务 | Cloudflare Workers + Hono + D1 + KV         |

***

## 2. Monorepo 目录结构

```
scp-os/
├── packages/
│   ├── app/                          # 前端 Web 应用
│   │   ├── src/
│   │   │   ├── application/          # 应用层（控制器、服务）
│   │   │   ├── commands/             # 终端命令处理（40+ 条命令）
│   │   │   ├── components/           # 通用组件（非 GUI）
│   │   │   ├── composables/          # 组合式函数
│   │   │   ├── config/               # 配置管理
│   │   │   ├── constants/            # 常量定义
│   │   │   ├── core/                 # DI 容器与类型
│   │   │   ├── domain/               # 领域层（DDD：实体、值对象、仓库接口）
│   │   │   ├── gui/                  # GUI 层（核心）
│   │   │   │   ├── components/       # GUI 通用组件（窗口、按钮、输入框等）
│   │   │   │   ├── composables/      # GUI 组合式函数（useI18n, useDocsReader, useDashboardData）
│   │   │   │   ├── desktop/          # 桌面端界面（登录屏、桌面、任务栏、开始菜单）
│   │   │   │   ├── mobile/           # 移动端界面
│   │   │   │   ├── registry/         # 工具注册表（ToolRegistry, registerTools.ts）
│   │   │   │   ├── stores/           # GUI 专用 Store（fileManager）
│   │   │   │   ├── themes/           # 主题定义（8 种强调色）
│   │   │   │   └── tools/            # 工具组件（10 款应用）
│   │   │   ├── infrastructure/       # 基础设施层（仓库实现、HTTP 客户端）
│   │   │   ├── platform/             # 平台层（插件、事件、扩展、性能优化器）
│   │   │   ├── shared/               # 共享配置
│   │   │   ├── stores/               # 全局 Pinia Store（auth, notification, theme, admin）
│   │   │   ├── types/                # 类型定义
│   │   │   └── utils/                # 工具函数（filesystem, logger, scraper）
│   │   └── public/                   # 静态资源 + PWA
│   ├── desktop/                      # Tauri 桌面客户端
│   │   ├── src/                      # Rust 源码
│   │   └── icons/                    # 应用图标
│   └── worker/                       # Cloudflare Worker 后端
│       ├── src/
│       │   ├── app.ts                # 主应用：所有 API 路由定义
│       │   ├── db.ts                 # D1 数据库工具函数
│       │   ├── http.ts               # HTTP 工具（cors, json, readJson）
│       │   ├── security.ts           # 安全（JWT, 密码验证, 限流）
│       │   └── types.ts              # 类型定义
│       ├── api/                      # API 路由（旧，可能未使用）
│       ├── errors/                   # 错误处理
│       ├── migrations/               # D1 数据库迁移文件
│       ├── parsers/                  # HTML 解析器
│       └── security/                 # 安全中间件
├── docs/                             # 项目文档（API.md, FAQ.md 等）
├── .github/workflows/                # CI/CD
└── pnpm-workspace.yaml               # 工作区配置
```

***

## 3. 分层架构

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

***

## 4. 工具注册表（10 款内置应用）

所有应用统一在 `packages/app/src/gui/registry/registerTools.ts` 注册。

| ID             | 名称      | 桌面组件                       | 移动组件                           | 窗口配置     | 单例    |
| -------------- | ------- | -------------------------- | ------------------------------ | -------- | ----- |
| `terminal`     | 终端      | `TerminalPanel.vue`        | `MobileTerminal.vue`           | 650x380  | 否     |
| `filemanager`  | 文件管理器   | `FileManagerWindow.vue`    | `MobileFileManager.vue`        | 750x480  | 否     |
| `editor`       | 代码编辑器   | `EditorWindow.vue`         | `MobileEditor.vue`             | 700x500  | 否     |
| `settings`     | 系统设置    | `SettingsWindow.vue`       | `MobileSettings.vue`           | 800x550  | 否     |
| `chat`         | 实时聊天    | `PCChatWindow.vue`         | `ChatWindow.vue`               | 400x600  | 否     |
| `dash`         | 性能仪表盘   | `PCDashboard.vue`          | `MobileDash.vue`               | 700x550  | 否     |
| `feedback`     | 反馈系统    | `PCFeedbackWindow.vue`     | `MobileFeedback.vue`           | 400x600  | 否     |
| `docs`         | SCP 阅读器 | `PCDocsWindow.vue`         | `MobileDocs.vue`               | 800x600  | 否     |
| `notification` | 通知中心    | `PCNotificationCenter.vue` | `MobileNotificationCenter.vue` | 380x520  | 否     |
| `admin`        | 管理后台    | `AdminLayout.vue`          | `AdminLayout.vue`              | 1200x800 | **是** |

### 快速定位：新增一款应用

1. 在 `packages/app/src/gui/tools/` 下新建目录和组件（桌面端 + 移动端）
2. 在 `packages/app/src/gui/registry/registerTools.ts` 中 `ToolRegistry.register()`
3. 如需后端支持，在 `packages/worker/src/app.ts` 中添加路由
4. 如需 i18n，在 `packages/app/src/locales/index.ts` 中添加词条

***

## 5. 后端 API 路由完整清单

所有路由定义于 `packages/worker/src/app.ts`。

### 5.1 SCP 数据查询

| 方法  | 路径                                               | 功能         | 状态  |
| --- | ------------------------------------------------ | ---------- | --- |
| GET | `/scrape?number={n}&branch={en\|cn}`             | 抓取 SCP 详情  | 已实现 |
| GET | `/search?keyword={k}&clearance_level={l}`        | 搜索 SCP     | 已实现 |
| GET | `/list?limit={n}&offset={n}&clearance_level={l}` | 列表 SCP     | 已实现 |
| GET | `/stats`                                         | 数据库统计      | 已实现 |
| GET | `/debug?number={n}&branch={b}`                   | 原始 HTML 调试 | 已实现 |
| GET | `/image-proxy?url={url}`                         | 图片代理       | 已实现 |

### 5.2 聊天

| 方法   | 路径                                                   | 功能           | 状态  |
| ---- | ---------------------------------------------------- | ------------ | --- |
| POST | `/chat/send`                                         | 发送消息         | 已实现 |
| GET  | `/chat/messages?room_id={id}&after={time}&limit={n}` | 获取消息         | 已实现 |
| GET  | `/chat/rooms`                                        | 列出房间         | 已实现 |
| POST | `/chat/rooms`                                        | 创建房间         | 已实现 |
| PUT  | `/chat/rooms/:id`                                    | 修改房间         | 已实现 |
| DELETE | `/chat/rooms/:id`                                  | 删除房间         | 已实现 |
| POST | `/chat/nickname`                                     | 设置昵称         | 已实现 |
| POST | `/chat/broadcast`                                    | 广播消息         | 已实现 |
| PUT  | `/chat/messages/:id`                                 | 编辑消息         | 已实现 |
| DELETE | `/chat/messages/:id`                               | 删除消息         | 已实现 |

### 5.3 反馈系统

| 方法   | 路径                                    | 功能        | 状态  |
| ---- | ------------------------------------- | --------- | --- |
| POST | `/feedback/submit`                    | 提交反馈      | 已实现 |
| GET  | `/feedback/list`                      | 反馈列表      | 已实现 |
| GET  | `/feedback/list-with-votes`           | 列表（含投票状态） | 已实现 |
| GET  | `/feedback/categories`                | 分类统计      | 已实现 |
| POST | `/feedback/comment`                   | 发表评论      | 已实现 |
| GET  | `/feedback/comments?feedback_id={id}` | 评论列表      | 已实现 |
| POST | `/feedback/vote`                      | 投票（上/下）   | 已实现 |
| POST | `/feedback/like`                      | 点赞（旧）     | 已实现 |

### 5.4 用户

| 方法   | 路径                                      | 功能      | 状态  |
| ---- | --------------------------------------- | ------- | --- |
| POST | `/api/user/register`                    | 注册/更新昵称 | 已实现 |
| GET  | `/api/user/check-nickname?nickname={n}` | 检查昵称    | 已实现 |
| GET  | `/api/user/:userId`                     | 获取用户信息  | 已实现 |

### 5.5 性能监控

| 方法   | 路径                       | 功能     | 状态          |
| ---- | ------------------------ | ------ | ----------- |
| POST | `/performance`           | 上报性能指标 | 已实现（但前端未调用） |
| GET  | `/performance?limit={n}` | 查询性能指标 | 已实现         |

### 5.6 SCP 阅读器（Docs）

| 方法  | 路径                                                                                            | 功能       | 状态  |
| --- | --------------------------------------------------------------------------------------------- | -------- | --- |
| GET | `/docs/items?limit={n}&offset={n}&q={q}&scp_class={c}&clearance_level={l}&tag={t}&series={s}` | SCP 条目列表 | 已实现 |
| GET | `/docs/item/:scpNumber`                                                                       | SCP 条目详情 | 已实现 |
| GET | `/docs/content/:scpNumber`                                                                    | SCP 内容文本 | 已实现 |
| GET | `/docs/tales?limit={n}&offset={n}`                                                            | 故事列表     | 已实现 |
| GET | `/docs/hubs?limit={n}&offset={n}`                                                             | Hub 列表   | 已实现 |
| GET | `/docs/goi?limit={n}&offset={n}`                                                              | GOI 条目列表 | 已实现 |

### 5.7 通知

| 方法     | 路径                                              | 功能               | 状态      |
| ------ | ----------------------------------------------- | ---------------- | ------- |
| GET    | `/notifications?unread={true\|false}&limit={n}` | 获取通知             | 已实现     |
| POST   | `/notifications/mark-read`                      | 标记已读             | 已实现     |
| DELETE | `/notifications/:id`                            | 删除通知             | 已实现     |
| GET    | `/notifications/preferences`                    | 获取偏好设置           | 已实现     |
| POST   | `/notifications/preferences`                    | 更新偏好设置           | 已实现     |
| **缺失** | —                                               | 自动创建通知（反馈评论/点赞时） | **未实现** |

### 5.8 文件存储（R2 云存储）

| 方法     | 路径              | 功能   | 状态  |
| ------ | --------------- | ---- | --- |
| POST   | `/files/upload` | 上传文件 | 已实现 |
| GET    | `/files`        | 文件列表 | 已实现 |
| GET    | `/files/quota`  | 配额查询 | 已实现 |
| GET    | `/files/:key`   | 获取文件 | 已实现 |
| PUT    | `/files/:key`   | 更新文件 | 已实现 |
| DELETE | `/files/:key`   | 删除文件 | 已实现 |

> 注：基于 Cloudflare R2 对象存储实现，支持自动通知和配额管理。

### 5.9 管理后台

所有 `/admin/*` 和 `/api/admin/*` 路由均需管理员权限。

| 方法     | 路径                            | 功能                                | 状态                  |
| ------ | ----------------------------- | --------------------------------- | ------------------- |
| POST   | `/admin/auth/login`           | 管理员登录                             | 已实现                 |
| GET    | `/admin/auth/verify`          | 验证 Token                          | 已实现                 |
| GET    | `/admin/users`                | 用户列表                              | 已实现                 |
| GET    | `/admin/users/export`         | 导出用户                              | 已实现                 |
| GET    | `/admin/users/:id`            | 用户详情                              | 已实现                 |
| POST   | `/admin/users/batch`          | 批量操作                              | 已实现                 |
| POST   | `/admin/users/:id/ban`        | 封禁用户                              | 已实现                 |
| POST   | `/admin/users/:id/unban`      | 解封用户                              | 已实现                 |
| DELETE | `/admin/users/:id`            | 删除用户                              | 已实现                 |
| GET    | `/admin/content/:type`        | 内容列表（scp/tales/hubs/goi/feedback） | 已实现                 |
| GET    | `/admin/content/:type/export` | 导出内容                              | 已实现                 |
| PUT    | `/admin/content/:type/:id`    | 更新内容                              | 已实现                 |
| DELETE | `/admin/content/:type/:id`    | 删除内容                              | 已实现                 |
| POST   | `/admin/content/:type/batch`  | 批量内容操作                            | 已实现                 |
| POST   | `/admin/content/:type/import` | 导入内容                              | 已实现                 |
| GET    | `/admin/chat/messages`        | 聊天消息管理                            | 已实现                 |
| DELETE | `/admin/chat/messages/:id`    | 删除聊天消息                            | 已实现                 |
| GET    | `/admin/chat/rooms`           | 聊天房间管理                            | 已实现                 |
| PUT    | `/admin/chat/rooms/:id`       | 更新聊天房间                            | 已实现                 |
| DELETE | `/admin/chat/rooms/:id`       | 删除聊天房间                            | 已实现                 |
| GET    | `/admin/feedback`             | 反馈管理                              | 已实现                 |
| PUT    | `/admin/feedback/:id/status`  | 更新反馈状态                            | 已实现                 |
| DELETE | `/admin/feedback/:id`         | 删除反馈                              | 已实现                 |
| GET    | `/admin/settings`             | 系统设置                              | 已实现                 |
| PUT    | `/admin/settings`             | 更新系统设置                            | 已实现（仅 super\_admin） |
| GET    | `/admin/stats/dashboard`      | 仪表盘统计                             | 已实现                 |
| GET    | `/admin/stats/trends`         | 趋势数据                              | 已实现                 |
| GET    | `/admin/logs`                 | 管理员日志                             | 已实现                 |

***

## 6. 数据库结构（D1）

### 6.1 SCP\_DB（主数据库）

| 表名                         | 用途                                                      |
| -------------------------- | ------------------------------------------------------- |
| `scp_index`                | SCP 索引（id, name, object\_class, tags, clearance\_level） |
| `cache_entries`            | KV 缓存（key, value, expires\_at）                          |
| `chat_messages`            | 聊天消息                                                    |
| `chat_rooms`               | 聊天房间                                                    |
| `feedbacks`                | 反馈条目                                                    |
| `feedback_comments`        | 反馈评论                                                    |
| `feedback_votes`           | 反馈投票                                                    |
| `users`                    | 注册用户                                                    |
| `user_settings`            | 用户设置（key-value，如昵称）                                     |
| `rate_limits`              | 速率限制记录                                                  |
| `performance_metrics`      | 性能指标上报数据                                                |
| `notifications`            | 用户通知                                                    |
| `notification_preferences` | 通知偏好设置                                                  |
| `admin_users`              | 管理员账户                                                   |
| `admin_logs`               | 管理员操作日志                                                 |
| `system_settings`          | 系统设置                                                    |

### 6.2 SCP\_READER\_DB（阅读器数据库）

| 表名          | 用途              |
| ----------- | --------------- |
| `scp_items` | SCP 条目（9526+ 条） |
| `scp_tales` | 故事（6487+ 篇）     |
| `scp_hubs`  | Hub（126+ 个）     |
| `scp_goi`   | GOI 条目（711+ 条）  |

***

## 7. 全局 Store（Pinia）

| Store               | 文件路径                              | 职责                    |
| ------------------- | --------------------------------- | --------------------- |
| `authStore`         | `src/stores/authStore.ts`         | 用户认证、JWT、昵称、authFetch |
| `notificationStore` | `src/stores/notificationStore.ts` | 通知列表、轮询、偏好设置          |
| `themeStore`        | `src/stores/themeStore.ts`        | 主题、强调色、壁纸、暗色模式        |
| `adminStore`        | `src/stores/adminStore.ts`        | 管理员认证、Token、权限检查      |
| `fileManager`       | `src/gui/stores/fileManager.ts`   | 虚拟文件系统状态、视图模式、收藏      |

***

## 8. 关键 Composables

| Composable              | 文件路径                                           | 用途                   |
| ----------------------- | ---------------------------------------------- | -------------------- |
| `useI18n`               | `src/gui/composables/useI18n.ts`               | 国际化（自定义，非 vue-i18n）  |
| `useDocsReader`         | `src/gui/composables/useDocsReader.ts`         | SCP 阅读器数据获取、缓存、收藏    |
| `useDashboardData`      | `src/gui/composables/useDashboardData.ts`      | 性能仪表盘实时数据（本地浏览器 API） |
| `useDesktopEnvironment` | `src/gui/composables/useDesktopEnvironment.ts` | 桌面环境（窗口、任务栏、壁纸）      |
| `useMobileEnvironment`  | `src/gui/composables/useMobileEnvironment.ts`  | 移动端环境                |
| `useWindowManager`      | `src/gui/composables/useWindowManager.ts`      | 窗口管理（打开/关闭/最小化/聚焦）   |

***

## 9. 快速定位指南

### 9.1 按功能定位

| 想修改什么       | 去哪里找                                                        |
| ----------- | ----------------------------------------------------------- |
| 新增一款内置应用    | `gui/registry/registerTools.ts` + `gui/tools/`              |
| 修改终端命令      | `src/commands/index.ts`                                     |
| 修改虚拟文件系统逻辑  | `src/utils/filesystem.ts` + `src/gui/stores/fileManager.ts` |
| 修改主题/颜色     | `src/gui/themes/` + `src/stores/themeStore.ts`              |
| 修改窗口行为      | `src/gui/composables/useWindowManager.ts`                   |
| 修改桌面布局      | `src/gui/desktop/DesktopScreen.vue` + `src/gui/components/` |
| 修改移动端布局     | `src/gui/mobile/MobileHomeScreen.vue`                       |
| 修改 i18n 文本  | `src/locales/index.ts`（中英文在同一文件）                            |
| 修改后端路由      | `packages/worker/src/app.ts`                                |
| 修改数据库表结构    | `packages/worker/migrations/`                               |
| 修改限流策略      | `packages/worker/src/app.ts` (`rateLimit` 函数)               |
| 修改 SCP 解析逻辑 | `packages/worker/src/app.ts` (`parseScp` 函数) + `parsers/`   |
| 修改管理员权限     | `packages/worker/src/app.ts` (`requiredAdmin`, `hasRole`)   |

### 9.2 按 Bug/问题定位

| 问题现象        | 可能位置                                                            |
| ----------- | --------------------------------------------------------------- |
| 某应用打不开      | `gui/registry/registerTools.ts` 检查组件导入路径                        |
| 窗口无法拖拽/调整大小 | `gui/components/` 下的窗口组件（如 `SCPWindow.vue`）                     |
| 终端命令不生效     | `src/commands/index.ts` 检查命令注册 + 执行逻辑                           |
| 文件操作不持久化    | `src/utils/filesystem.ts`（基于内存 + IndexedDB）                     |
| API 返回 401  | `src/stores/authStore.ts` 检查 `authFetch` + JWT 逻辑               |
| API 返回 429  | `packages/worker/src/app.ts` 检查 `rateLimit` 函数                  |
| 聊天消息不同步     | `gui/tools/chat/PCChatWindow.vue` + 后端 `/chat/messages`         |
| 通知不显示       | `src/stores/notificationStore.ts` + 后端 `/notifications`         |
| Docs 内容加载失败 | `src/gui/composables/useDocsReader.ts` + 后端 `/docs/content/:id` |
| 管理员页面无法访问   | `src/stores/adminStore.ts` + 后端 `/admin/auth/verify`            |
| 上传文件失败      | `packages/worker/src/app.ts` (`registerFiles` 返回 410)           |

### 9.3 按技术栈定位

| 技术          | 文件位置                                                                          |
| ----------- | ----------------------------------------------------------------------------- |
| Vue 组件      | `packages/app/src/gui/**/*.vue`                                               |
| Pinia Store | `packages/app/src/stores/*.ts` + `packages/app/src/gui/stores/*.ts`           |
| Composable  | `packages/app/src/gui/composables/*.ts` + `packages/app/src/composables/*.ts` |
| 工具函数        | `packages/app/src/utils/*.ts`                                                 |
| 后端路由        | `packages/worker/src/app.ts`                                                  |
| 数据库操作       | `packages/worker/src/db.ts`                                                   |
| 安全/认证       | `packages/worker/src/security.ts`                                             |
| Tauri/Rust  | `packages/desktop/src/`                                                       |

***

## 10. 数据流与通信

### 10.1 前端 → 后端通信

```
Vue 组件
  → Composable / Store
    → authStore.authFetch() 或普通 fetch()
      → Worker API (Cloudflare Workers)
        → D1 Database / KV Cache
```

### 10.2 认证流程

```
1. 用户访问页面 → 前端生成随机 userId，存入 localStorage
2. 前端请求需认证的 API 时，在 Header 中携带 `Authorization: Bearer <userId>`
3. 后端 `userFromRequest()` 解析并验证 userId
4. 管理员登录 → 后端签发 JWT → 前端存储 admin token → 后续请求携带 Admin Token
```

### 10.3 聊天消息流

```
发送：PCChatWindow.vue → authFetch POST /chat/send → D1 chat_messages
接收：PCChatWindow.vue → fetch GET /chat/messages?room_id={id} → 轮询（非 WebSocket）
      同时有 ws 对象（但后端无 WebSocket 端点，可能为预留）
```

### 10.4 文件系统流

```
文件管理器 → fileManager Store → filesystem utility（内存虚拟文件系统）
             ↓
         IndexedDB 持久化（通过 filesystem 内部实现）
             ↓
         无云端同步（上传按钮无后端支持）
```

***

## 11. 构建与部署

| 命令                     | 作用                       |
| ---------------------- | ------------------------ |
| `pnpm dev:development` | Web 开发模式（development 环境） |
| `pnpm dev:production`  | Web 开发模式（production 环境）  |
| `pnpm build`           | 构建 Web 应用                |
| `pnpm desktop:dev`     | Tauri 桌面端开发              |
| `pnpm desktop:build`   | Tauri 桌面端构建              |
| `pnpm worker:dev`      | Worker 本地开发              |
| `pnpm worker:deploy`   | Worker 部署到 Cloudflare    |
| `pnpm test`            | 运行测试                     |
| `pnpm typecheck`       | TypeScript 类型检查          |
| `pnpm lint`            | ESLint 自动修复              |
| `pnpm format`          | Prettier 格式化             |

***

## 12. 环境变量

位于 `packages/app/.env` 或 `.env.development` / `.env.production`：

| 变量                             | 说明            | 默认值                          |
| ------------------------------ | ------------- | ---------------------------- |
| `VITE_WORKER_API_URL`          | Worker API 地址 | `https://api.woodcat.online` |
| `VITE_API_TIMEOUT`             | API 超时时间（ms）  | `15000`                      |
| `VITE_CACHE_DURATION`          | 缓存有效期（ms）     | `1800000`（30分钟）              |
| `VITE_CACHE_MAX_SIZE`          | 最大缓存条目数       | `100`                        |
| `VITE_TERMINAL_SCROLLBACK`     | 终端回滚行数        | `1000`                       |
| `VITE_TERMINAL_TAB_STOP_WIDTH` | Tab 宽度        | `4`                          |
| `VITE_APP_VERSION`             | 应用版本          | `0.1.0`                      |
| `VITE_APP_NAME`                | 应用名称          | `SCP-OS`                     |

***

## 13. 扩展与插件系统

| 扩展点   | 位置                                      | 说明                                    |
| ----- | --------------------------------------- | ------------------------------------- |
| 插件注册  | `src/platform/plugin/plugin-manager.ts` | 4 种插件类型（命令/主题/数据源/UI 组件）              |
| 事件总线  | `src/platform/event/event-bus.ts`       | 跨模块事件驱动通信                             |
| DI 容器 | `src/core/container.ts`                 | 支持 Singleton/Scoped/Transient，含循环依赖检测 |
| 工具注册表 | `src/gui/registry/ToolRegistry.ts`      | 动态注册应用                                |

***

## 14. 常用修改示例

### 14.1 新增一个终端命令

```typescript
// packages/app/src/commands/index.ts
registerCommand({
  name: 'mycommand',
  description: 'My custom command',
  handler: async (ctx, args) => {
    ctx.writeln('Hello!')
  }
})
```

### 14.2 新增一个后端 API

```typescript
// packages/worker/src/app.ts
app.get('/myapi', async (c) => {
  return json({ success: true, data: 'hello' })
})
```

### 14.3 修改 i18n 文本

```typescript
// packages/app/src/locales/index.ts
'en': {
  'my.new.key': 'New Text',
},
'zh-CN': {
  'my.new.key': '新文本',
}
```

### 14.4 修改文件系统默认目录

```typescript
// packages/app/src/utils/filesystem.ts
// 修改初始化时的目录结构
```

***

## 15. 最近更新（2026-05-18）

### 15.1 已实现功能

| 功能             | 提交     | 说明                                                     |
| -------------- | ------ | ------------------------------------------------------ |
| 聊天消息编辑/删除    | ed4db1c | 支持用户编辑和删除自己发送的消息                                     |
| GOI 公共 API     | 332f5fc | 新增 `/docs/goi` 端点，支持 GOI 条目列表查询                      |
| R2 云文件存储      | 61f5b21 | 基于 Cloudflare R2 实现文件上传/下载/配额管理                      |
| 批量操作增强        | 592a873 | 管理后台支持 `update_status` 和 `move_category` 批量操作           |
| CSV 导出         | cd017c0 | 管理后台内容导出支持 CSV 格式                                     |
| 导入校验与冲突检测    | 63cd34f | 内容导入时添加字段校验和唯一性冲突检测                                  |
| 自动通知          | 61f5b21 | 反馈评论/点赞时自动创建通知记录                                     |

### 15.2 技术改进

- **Worker 后端重构**：迁移至 Hono 框架，提升路由处理性能
- **聊天室管理**：支持用户端修改和删除聊天室（需为创建者或管理员）
- **管理后台**：完整的用户/内容/聊天/反馈/系统设置管理界面

### 15.3 待完成功能

参见 `UNIMPLEMENTED_FEATURES.csv` 获取完整的未实现功能清单。

***

> 本文档随项目演进需要定期更新。如遇结构变动，请同步修正本指南。

