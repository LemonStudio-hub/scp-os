# 常见问题解答 (FAQ)

---

## 目录

- [通用问题](#通用问题)
- [安装与运行](#安装与运行)
- [终端使用](#终端使用)
- [SCP 数据查询](#scp-数据查询)
- [GUI 与界面](#gui-与界面)
- [桌面端](#桌面端)
- [Worker 后端](#worker-后端)
- [开发相关](#开发相关)

---

## 通用问题

### SCP-OS 是什么？

SCP-OS 是一个以 SCP 基金会为主题的模拟操作系统终端。它将 SCP 维基的内容以沉浸式终端体验呈现，用户可以通过命令行查询 SCP 对象信息、浏览收容程序、管理虚拟文件系统，并享受桌面/移动双端适配的 GUI 体验。

### SCP-OS 是官方产品吗？

不是。SCP-OS 是一个社区驱动的开源项目，仅供教育和娱乐目的使用。SCP 基金会内容的使用遵循 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) 许可协议。

### 支持哪些平台？

- **Web**：任何现代浏览器（Chrome、Firefox、Safari、Edge）
- **桌面**：Windows、macOS、Linux（通过 Tauri）
- **移动**：通过浏览器访问，响应式适配手机和平板

### 需要网络连接吗？

大部分功能可以离线使用（终端命令、虚拟文件系统、本地设置等）。SCP 数据查询和聊天功能需要网络连接。

---

## 安装与运行

### pnpm install 报错怎么办？

1. 确认 Node.js 版本 >= 18.0.0：`node -v`
2. 确认 pnpm 版本 >= 8.0.0：`pnpm -v`
3. 尝试清除缓存：`pnpm store prune`
4. 删除 `node_modules` 和 lockfile 后重新安装：
   ```bash
   rm -rf node_modules packages/*/node_modules pnpm-lock.yaml
   pnpm install
   ```

### 开发服务器启动失败？

1. 检查端口 5173 是否被占用
2. 检查 `.env.development` 文件是否存在且配置正确
3. 查看终端错误信息，常见问题：
   - 依赖未安装：运行 `pnpm install`
   - TypeScript 错误：运行 `pnpm typecheck` 查看详情

### 构建失败？

1. 运行 `pnpm typecheck` 检查类型错误
2. 运行 `pnpm lint:check` 检查代码规范
3. 确保所有依赖已安装：`pnpm install`
4. 清除构建缓存：删除 `dist/` 目录后重新构建

---

## 终端使用

### 命令不生效？

- 确认命令拼写正确（输入 `help` 查看所有可用命令）
- 注意命令区分大小写
- 某些命令需要参数，如 `info 173` 而不是 `info`

### 如何查询中文分部的 SCP？

使用 `CN-` 前缀：

```bash
info CN-173
```

搜索也支持中文关键词：

```bash
search 雕像
```

### 终端显示乱码？

- 确认浏览器支持 UTF-8 编码
- 尝试调整终端字体大小（设置 → 终端配置）
- 移动端可能需要横屏查看长文本

### 命令历史丢失？

命令历史存储在内存中，刷新页面后会丢失。标签页状态通过 IndexedDB 持久化，刷新后会自动恢复。

---

## SCP 数据查询

### 查询 SCP 返回错误？

可能的原因：

1. **网络问题**：运行 `network` 命令测试与 Wiki 的连接
2. **编号不存在**：确认 SCP 编号有效（0-9999）
3. **Wiki 页面格式变化**：爬虫可能需要更新以适配新的页面结构
4. **API 超时**：重试或稍后再试

### 搜索结果不准确？

- 搜索功能基于 SCP Wiki 网站搜索，结果取决于 Wiki 的搜索引擎
- 尝试使用更具体的关键词
- 使用 `scp-list` 浏览已知 SCP 列表
- 使用 `info <编号>` 直接查询特定 SCP

### 缓存数据过期？

缓存有效期为 30 分钟。如需获取最新数据：
- 等待缓存过期后重新查询
- 或清除浏览器缓存后重新查询

---

## GUI 与界面

### 窗口无法拖拽？

- 确认拖拽的是窗口标题栏区域
- 拖拽需要超过 5px 的移动阈值才会触发
- 移动端不支持窗口拖拽（使用全屏模式）

### 窗口大小调整异常？

- 从窗口边缘或角落拖拽调整大小
- 确认窗口未处于最大化状态
- 每个工具有最小尺寸限制

### 主题切换不生效？

- 刷新页面后重试
- 检查浏览器是否支持 CSS 自定义属性
- 某些浏览器扩展可能覆盖样式

### 壁纸上传失败？

- 支持常见图片格式（PNG、JPG、WebP）
- 图片大小限制取决于浏览器 IndexedDB 存储
- 尝试压缩图片后重新上传

### 移动端布局异常？

- 确认浏览器视口设置正确
- 尝试旋转设备重新触发布局计算
- 某些浏览器可能需要添加到主屏幕以获得最佳体验

---

## 桌面端

### Tauri 构建失败？

**Linux**：
- 确认已安装所有系统依赖（见 [安装指南](docs/INSTALLATION.md#linux-依赖)）
- 检查 Rust 版本：`rustc --version`（需要 stable）

**Windows**：
- 安装 Visual Studio C++ Build Tools
- 安装 WebView2 Runtime（Windows 10/11 通常已内置）

**macOS**：
- 安装 Xcode Command Line Tools：`xcode-select --install`

### 桌面端无法连接 API？

- 检查 CSP 配置是否允许连接 API 域名
- 确认 `tauri.conf.json` 中 `security.csp.connect-src` 包含 API 地址
- 检查网络代理设置

### 桌面端窗口尺寸异常？

- 窗口默认尺寸 1200x800，最小 800x600
- 可在 `tauri.conf.json` 中修改默认尺寸
- 删除本地存储的窗口状态后重启

---

## Worker 后端

### Worker 本地开发报错？

1. 确认已安装 Wrangler：`wrangler --version`
2. 检查 `wrangler.toml` 配置
3. 确认 D1 数据库和 KV 命名空间已创建
4. 运行数据库迁移

### D1 数据库迁移失败？

```bash
# 检查数据库是否存在
wrangler d1 list

# 重新执行迁移
wrangler d1 execute scp-database --file=migrations/0001_init.sql

# 查看数据库信息
wrangler d1 info scp-database
```

### Worker 部署失败？

1. 确认 Cloudflare 账户已登录：`wrangler whoami`
2. 检查 `wrangler.toml` 中的 `database_id` 和 KV `id` 是否正确
3. 确认路由配置的域名已在 Cloudflare 管理

### API 速率限制触发？

- 每个 IP 限制 60 次/分钟
- 聊天消息限制 10 条/分钟/用户
- 等待冷却期后重试
- 开发环境可在 `rateLimiter.ts` 中调整限制

---

## 开发相关

### 如何添加新的终端命令？

1. 在 `src/constants/commands.ts` 中注册命令
2. 在 `src/commands/` 中实现命令处理逻辑
3. 添加对应的类型定义
4. 编写测试

### 如何添加新的 GUI 工具？

参考 [贡献指南](CONTRIBUTING.md#添加新工具) 中的详细步骤。

### 如何调试 Worker？

```bash
# 本地开发模式（带热重载）
cd packages/worker
pnpm dev

# 查看实时日志
pnpm worker:tail

# 使用 /debug 端点获取原始 HTML
curl "http://localhost:8787/debug?number=173"
```

### 如何运行特定测试？

```bash
# 运行单个测试文件
pnpm vitest run src/gui/composables/__tests__/useDraggable.test.ts

# 运行匹配模式的测试
pnpm vitest run --grep "window manager"

# 监听模式
pnpm vitest watch
```

### 如何查看测试覆盖率？

```bash
pnpm test:coverage
```

覆盖率报告生成在 `coverage/` 目录，打开 `coverage/index.html` 查看详细报告。

### IndexedDB 数据如何清除？

打开浏览器开发者工具 → Application → IndexedDB → 删除 `scp-os-db` 数据库。

### 如何添加新的插件类型？

1. 在 `src/platform/plugins/plugin.interface.ts` 中添加新类型
2. 在 `src/platform/plugins/plugin-manager.ts` 中更新验证逻辑
3. 在 `src/platform/extensions/extension-point.ts` 中注册扩展点
4. 编写测试

### 如何修改设计令牌？

编辑 `src/gui/design-tokens.ts`，修改后调用 `injectGUITokens()` 会自动更新所有 CSS 变量。所有组件通过 `var(--gui-*)` 消费令牌值。

---

## 更多帮助

如果你的问题未在此列表中找到答案，可以：

1. 搜索 [GitHub Issues](https://github.com/your-username/scp-os/issues)
2. 提交新的 Issue
3. 在聊天系统中与其他用户交流
