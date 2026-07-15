# Vue/Vite 本地 App 打包指南

SCP-OS v1.2 支持导入 Vue/Vite 构建后的本地网站包。目标不是让 Browser iframe 变成完整原生浏览器，而是让一个已经构建好的 SPA 作为 `iframe-app` 在 SCP-OS 窗口系统里运行。

## 推荐结构

```text
my-vue-app/
  index.html
  package.json
  vite.config.ts
  public/
    scp-app.json
  src/
    main.ts
```

`public/scp-app.json` 会在 `vite build` 时复制到 `dist/scp-app.json`。

## Vite 配置

必须设置相对资源路径：

```ts
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  base: "./",
  plugins: [vue()],
})
```

如果没有 `base: "./"`，构建产物通常会引用 `/assets/...`，导入 SCP-OS 后找不到资源。

## Manifest

```json
{
  "schemaVersion": 1,
  "id": "local.vue-demo",
  "name": "Vue Demo",
  "version": "1.0.0",
  "runtime": "iframe-app",
  "entry": "index.html",
  "permissions": ["storage", "theme.read", "window.control"],
  "sandbox": {
    "allowSameOrigin": true
  },
  "window": {
    "width": 760,
    "height": 560,
    "minWidth": 440,
    "minHeight": 320,
    "resizable": true
  }
}
```

说明：

- 普通 Vue/Vite SPA 通常可以只用 `storage`、`theme.read`、`window.control`。
- 如果 App 需要打开弹窗，声明 `sandbox.allowPopups`。
- 如果 App 需要承载远程网页内容，可以声明 `network`，但 v1.2 中该权限仍是 planned，只做风险展示。

## 构建和校验

```bash
pnpm install
pnpm build
pnpm validate:local-app dist
```

在当前仓库里有示例模板：

```bash
pnpm validate:local-app examples/local-apps/vue-vite-template/dist
```

通过后可以在 App Manager 中选择：

- 导入目录：选择 `dist/`
- 导入 ZIP：把 `dist/` 内容打包成 ZIP 后导入

## 在 Vue 中调用 SCP-OS API

```ts
const theme = await window.scp.theme.getCurrent()
await window.scp.storage.set("note", "hello")
await window.scp.window.setTitle("Vue Demo")
```

建议补一个类型声明：

```ts
declare global {
  interface Window {
    scp?: {
      storage: {
        get(key: string): Promise<string | null>
        set(key: string, value: string): Promise<boolean>
      }
      theme: {
        getCurrent(): Promise<{ id?: string; name?: string; accent?: string }>
      }
      window: {
        setTitle(title: string): Promise<boolean>
      }
    }
  }
}
```

## 常见问题

### 打开后空白

先检查构建产物的资源路径是否以 `./assets/` 开头。如果是 `/assets/`，说明缺少 `base: "./"`。

### 外链网站无法嵌入

很多网站会通过 CSP 或 `X-Frame-Options` 拒绝被 iframe 嵌入，这是浏览器安全限制，不是 SCP-OS App 平台错误。

### 能不能导入 Vue 源码目录

不建议。v1.2 支持的是本地构建包导入，也就是 `dist/`。源码目录需要 dev server、依赖解析和 HMR，不属于 v1.2 本地包运行模型。
