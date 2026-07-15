# SCP-OS 本地插件与 App 平台规范 v1.2

本文档定义 SCP-OS 第三方本地插件/App 的接入规范。v1.2 仍只支持用户主动选择的本地目录或 ZIP 包，不支持远程市场、URL 安装、签名审核和自动更新。

## 能力矩阵

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 本地目录导入 | v1 | App Manager 选择目录导入 |
| 本地 ZIP 导入 | v1 | ZIP 使用同一包结构，允许一层外壳目录 |
| command 插件 | v1 | 通过统一 command registry 接入终端执行、help、autocomplete |
| sandbox iframe App | v1 | 完整网站式 App 主路径 |
| `window.scp` API | v1.1 | storage、window、ui、theme、notify |
| 统一权限表 | v1.2 | 权限有风险等级、适用 runtime、API 映射和 planned 状态 |
| 严格包校验 | v1.2 | manifest、路径、大小、命令、权限统一诊断 |
| 本地更新/回滚 | v1.2 | 同 ID 重新导入视为更新，失败回滚旧包 |
| Vue/Vite 本地构建包 | v1.2 | 导入构建后的 `dist` 目录或 ZIP |
| 远程市场/URL 安装 | vNext | 不在 v1.2 范围 |
| Vue 组件式插件 | vNext | 作为草案方向，不是 v1.2 主路径 |

## 包结构

包根目录必须包含 `scp-app.json`：

```text
my-app/
  scp-app.json
  index.html
  assets/
    main.js
    style.css
```

安装成功后，SCP-OS 会复制包文件到虚拟路径：

```text
/home/scp/apps/<appId>
```

目录和 ZIP 限制：

| 限制 | v1.2 值 |
| --- | --- |
| 包总大小 | 50MB |
| 单文件大小 | 10MB |
| 文件数量 | 1000 |
| 路径 | 禁止绝对路径、空路径、`../`、重复 `scp-app.json` |

## Manifest

`scp-app.json` 示例：

```json
{
  "schemaVersion": 1,
  "id": "local.browser",
  "name": "Browser",
  "version": "1.0.0",
  "runtime": "iframe-app",
  "entry": "index.html",
  "description": "A sandboxed browser app",
  "author": "SCP-OS",
  "icon": "search",
  "permissions": ["network", "storage"],
  "sandbox": {
    "allowSameOrigin": true,
    "allowPopups": true,
    "allowTopNavigationByUserActivation": false
  },
  "window": {
    "width": 1040,
    "height": 720,
    "minWidth": 520,
    "minHeight": 360,
    "resizable": true
  }
}
```

必填字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `schemaVersion` | number | 当前固定为 `1` |
| `id` | string | 全局唯一，允许字母、数字、`.`、`_`、`-` |
| `name` | string | 展示名称 |
| `version` | string | 包版本 |
| `runtime` | string | `iframe-app` 或 `command-module` |
| `entry` | string | 相对包根目录的入口文件 |

可选字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `description` | string | 描述 |
| `author` | string | 作者 |
| `icon` | string | 桌面/窗口图标名 |
| `permissions` | string[] | 权限声明 |
| `commands` | array | command 插件命令元数据 |
| `window` | object | 默认窗口尺寸 |
| `sandbox` | object | iframe sandbox 额外能力 |

## 权限表

v1.2 的权限由统一 registry 管理。未知权限会拒绝安装；`planned` 权限可声明、可展示风险，但运行时没有真实 API。

| 权限 | 风险 | 状态 | Runtime | 对应 API |
| --- | --- | --- | --- | --- |
| `storage` | low | available | iframe, command | `storage:get/set/remove` |
| `notifications` | low | available | iframe | `notify` |
| `window.control` | low | available | iframe | `window:setTitle`, `window:resize` |
| `ui.cursor` | medium | available | iframe | `ui:setCursor`, `ui:resetCursor` |
| `theme.read` | low | available | iframe | `theme:getCurrent` |
| `theme.write` | medium | available | iframe | `theme:setAccent`, `theme:resetAccent` |
| `network` | medium | planned | iframe | 暂无 |
| `clipboard.read` | high | planned | iframe | 暂无 |
| `clipboard.write` | medium | planned | iframe | 暂无 |
| `filesystem.read` | high | planned | iframe, command | 暂无 |
| `filesystem.write` | high | planned | iframe, command | 暂无 |
| `terminal.run` | high | planned | iframe | 暂无 |
| `shortcuts.write` | high | planned | iframe | 暂无 |

App Manager 会按风险等级显示权限 chip。高风险权限导入前会二次确认。

## Runtime: iframe-app

`iframe-app` 是完整网站式 App 的主路径。SCP-OS 会把入口 HTML 放进 sandbox iframe，并注入 `window.scp`。

默认 sandbox token：

```text
allow-scripts allow-forms allow-modals allow-downloads
```

可选 sandbox 字段：

| 字段 | 说明 |
| --- | --- |
| `allowSameOrigin` | 加入 `allow-same-origin`，现代 SPA 或嵌套网页容器可能需要 |
| `allowPopups` | 加入 `allow-popups` |
| `allowTopNavigationByUserActivation` | 加入 `allow-top-navigation-by-user-activation` |

注意：`allowSameOrigin` 会降低隔离强度，只给可信本地 App 使用。

## Runtime: command-module

`command-module` 用于扩展终端命令。入口模块必须导出 `activate(ctx)`：

```json
{
  "schemaVersion": 1,
  "id": "local.hello",
  "name": "Hello Commands",
  "version": "1.0.0",
  "runtime": "command-module",
  "entry": "commands.js",
  "commands": [
    {
      "name": "hello",
      "aliases": ["hi"],
      "description": "Print a greeting",
      "usage": "hello [name]",
      "permissions": ["storage"]
    }
  ]
}
```

```js
export function activate(ctx) {
  ctx.commands.register({
    name: "hello",
    aliases: ["hi"],
    description: "Print a greeting",
    usage: "hello [name]",
    handler(args, write, writeln) {
      writeln(`Hello ${args[0] || "SCP-OS"}`)
    }
  })
}
```

命令名和 alias 与内置命令或已注册插件命令冲突时，包会被拒绝加载。

## 校验与诊断

CLI：

```bash
pnpm validate:local-app examples/local-apps/api-lab
pnpm validate:local-app examples/local-apps/vue-vite-template/dist
```

validator 返回模型：

```ts
{
  ok: boolean
  manifest?: LocalAppManifest
  errors: Diagnostic[]
  warnings: Diagnostic[]
  permissions: PermissionSummary[]
  risk: "low" | "medium" | "high"
}
```

常见错误：

| code | 说明 |
| --- | --- |
| `MANIFEST_MISSING` | 缺少 `scp-app.json` |
| `MANIFEST_FIELD_INVALID` | manifest 字段类型、格式或值非法 |
| `UNKNOWN_PERMISSION` | 声明了未登记权限 |
| `UNSAFE_PATH` | 包路径不安全 |
| `ENTRY_MISSING` | 入口文件不存在 |
| `COMMAND_DUPLICATE` | 命令名或 alias 重复 |
| `PACKAGE_TOO_LARGE` | 包超过 50MB |
| `FILE_TOO_LARGE` | 单文件超过 10MB |

## 更新、回滚与卸载

同 ID 重新导入视为本地更新：

- 保留该 App 的 storage 命名空间。
- 替换 `/home/scp/apps/<appId>` 包文件。
- 重新注册命令和窗口入口。
- 如果安装失败，回滚旧包、旧命令、旧窗口入口和旧桌面快捷方式。

卸载本地 App 时会移除：

- 插件命令注册。
- ToolRegistry 窗口注册。
- 桌面快捷方式。
- `/home/scp/apps/<appId>` 包文件。
- 本地安装元数据。

## 示例

```text
examples/local-apps/browser/
examples/local-apps/api-lab/
examples/local-apps/vue-vite-template/
```

Vue/Vite 打包指南见 `docs/VUE_VITE_LOCAL_APP.zh-CN.md`。API 细节见 `docs/THIRD_PARTY_APP_API.zh-CN.md`。
