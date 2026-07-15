# SCP-OS 第三方 App API v1.2

本文档定义本地 `iframe-app` 通过 `window.scp` 调用宿主能力的接口。所有接口都走 `postMessage` 网关，并由 SCP-OS 根据 `scp-app.json` 的 `permissions` 做运行时校验。

## 调用模型

iframe App 内会注入：

```js
window.scp
```

所有方法都返回 Promise：

```js
await window.scp.window.setTitle("My App")
const theme = await window.scp.theme.getCurrent()
```

失败时 Promise 会 reject 一个 Error，并附带结构化字段：

```js
try {
  await window.scp.ui.setCursor("crosshair")
} catch (error) {
  console.log(error.code)
  console.log(error.permission)
  console.log(error.api)
  console.log(error.message)
}
```

## 网关响应格式

v1.2 统一响应：

```ts
{ channel: "scp-os", id, ok: true, result }
{ channel: "scp-os", id, ok: false, error: { code, message, permission?, api? } }
```

iframe 内的 `window.scp` bridge 会把失败响应转换成 Error：

```ts
error.code        // "PERMISSION_DENIED" | "INVALID_ARGUMENT" | "UNSUPPORTED_API" | ...
error.permission  // e.g. "theme.write"
error.api         // e.g. "theme:setAccent"
```

旧版 `{ error: string }` 响应仍兼容，避免旧本地 App 立即失效。

## 错误码

| code | 说明 |
| --- | --- |
| `PERMISSION_DENIED` | App 未声明对应权限 |
| `INVALID_ARGUMENT` | 参数非法 |
| `UNSUPPORTED_API` | API 不存在或未开放 |
| `CONTEXT_UNAVAILABLE` | 当前上下文不支持该 API，例如移动端无窗口上下文 |
| `NOT_FOUND` | 目标窗口或资源不存在 |
| `INTERNAL_ERROR` | 宿主内部错误 |

## 权限声明

App 必须在 `scp-app.json` 声明权限：

```json
{
  "permissions": [
    "storage",
    "notifications",
    "window.control",
    "ui.cursor",
    "theme.read",
    "theme.write"
  ]
}
```

未声明权限时，对应 API 会返回：

```json
{
  "code": "PERMISSION_DENIED",
  "message": "Permission denied: ui.cursor",
  "permission": "ui.cursor",
  "api": "ui:setCursor"
}
```

## API 列表

| API | 权限 | 状态 | 说明 |
| --- | --- | --- | --- |
| `window.scp.storage.get(key)` | `storage` | v1.2 available | 读取当前 App 命名空间内的数据 |
| `window.scp.storage.set(key, value)` | `storage` | v1.2 available | 写入当前 App 命名空间内的数据 |
| `window.scp.storage.remove(key)` | `storage` | v1.2 available | 删除当前 App 命名空间内的数据 |
| `window.scp.notify(message)` | `notifications` | v1.2 available | 通知占位接口，当前返回成功 |
| `window.scp.window.setTitle(title)` | `window.control` | v1.2 available | 修改当前 App 窗口标题 |
| `window.scp.window.resize(width, height)` | `window.control` | v1.2 available | 调整当前 App 窗口尺寸 |
| `window.scp.ui.setCursor(cursor)` | `ui.cursor` | v1.2 available | 设置宿主页面鼠标样式 |
| `window.scp.ui.resetCursor()` | `ui.cursor` | v1.2 available | 重置由当前 App 设置的鼠标样式 |
| `window.scp.theme.getCurrent()` | `theme.read` | v1.2 available | 读取当前主题摘要 |
| `window.scp.theme.setAccent(color)` | `theme.write` | v1.2 available | 设置自定义强调色，格式必须为 `#RRGGBB` |
| `window.scp.theme.resetAccent()` | `theme.write` | v1.2 available | 清除自定义强调色 |

planned 权限目前没有运行时 API。声明后只用于风险展示和未来兼容。

## Storage

```js
await window.scp.storage.set("draft", "hello")
const value = await window.scp.storage.get("draft")
await window.scp.storage.remove("draft")
```

数据按 App ID 隔离。`local.notes` 写入的 `draft` 不会被 `local.browser` 读取。

## Notification

```js
await window.scp.notify("Saved")
```

当前是受控占位接口，返回 `true`。后续可接入通知中心。

## Window

```js
await window.scp.window.setTitle("Import Wizard")
await window.scp.window.resize(900, 620)
```

限制：

- 只能控制当前 App 自己的窗口。
- 无窗口上下文会返回 `CONTEXT_UNAVAILABLE`。
- 标题最多保留 80 个字符。
- 尺寸仍由窗口系统做最终约束。

## UI Cursor

```js
await window.scp.ui.setCursor("crosshair")
await window.scp.ui.resetCursor()
```

支持标准 CSS cursor 关键字，例如：

```text
auto, default, pointer, crosshair, text, wait, grab, grabbing, move, not-allowed, zoom-in, zoom-out
```

窗口关闭时，SCP-OS 会自动清理由该 App 设置的 cursor。

## Theme

```js
const theme = await window.scp.theme.getCurrent()
await window.scp.theme.setAccent("#39d0ff")
await window.scp.theme.resetAccent()
```

`getCurrent()` 返回摘要：

```json
{
  "id": "dark",
  "name": "Dark",
  "isDark": true,
  "accent": "#39d0ff",
  "customAccent": "#39d0ff",
  "availableThemes": [
    { "id": "dark", "name": "Dark", "isDark": true }
  ]
}
```

`theme.write` 会改变全局 SCP-OS 外观，属于中风险权限。

## Sandbox 注意事项

默认 iframe App 不开启 `allow-same-origin`。现代 SPA、Vue/Vite 构建包或网页容器可以在 manifest 中显式开启：

```json
{
  "sandbox": {
    "allowSameOrigin": true,
    "allowPopups": true
  }
}
```

`allowSameOrigin` 会降低隔离强度，只给可信 App 使用。

## 示例

```text
examples/local-apps/api-lab/
```

API Lab 会调用 window、cursor、theme、storage、notify，并在失败时显示 `code`、`permission`、`api`。
