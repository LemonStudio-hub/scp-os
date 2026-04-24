# 贡献指南

感谢你对 SCP-OS 项目的关注！我们欢迎各种形式的贡献，包括但不限于代码、文档、Bug 报告和功能建议。

---

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [报告 Bug](#报告-bug)
- [功能建议](#功能建议)
- [项目架构](#项目架构)
- [添加新工具](#添加新工具)

---

## 行为准则

- 尊重所有贡献者
- 使用建设性的语言
- 关注问题本身，而非个人
- 尊重不同的观点和经验

---

## 如何贡献

### 1. Fork 仓库

点击 GitHub 页面右上角的 Fork 按钮，将仓库复制到你的账户。

### 2. 克隆到本地

```bash
git clone https://github.com/your-username/scp-os.git
cd scp-os
```

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feature/` | 新功能 | `feature/chat-rooms` |
| `fix/` | Bug 修复 | `fix/terminal-scroll` |
| `docs/` | 文档更新 | `docs/api-reference` |
| `refactor/` | 代码重构 | `refactor/store-layer` |
| `test/` | 测试相关 | `test/command-history` |
| `chore/` | 构建/工具 | `chore/update-deps` |

### 4. 开发与测试

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint:check

# 格式化
pnpm format
```

### 5. 提交代码

```bash
git add .
git commit -m "feat: add chat room creation feature"
```

### 6. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

在 GitHub 上创建 Pull Request，填写 PR 模板。

---

## 开发流程

### 环境搭建

详细的环境搭建步骤请参考 [安装与配置指南](docs/INSTALLATION.md)。

### 开发模式

```bash
# Web 开发
pnpm dev

# 桌面端开发
pnpm desktop:dev

# Worker 开发
pnpm worker:dev
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm vitest run path/to/test.test.ts

# 测试 UI
pnpm test:ui

# 覆盖率报告
pnpm test:coverage
```

### 代码质量检查

在提交 PR 前，请确保以下检查全部通过：

```bash
# TypeScript 类型检查
pnpm typecheck

# ESLint 检查
pnpm lint:check

# 格式检查
pnpm format:check

# 运行测试
pnpm test
```

---

## 代码规范

### TypeScript

- 严格模式，启用所有严格检查
- 优先使用 `interface` 定义对象类型，`type` 用于联合类型和工具类型
- 显式声明函数返回类型
- 避免使用 `any`，必要时使用 `unknown` 并进行类型守卫

### Vue 组件

- 使用 `<script setup lang="ts">` 语法
- 组件文件名使用 PascalCase：`MyComponent.vue`
- Props 使用 `defineProps<T>()` 泛型语法
- Emits 使用 `defineEmits<T>()` 泛型语法
- 组件内逻辑抽取为 composables

### 状态管理

- 使用 Pinia `defineStore`
- Store 文件名使用 camelCase：`useWindowManager.ts`
- Store 命名使用 `use[Name]Store` 模式
- 异步操作放在 Store actions 中

### 样式

- 使用 Tailwind CSS 工具类优先
- 组件特定样式使用 `<style scoped>`
- 全局样式变量通过 CSS 自定义属性（`--gui-*`）
- 颜色值使用设计令牌中定义的变量

### 文件组织

```
feature/
├── __tests__/          # 测试文件
├── components/         # Vue 组件
├── composables/        # 组合式函数
├── stores/             # Pinia Store
├── types/              # 类型定义
└── index.ts            # 统一导出
```

---

## 提交规范

项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖 |
| `ci` | CI/CD 配置 |

### Scope

| Scope | 说明 |
|-------|------|
| `app` | 前端应用 |
| `desktop` | 桌面端 |
| `worker` | 后端 Worker |
| `terminal` | 终端模块 |
| `gui` | GUI 模块 |
| `domain` | 领域层 |
| `plugin` | 插件系统 |

### 示例

```
feat(terminal): add command autocomplete with fuzzy matching

Implement Tab-key autocomplete for terminal commands with:
- Subsequence matching algorithm
- History-weighted ranking
- SCP number completion with CN- prefix support
- Cycle selection on multiple matches

Closes #123
```

---

## Pull Request 流程

### PR 检查清单

在提交 PR 前，请确认：

- [ ] 代码通过 `pnpm typecheck` 类型检查
- [ ] 代码通过 `pnpm lint:check` ESLint 检查
- [ ] 代码通过 `pnpm format:check` 格式检查
- [ ] 所有测试通过 `pnpm test`
- [ ] 新功能添加了对应的测试
- [ ] 提交信息遵循 Conventional Commits 规范
- [ ] PR 描述清晰说明了变更内容

### PR 标题格式

```
<type>(<scope>): <subject>
```

示例：`feat(gui): add wallpaper picker component`

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 变更说明
<!-- 描述你的变更内容 -->

## 相关 Issue
<!-- 关联的 Issue 编号 -->

## 测试
<!-- 描述如何测试你的变更 -->

## 截图
<!-- 如有 UI 变更，请附截图 -->
```

### 审查流程

1. 自动 CI 检查通过
2. 至少一位维护者审查
3. 修改审查意见
4. 合并到 main 分支

---

## 报告 Bug

### Bug 报告模板

```markdown
## Bug 描述
<!-- 清晰描述 Bug 的表现 -->

## 复现步骤
1. 进入 '...'
2. 点击 '...'
3. 输入 '...'
4. 看到错误

## 期望行为
<!-- 描述期望的正确行为 -->

## 实际行为
<!-- 描述实际发生的行为 -->

## 环境信息
- 操作系统：
- 浏览器：
- 应用版本：
- 设备类型（桌面/移动）：

## 截图
<!-- 如适用，附上截图 -->

## 附加信息
<!-- 错误日志、网络请求等 -->
```

---

## 功能建议

### 功能建议模板

```markdown
## 功能描述
<!-- 清晰描述你建议的功能 -->

## 问题背景
<!-- 描述什么场景下需要这个功能 -->

## 建议方案
<!-- 描述你建议的实现方式 -->

## 替代方案
<!-- 描述你考虑过的其他方案 -->

## 附加信息
<!-- 其他有助于理解的信息 -->
```

---

## 项目架构

了解项目架构有助于你找到正确的修改位置。详细架构说明请参考 [README.md](README.md#项目架构)。

### 关键目录

| 目录 | 职责 | 修改场景 |
|------|------|---------|
| `src/domain/` | 领域模型 | 添加实体、值对象、仓库接口 |
| `src/gui/tools/` | GUI 工具 | 添加新工具组件 |
| `src/gui/registry/` | 工具注册 | 注册新工具 |
| `src/gui/composables/` | 组合式函数 | 添加可复用逻辑 |
| `src/gui/stores/` | GUI Store | 添加窗口管理相关状态 |
| `src/stores/` | Pinia Store | 添加应用级状态 |
| `src/commands/` | 命令处理 | 添加新终端命令 |
| `src/utils/` | 工具函数 | 添加通用工具 |
| `src/platform/plugins/` | 插件系统 | 添加插件类型或扩展 |
| `packages/worker/` | 后端 API | 修改 API 接口 |

---

## 添加新工具

SCP-OS 使用工具注册表模式，添加新工具只需 3 步：

### 1. 创建工具组件

在 `src/gui/tools/` 下创建新目录，包含桌面端和移动端组件：

```
src/gui/tools/mytool/
├── PCMyTool.vue        # 桌面端组件
└── MobileMyTool.vue    # 移动端组件
```

### 2. 注册工具

在 `src/gui/registry/registerTools.ts` 中添加注册代码：

```typescript
import PCMyTool from '../tools/mytool/PCMyTool.vue'
import MobileMyTool from '../tools/mytool/MobileMyTool.vue'

registerTool({
  id: 'mytool',
  label: (t) => t('tools.mytool'),
  icon: '🔧',
  windowConfig: {
    width: 700,
    height: 500,
    minWidth: 400,
    minHeight: 300,
    resizable: true,
  },
  desktopComponent: PCMyTool,
  mobileComponent: MobileMyTool,
  onOpen: () => {
    console.log('MyTool opened')
  },
  onClose: () => {
    console.log('MyTool closed')
  },
})
```

### 3. 添加国际化文本

在 `src/gui/composables/useI18n.ts` 的语言包中添加翻译：

```typescript
const messages = {
  en: {
    tools: {
      mytool: 'My Tool',
    },
  },
  'zh-CN': {
    tools: {
      mytool: '我的工具',
    },
  },
}
```

完成！新工具会自动出现在桌面图标、开始菜单和移动端主屏中。

---

## 许可协议

通过向本项目贡献代码，你同意你的贡献将在 MIT 许可协议下授权。SCP 基金会相关内容遵循 CC BY-SA 3.0 许可协议。
