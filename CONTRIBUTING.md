# Contributing Guide

Thank you for your interest in the SCP-OS project! We welcome contributions of all kinds, including but not limited to code, documentation, bug reports, and feature suggestions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Suggestions](#feature-suggestions)
- [Project Architecture](#project-architecture)
- [Adding a New Tool](#adding-a-new-tool)

---

## Code of Conduct

- Respect all contributors and communicate kindly
- Use constructive language and focus on the issue at hand
- Address issues, not people — keep discussions objective
- Embrace different viewpoints and experiences with an open mind

---

## How to Contribute

### 1. Fork the Repository

Click the Fork button in the top-right corner of the GitHub page to copy the repository to your account.

### 2. Clone to Local

```bash
git clone https://github.com/your-username/scp-os.git
cd scp-os
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/chat-rooms` |
| `fix/` | Bug fixes | `fix/terminal-scroll` |
| `docs/` | Documentation updates | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/store-layer` |
| `test/` | Testing | `test/command-history` |
| `chore/` | Build/tools | `chore/update-deps` |

### 4. Develop and Test

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Lint check
pnpm lint:check

# Format code
pnpm format
```

### 5. Commit Code

```bash
git add .
git commit -m "feat: add chat room creation feature"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub and fill out the PR template.

---

## Development Workflow

### Environment Setup

For detailed environment setup steps, please refer to the [Installation & Configuration Guide](docs/INSTALLATION.md).

### Development Mode

```bash
# Web development
pnpm dev

# Desktop development
pnpm desktop:dev

# Worker development
pnpm worker:dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm --filter @scp-os/app vitest run src/path/to/test.test.ts

# Test UI
pnpm test:ui

# Coverage report
pnpm test:coverage
```

### Code Quality Checks

Before submitting a PR, ensure all the following checks pass:

```bash
# TypeScript type checking
pnpm typecheck

# ESLint check
pnpm lint:check

# Format check
pnpm format

# Run tests
pnpm test
```

---

## Code Standards

### TypeScript

- Strict mode with all strict checks enabled
- Prefer `interface` for object types, `type` for unions and utility types
- Explicitly declare function return types
- Avoid `any`; use `unknown` with type guards when necessary

### Vue Components

- Use `<script setup lang="ts">` syntax
- Component filenames use PascalCase: `MyComponent.vue`
- Props use `defineProps<T>()` generic syntax
- Emits use `defineEmits<T>()` generic syntax
- Extract component logic into composables

### State Management

- Use Pinia `defineStore`
- Store filenames use camelCase: `useWindowManager.ts`
- Store naming follows `use[Name]Store` pattern
- Async operations go in Store actions

### Styling

- Prefer Tailwind CSS utility classes
- Component-specific styles use `<style scoped>`
- Global style variables via CSS custom properties (`--gui-*`)
- Use design token variables for color values

### File Organization

```
feature/
├── __tests__/          # Test files
├── components/         # Vue components
├── composables/        # Composables
├── stores/             # Pinia stores
├── types/              # Type definitions
└── index.ts            # Unified exports
```

---

## Commit Convention

The project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation update |
| `style` | Code formatting (no functional change) |
| `refactor` | Code refactoring |
| `perf` | Performance optimization |
| `test` | Testing |
| `chore` | Build/tools/dependencies |
| `ci` | CI/CD configuration |

### Scope

| Scope | Description |
|-------|-------------|
| `app` | Frontend application |
| `desktop` | Desktop client |
| `worker` | Backend Worker |
| `terminal` | Terminal module |
| `gui` | GUI module |
| `domain` | Domain layer |
| `plugin` | Plugin system |

### Example

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

## Pull Request Process

### PR Checklist

Before submitting a PR, confirm:

- [ ] Code passes `pnpm typecheck` type checking
- [ ] Code passes `pnpm lint:check` ESLint checking
- [ ] Code passes `pnpm format` format checking
- [ ] All tests pass with `pnpm test`
- [ ] New features have corresponding tests
- [ ] Commit messages follow Conventional Commits
- [ ] PR description clearly explains the changes

### PR Title Format

```
<type>(<scope>): <subject>
```

Example: `feat(gui): add wallpaper picker component`

### PR Description Template

```markdown
## Change Type
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation update
- [ ] Other

## Change Description
<!-- Describe your changes -->

## Related Issues
<!-- Related issue numbers -->

## Testing
<!-- Describe how to test your changes -->

## Screenshots
<!-- If there are UI changes, include screenshots -->
```

### Review Process

1. Automated CI checks must all pass
2. At least one maintainer review required
3. Address review comments and make necessary changes
4. Merge to main branch after approval

---

## Reporting Bugs

### Bug Report Template

```markdown
## Bug Description
<!-- Clearly describe the bug behavior -->

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Enter '...'
4. See error

## Expected Behavior
<!-- Describe the expected correct behavior -->

## Actual Behavior
<!-- Describe what actually happened -->

## Environment
- Operating System:
- Browser:
- App Version:
- Device Type (Desktop/Mobile):

## Screenshots
<!-- If applicable, include screenshots -->

## Additional Information
<!-- Error logs, network requests, etc. -->
```

---

## Feature Suggestions

### Feature Suggestion Template

```markdown
## Feature Description
<!-- Clearly describe the suggested feature -->

## Problem Context
<!-- Describe what scenario needs this feature -->

## Suggested Solution
<!-- Describe your suggested implementation approach -->

## Alternatives Considered
<!-- Describe other approaches you've considered -->

## Additional Information
<!-- Any other information that helps understand the suggestion -->
```

---

## Project Architecture

Understanding the project architecture helps you find the right place to make changes. For detailed architecture information, please refer to [README.md](README.md#project-architecture).

### Key Directories

| Directory | Responsibility | Modification Scenarios |
|-----------|----------------|----------------------|
| `src/domain/` | Domain models | Add entities, value objects, repository interfaces |
| `src/gui/tools/` | GUI tools | Add new tool components |
| `src/gui/tools/docs/` | Docs reader | PCDocsWindow.vue + MobileDocs.vue |
| `src/gui/registry/` | Tool registry | Register new tools |
| `src/gui/composables/` | Composables | Add reusable logic |
| `src/gui/stores/` | GUI stores | Add window management state |
| `src/stores/` | Pinia stores | Add application-level state |
| `src/commands/` | Command handling | Add new terminal commands |
| `src/utils/` | Utility functions | Add general utilities |
| `src/platform/plugins/` | Plugin system | Add plugin types or extensions |
| `packages/worker/src/routes/` | Backend API | Modify API endpoints |

---

## Adding a New Tool

SCP-OS uses a tool registry pattern. Adding a new tool requires only 3 steps:

### 1. Create Tool Components

Create a new directory under `src/gui/tools/` with desktop and mobile components:

```
src/gui/tools/mytool/
├── PCMyTool.vue        # Desktop component
└── MobileMyTool.vue    # Mobile component
```

### 2. Register the Tool

Add registration code in `src/gui/registry/registerTools.ts`:

```typescript
import PCMyTool from '../tools/mytool/PCMyTool.vue'
import MobileMyTool from '../tools/mytool/MobileMyTool.vue'

registerTool({
  id: 'mytool',
  label: (t) => t('tools.mytool'),
  icon: iconMyTool(),  // SVG function from icons.ts
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
    logger.info('MyTool opened')
  },
  onClose: () => {
    logger.info('MyTool closed')
  },
})
```

### 3. Add Internationalization Text

Add translations in the language packs of `src/gui/composables/useI18n.ts`:

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

Done! The new tool will automatically appear in desktop icons, start menu, and mobile home screen.

---

## License

By contributing code to this project, you agree that your contributions will be licensed under the MIT License. SCP Foundation-related content follows the CC BY-SA 3.0 License.
