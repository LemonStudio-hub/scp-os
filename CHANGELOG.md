# Changelog

## [0.5.0](https://github.com/LemonStudio-hub/scp-os/compare/v0.4.0...v0.5.0) (2026-05-04)


### Features

* add download proxy, penetration simulation and notification features ([6f0b137](https://github.com/LemonStudio-hub/scp-os/commit/6f0b137d1b246998b4507f0f12a3dbf3bc3fa5da))
* **admin:** 新增管理后台功能模块 ([bbad6b4](https://github.com/LemonStudio-hub/scp-os/commit/bbad6b4382de5ee407c7c1cbcd270e187275d7e1))


### Bug Fixes

* add prettier-ignore for multi-statement Vue click handlers ([9564343](https://github.com/LemonStudio-hub/scp-os/commit/9564343f6d7b5c7eb1660447d463743fa8087cb2))
* add semicolons in Vue template multi-statement click handlers ([7f37744](https://github.com/LemonStudio-hub/scp-os/commit/7f3774472befd90ad8a480105b77dc575bdfdba5))
* handle unknown catch variables and type casts in worker admin API ([103c1d3](https://github.com/LemonStudio-hub/scp-os/commit/103c1d33c177e0440e85b3e0082b3fba2449064d))
* resolve CI type errors in frontend composables and worker types ([604a927](https://github.com/LemonStudio-hub/scp-os/commit/604a927cf3e95173770b7f3141eee8c0082b664d))
* update trivy-action to v0.36.0 ([0edb27f](https://github.com/LemonStudio-hub/scp-os/commit/0edb27f1b9f2583413087fbbad988d691f4b260c))

## [0.4.0](https://github.com/LemonStudio-hub/scp-os/compare/v0.3.0...v0.4.0) (2026-05-03)


### Features

* **feedback:** 将评论展开状态从Set改为Record类型 ([9be11bf](https://github.com/LemonStudio-hub/scp-os/commit/9be11bf8b7f7d11e34b522219ba241481038fe8d))
* **proxy:** 重构图片代理功能并优化下载模块 ([337b1f0](https://github.com/LemonStudio-hub/scp-os/commit/337b1f0449f3b5aa33a08c550984a5daa0d35559))
* **router:** 添加DELETE方法路由支持 ([a9669b5](https://github.com/LemonStudio-hub/scp-os/commit/a9669b55daeebc68246e893f105e042df3d3b546))
* **scraper:** 为爬虫添加重试机制和错误分类处理 ([81218df](https://github.com/LemonStudio-hub/scp-os/commit/81218df9c329da712f912a857e4d027c813ebb73))
* **下载:** 添加域名白名单校验并更新协议校验方式 ([0f7c645](https://github.com/LemonStudio-hub/scp-os/commit/0f7c645b8fe9eedef9a58022db8fbf38a91eb0bf))
* 新增 SCP 离线阅读器功能并优化移动端体验 ([8857ae5](https://github.com/LemonStudio-hub/scp-os/commit/8857ae5d141b379903127e5c4a9c945489544422))
* 添加下载代理国际化支持并优化反馈组件 ([9be11bf](https://github.com/LemonStudio-hub/scp-os/commit/9be11bf8b7f7d11e34b522219ba241481038fe8d))


### Bug Fixes

* **config:** 为jwtSecret添加默认值以防未配置环境变量 ([8482246](https://github.com/LemonStudio-hub/scp-os/commit/8482246ff490e7e9e2c9a3a0c6f5ccdb05ca6fc5))
* **docs:** 修复SCP文档系列号类型转换问题 ([9be11bf](https://github.com/LemonStudio-hub/scp-os/commit/9be11bf8b7f7d11e34b522219ba241481038fe8d))
* **download:** 修复下载进度跟踪和错误处理问题 ([337b1f0](https://github.com/LemonStudio-hub/scp-os/commit/337b1f0449f3b5aa33a08c550984a5daa0d35559))
* **parser:** 改进斜体标记和广告代码的清理逻辑 ([81218df](https://github.com/LemonStudio-hub/scp-os/commit/81218df9c329da712f912a857e4d027c813ebb73))


### Performance Improvements

* **download:** 优化下载进度更新和速率限制算法 ([337b1f0](https://github.com/LemonStudio-hub/scp-os/commit/337b1f0449f3b5aa33a08c550984a5daa0d35559))
* **scraper:** 使用静态导入cheerio并优化类型定义 ([81218df](https://github.com/LemonStudio-hub/scp-os/commit/81218df9c329da712f912a857e4d027c813ebb73))

## [0.3.0](https://github.com/LemonStudio-hub/scp-os/compare/v0.2.0...v0.3.0) (2026-05-02)

### Docs 阅读器（新功能）

**SCP 离线阅读器**是 0.3.0 的核心新功能，提供完整的离线优先阅读体验：

- **D1 索引数据库**：9526+ SCP 条目、6487 故事、711 GOI、126 Hub，基于 Cloudflare D1（SQLite）构建，FTS5 全文搜索
- **多级缓存架构**：Cloudflare KV（服务端，<50ms）→ IndexedDB（客户端，离线）→ GitHub Raw（回退）
- **双端阅读器**：桌面端左列表右内容布局（PCDocsWindow）、移动端卡片+全屏阅读+手势操作（MobileDocs）
- **Worker Docs API**：5 个端点（/docs/items、/docs/item/:number、/docs/content/:number、/docs/tales、/docs/hubs）
- **IndexedDB 持久化**：SCP_CONTENT / READING_PROGRESS / SCP_FAVORITES 三个存储

**相关文件**：
- `packages/worker/api/docs.ts` — Docs API 实现
- `packages/worker/scripts/migrate-scp-data.ts` — D1 数据迁移脚本
- `packages/worker/scripts/preload-kv-content.ts` — KV 内容预加载脚本
- `packages/app/src/gui/tools/docs/PCDocsWindow.vue` — 桌面端阅读器
- `packages/app/src/gui/tools/docs/MobileDocs.vue` — 移动端阅读器
- `packages/app/src/gui/composables/useDocsReader.ts` — 阅读器 Composable


### Features

* add git configuration to prevent large files ([e82e15e](https://github.com/LemonStudio-hub/scp-os/commit/e82e15e858d9f29962a86be1f6704e5222df908c))
* **app:** 实现昵称可用性检查和更新功能 ([f56fec0](https://github.com/LemonStudio-hub/scp-os/commit/f56fec05205faa08c66691bd3d8d8ef15b4d0160))
* **app:** 添加authFetch工具函数 ([3a3b97b](https://github.com/LemonStudio-hub/scp-os/commit/3a3b97b015c6e2cd03fa49da0cdccd09a81143c9))
* **app:** 添加网络速度测试功能 ([9a37340](https://github.com/LemonStudio-hub/scp-os/commit/9a37340a703ae5a12d8fd196462643c3afd8c176))
* **auth:** 添加用户认证系统及相关UI组件 ([1400128](https://github.com/LemonStudio-hub/scp-os/commit/14001283217c8c3964841f8dd7baf405480627e4))
* **chat:** 移除独立昵称设置改用全局认证 ([9a37340](https://github.com/LemonStudio-hub/scp-os/commit/9a37340a703ae5a12d8fd196462643c3afd8c176))
* **docs:** 添加SCP文档阅读器功能及相关基础设施 ([17d5eda](https://github.com/LemonStudio-hub/scp-os/commit/17d5eda0bab0f583c84a84e6e46fc9c61d6c62f6))
* **docs:** 添加SCP文档阅读器功能及相关基础设施 ([cb8ff1c](https://github.com/LemonStudio-hub/scp-os/commit/cb8ff1c25ded9949c38b0dd0143843b1c41a8cf8))
* **gui:** 添加全屏功能支持并修复文本编辑器标签 ([62c5837](https://github.com/LemonStudio-hub/scp-os/commit/62c5837302894301e5aaf25dbb20d1a0e8a0d043))
* **worker:** 实现JWT认证中间件 ([3a3b97b](https://github.com/LemonStudio-hub/scp-os/commit/3a3b97b015c6e2cd03fa49da0cdccd09a81143c9))
* **worker:** 更新 Cloudflare Workers 类型依赖版本 ([9a37340](https://github.com/LemonStudio-hub/scp-os/commit/9a37340a703ae5a12d8fd196462643c3afd8c176))
* **worker:** 替换jsdom为linkedom并优化Defuddle集成 ([f56fec0](https://github.com/LemonStudio-hub/scp-os/commit/f56fec05205faa08c66691bd3d8d8ef15b4d0160))
* **worker:** 添加Durable Objects配置和测试支持 ([6e0550d](https://github.com/LemonStudio-hub/scp-os/commit/6e0550d3574d5a13c98b3be35f639459897f3725))
* **worker:** 添加HTML工具模块并优化相关代码 ([53904ad](https://github.com/LemonStudio-hub/scp-os/commit/53904ade84c3cb7617850ea23718aaea192de046))
* **worker:** 添加昵称检查API接口 ([f56fec0](https://github.com/LemonStudio-hub/scp-os/commit/f56fec05205faa08c66691bd3d8d8ef15b4d0160))
* **反馈:** 添加投票和评论功能到移动端反馈组件 ([1c8e950](https://github.com/LemonStudio-hub/scp-os/commit/1c8e9503a066fde2c8ec4ff53b629718a903ce43))
* **反馈系统:** 实现投票和评论功能增强 ([82df64e](https://github.com/LemonStudio-hub/scp-os/commit/82df64e2daf22e69013e30cca8f17f6b2e487bc4))
* 新增下载代理功能及相关组件 ([dcc7c36](https://github.com/LemonStudio-hub/scp-os/commit/dcc7c36a695c701dca6fad2c1054aa7b72c24af9))
* 添加JWT认证和API安全增强 ([3a3b97b](https://github.com/LemonStudio-hub/scp-os/commit/3a3b97b015c6e2cd03fa49da0cdccd09a81143c9))
* 添加SVG格式的favicon并优化移动端交互 ([6e9cf5b](https://github.com/LemonStudio-hub/scp-os/commit/6e9cf5bbd337352964b42824703b2af0a5216085))
* 添加日志工具并替换多处console调用 ([04f5b39](https://github.com/LemonStudio-hub/scp-os/commit/04f5b390537f4886f68ce47ad304f74315417956))


### Bug Fixes

* address lint issues in editor and App.vue ([a0a95f1](https://github.com/LemonStudio-hub/scp-os/commit/a0a95f19e454a9d80ff2eadd89f3f960d29a7a40))
* **auth:** 处理昵称重复错误情况 ([9a37340](https://github.com/LemonStudio-hub/scp-os/commit/9a37340a703ae5a12d8fd196462643c3afd8c176))
* **download:** 修复Blob类型转换问题 ([0ba9640](https://github.com/LemonStudio-hub/scp-os/commit/0ba9640600fddccc54dea38dea011c5dc991be86))
* **feedback:** 移除冗余的用户ID字段并修复投票计数 ([6e9cf5b](https://github.com/LemonStudio-hub/scp-os/commit/6e9cf5bbd337352964b42824703b2af0a5216085))
* **hammer:** 修复手势识别中指针数量设置错误 ([6e9cf5b](https://github.com/LemonStudio-hub/scp-os/commit/6e9cf5bbd337352964b42824703b2af0a5216085))
* **security:** 修复CORS通配符域名匹配问题 ([2dd2e88](https://github.com/LemonStudio-hub/scp-os/commit/2dd2e88971b3a3e4e0ad3f278ca93fa2f0b98ea1))
* **service-worker:** 修复服务工作者注册文件扩展名错误 ([afaf4b9](https://github.com/LemonStudio-hub/scp-os/commit/afaf4b9676b6ddbc4835599a66ae20a82af925cd))
* **window:** 修复主题切换时标题显示问题 ([9a37340](https://github.com/LemonStudio-hub/scp-os/commit/9a37340a703ae5a12d8fd196462643c3afd8c176))
* **worker:** 修复聊天室DO的WebSocket连接处理 ([3a3b97b](https://github.com/LemonStudio-hub/scp-os/commit/3a3b97b015c6e2cd03fa49da0cdccd09a81143c9))
* **worker:** 修复重试策略中的错误处理逻辑 ([53904ad](https://github.com/LemonStudio-hub/scp-os/commit/53904ade84c3cb7617850ea23718aaea192de046))
* **worker:** 增强聊天室功能并限制用户创建数量 ([0af4e97](https://github.com/LemonStudio-hub/scp-os/commit/0af4e97f3522a21e315f156fd23b8869c3ec32e1))
* 修复CORS管理器正则表达式转义问题 ([dcc7c36](https://github.com/LemonStudio-hub/scp-os/commit/dcc7c36a695c701dca6fad2c1054aa7b72c24af9))
* 修复类型定义和潜在的错误处理 ([04f5b39](https://github.com/LemonStudio-hub/scp-os/commit/04f5b390537f4886f68ce47ad304f74315417956))


### Performance Improvements

* **chat:** 优化心跳检测和消息类型处理 ([6e9cf5b](https://github.com/LemonStudio-hub/scp-os/commit/6e9cf5bbd337352964b42824703b2af0a5216085))
* **mobile:** 添加touch-action优化滚动性能 ([6e9cf5b](https://github.com/LemonStudio-hub/scp-os/commit/6e9cf5bbd337352964b42824703b2af0a5216085))
* **worker:** 优化性能监控器的最小/最大值计算 ([53904ad](https://github.com/LemonStudio-hub/scp-os/commit/53904ade84c3cb7617850ea23718aaea192de046))
* 优化性能监控代码 ([04f5b39](https://github.com/LemonStudio-hub/scp-os/commit/04f5b390537f4886f68ce47ad304f74315417956))
* 优化性能监控服务的启动和停止事件触发 ([dcc7c36](https://github.com/LemonStudio-hub/scp-os/commit/dcc7c36a695c701dca6fad2c1054aa7b72c24af9))
