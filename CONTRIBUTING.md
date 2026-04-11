# 贡献指南

## 项目简介

SCP-OS 是一个基于 SCP 基金会主题的专业 Web 终端应用，提供先进的命令行界面，具有全面的移动支持和优化的性能。

- **生产环境**: https://scpos.pages.dev (Cloudflare Pages)
- **API**: https://api.scpos.site (Cloudflare Worker)

## 如何贡献

我们欢迎并感谢所有形式的贡献，包括但不限于：

- 报告 bug
- 提出新功能建议
- 改进文档
- 提交代码修复
- 增强现有功能

## 开发环境设置

### 前置要求

- Node.js 18+
- pnpm (推荐)
- Git

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/LemonStudio-hub/scp-os.git
cd scp-os
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env.development
```

4. **启动开发服务器**

```bash
pnpm run dev
```

## 代码风格指南

### TypeScript

- 使用 TypeScript 严格模式
- 为所有函数和变量添加类型注解
- 优先使用 `interface` 定义对象类型
- 使用 `const` 声明常量，`let` 声明变量
- 避免使用 `var`

### Vue

- 使用 Composition API
- 组件命名使用 PascalCase
- 文件命名与组件名一致
- 使用 `<script setup lang="ts">` 语法
- 为组件 props 添加类型定义

### 代码格式化

- 使用 Prettier 进行代码格式化
- 遵循项目的 `.prettierrc` 配置
- 提交前运行 `pnpm run lint` 检查代码风格

## 提交消息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来编写提交消息：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

### 类型

- `feat`: 新增功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码风格变更（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建流程或辅助工具变更

### 示例

```bash
# 新增功能
feat: 添加聊天系统

# 修复 bug
fix: 修复终端命令解析错误

# 文档更新
docs: 更新 API 文档

# 代码重构
refactor: 优化命令处理逻辑
```

## 分支策略

- **master**: 主要生产分支，保持稳定
- **feature/**: 新功能开发分支
- **bugfix/**: bug 修复分支
- **docs/**: 文档更新分支
- **refactor/**: 代码重构分支

### 分支命名规范

```
<类型>/<描述>
```

示例：
- `feature/chat-system`
- `bugfix/terminal-parser`
- `docs/api-documentation`

## 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行带 UI 的测试
pnpm run test:ui

# 运行带覆盖率报告的测试
pnpm run test:coverage
```

### 测试要求

- 所有新功能必须添加相应的测试
- 修复 bug 时，应添加测试以防止回归
- 保持测试覆盖率在 90% 以上
- 测试应清晰、简洁，覆盖主要场景

## 拉取请求流程

1. **Fork 仓库**

2. **创建分支**

```bash
git checkout -b feature/amazing-feature
```

3. **提交更改**

```bash
git commit -m 'feat: add amazing feature'
```

4. **推送到分支**

```bash
git push origin feature/amazing-feature
```

5. **打开 Pull Request**

- 提供清晰的 PR 标题
- 详细描述更改内容和目的
- 引用相关的 issue（如果有）
- 确保所有测试通过
- 确保代码风格检查通过

## 行为准则

我们希望所有贡献者能够在一个友好、尊重的环境中工作。请：

- 使用包容性语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 专注于对社区最有利的事情
- 对其他社区成员表示同理心

## 联系方式

如有问题或反馈，请通过以下方式联系：

- 在 GitHub 仓库中打开 issue
- 发送邮件到 [project@scpos.site](mailto:project@scpos.site)

## 贡献者名单

我们非常感谢所有为项目做出贡献的开发者！

<!-- 贡献者名单将自动生成 -->

## 许可证

通过贡献到 SCP-OS 项目，您同意您的贡献将在项目的许可证下发布：

- **代码**: MIT License
- **SCP Foundation 内容**: CC BY-SA 3.0

详细信息请参阅 [LICENSE](LICENSE) 文件。

---

**感谢您对 SCP-OS 项目的贡献！** 🎉