# Vue/Vite Local App Template

这个目录是 SCP-OS 本地 iframe app 的 Vue/Vite 模板。

关键点：

- `vite.config.ts` 必须设置 `base: './'`。
- `scp-app.json` 放在 `public/`，构建后会复制到 `dist/` 根目录。
- 导入 SCP-OS 时选择 `dist/` 目录，或把 `dist/` 打成 ZIP。
- 校验命令：`pnpm validate:local-app examples/local-apps/vue-vite-template/dist`
