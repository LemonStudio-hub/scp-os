---
name: half-done-features
description: SCP-OS 仓库半实现/待完成功能清单（按优先级与模块细分）
metadata:
  type: project
---

# SCP-OS 仓库：半实现/待完成功能清单

**扫描范围**：packages/app/src（前端 Vue3） + packages/worker/src（后端 Worker）  
**更新日期**：2026-05-18  
**修复批次**：
- ✅ 批次一（高优先级 4 项）— 已完成，通过 CI + 多 Agent 审查 + 2 轮真实验证
- ✅ 批次二（中优先级 5 项）— 已完成
- ✅ 批次三（低优先级 6 项）— 已完成

**最新提交**: `ed4db1c` feat(chat): implement message editing and deletion
**状态**: 本地领先 origin/main 1 个 commit，等待 push

---

## ✅ 批次一：高优先级（已完成）

| 序号 | 功能区域 | 状态 | 关键文件 |
|---|---|---|---|
| 1 | 移动端文件管理器：R2 云上传 | ✅ | MobileFileManager.vue |
| 2 | 性能仪表盘：优化分数计算 | ✅ | performance-optimizer.service.ts |
| 3 | 性能仪表盘：优化策略验证 | ✅ | performance-optimizer.service.ts |
| 4 | 设置 - 存储统计：IndexedDB | ✅ | SettingsWindow.vue, MobileSettings.vue, indexedDB.ts |

---

## ✅ 批次二：中优先级（已完成）

### 2.1 性能监控：错误检测逻辑被注释 — ✅ 已完成
- **修复**：恢复注释掉的错误检测逻辑，使用类型断言访问 `responseStatus`
- **提交**：`e7fdf20`

### 2.2 管理后台 - 内容导入：无字段校验和冲突检测 — ✅ 已完成
- **修复**：定义导入 schema、字段校验、唯一性冲突检测、D1 batch 原子插入、详细结果返回
- **提交**：`63cd34f`

### 2.3 管理后台 - 用户导出：永远返回 JSON — ✅ 已完成
- **修复**：实现 `convertToCsv`、format 参数校验、前端空数据修复、BOM 支持
- **提交**：`cd017c0`

### 2.4 管理后台 - 批量操作：仅支持删除 — ✅ 已完成
- **修复**：支持 `delete`/`update_status`/`move_category`，action 校验，前端动态 batchActions
- **提交**：`592a873`

### 2.5 管理后台 - 用户批量操作：缺少 `unban` action — ✅ 无需修复
- **说明**：代码已实现，前端已有 UI，扫描误判

---

## 🔲 批次三：低优先级（6 项）

### 3.1 聊天 WebSocket DO：缺少消息编辑和删除
- **文件**：`packages/worker/src/chat-room.ts`
- **问题**：`handleMessage()` 中已实现 `chat_message`、`switch_room`、`heartbeat`、`rename`，但缺少消息编辑和删除的 message type
- **细化任务**：
  1. 在 chat-room.ts 中新增 `edit_message` 和 `delete_message` handler
  2. 添加消息权限校验（只能编辑/删除自己的消息，管理员除外）
  3. 广播编辑/删除事件到房间内其他用户
  4. 在 HTTP API 中添加对应端点（如果前端需要非 WebSocket 方式调用）
  5. 补充聊天 room 单元测试
- **影响**：用户无法撤回或修改已发送的聊天消息

### 3.2 文档阅读器 - GOI 页面缺失公共 API
- **问题**：前端 `PCDocsWindow.vue` / `MobileDocs.vue` 有 GOI 分类筛选 UI，但后端 `/docs/items` 只查询 `scp_items` 表，`scp_goi` 表没有对应的公共读取端点
- **细化任务**：
  1. 在 Worker 端新增 `/docs/goi` 或 `/docs/items?type=goi` 端点
  2. 实现 `scp_goi` 表的查询逻辑（支持分页、搜索）
  3. 前端对接新端点，根据分类切换数据源
  4. 补充 API 测试
- **影响**：用户无法在文档阅读器中浏览 GOI（相关组织）条目

### 3.3 终端命令 `info`：没有处理中文分部优先逻辑
- **文件**：`packages/app/src/commands/index.ts:300`
- **问题**：注释提到"未指定分部，优先查询中文分部，找不到再查英文主站点"，但实际代码只调用了一次 `scraper.scrapeSCP(branch)`，没有 fallback 机制
- **细化任务**：
  1. 实现先查询中文分部（cn），失败时自动 fallback 到英文主站点（en）
  2. 添加超时控制，避免中文分部网络异常时长时间阻塞
  3. 在终端输出中标注数据来源（中文/英文）
  4. 补充命令单元测试
- **影响**：`info 173` 如果中文分部网络异常，不会自动尝试英文站点

### 3.4 PerformanceDashboard API 提交：缺少用户 ID 绑定
- **文件**：`packages/app/src/platform/performance/performance-api.service.ts`
- **问题**：`setUserId()` 存在，但 `PerformanceDashboard.vue` 中没有调用 `apiService.value.setUserId(...)`，导致上报的性能数据没有关联到具体用户
- **细化任务**：
  1. 在 PerformanceDashboard.vue 初始化时获取当前用户 ID 并调用 `setUserId()`
  2. 确保用户登录状态变化时更新绑定的用户 ID
  3. 补充性能数据上报的集成测试
- **影响**：无法按用户维度分析性能问题

### 3.5 设置页面：缺少云存储配额显示
- **问题**：SettingsWindow.vue 的 storage section 只显示本地 localStorage 用量，没有调用 `/files/quota` API 展示 R2 云存储配额
- **细化任务**：
  1. 确认后端是否有 `/files/quota` 端点，如果没有则先实现
  2. 在 SettingsWindow.vue 和 MobileSettings.vue 中添加云存储配额显示
  3. 展示已用空间 / 总配额 / 剩余空间的进度条
  4. 补充 API 端点测试
- **影响**：用户不知道自己在云端还剩多少空间

### 3.6 移动端反馈：缺少评论/投票的实时刷新
- **文件**：`packages/app/src/gui/tools/feedback/MobileFeedback.vue`
- **问题**：投票或评论提交成功后，列表不会自动刷新，需要手动切换 tab 或重新打开窗口才能看到更新
- **细化任务**：
  1. 在投票/评论提交成功后，调用 `fetchFeedbackList()` 刷新当前列表
  2. 使用乐观更新，先更新本地数据再请求服务端确认
  3. 避免重复刷新导致的闪烁
  4. 补充交互测试
- **影响**：用户体验不流畅，可能误以为操作失败

---

## 执行计划

**批次二（中优先级）执行顺序建议**：
1. 2.5 用户批量解封（改动最小，逻辑明确）
2. 2.3 用户导出 CSV（改动中等，影响明确）
3. 2.4 批量内容操作（与 2.3 类似，可复用模式）
4. 2.2 内容导入校验（改动较大，需要 schema 定义）
5. 2.1 性能错误检测（需要调研替代方案）

**批次三（低优先级）执行顺序建议**：
1. 3.4 PerformanceDashboard 用户 ID 绑定（前端小改动）
2. 3.6 移动端反馈实时刷新（前端小改动）
3. 3.3 终端 info fallback（前端中等改动）
4. 3.5 云存储配额显示（需要前后端配合）
5. 3.2 GOI 公共 API（后端中等改动）
6. 3.1 聊天消息编辑/删除（前后端均需要改动，最复杂）

---

## 质量门禁（每批次通用）

每项修复完成后必须满足：
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm lint:check` 0 errors
- [ ] `pnpm test` 全部通过（300 + 3）
- [ ] `pnpm build` 构建成功
- [ ] 多 Agent 审查完成，发现的问题已修复
- [ ] 真实运行验证第 1 遍通过
- [ ] 真实运行验证第 2 遍通过
- [ ] 无回归引入
