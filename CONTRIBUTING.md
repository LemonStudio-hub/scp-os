# Contributing to SCP-OS

Thank you for your interest in contributing to SCP-OS! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We follow a community-first approach and expect all contributors to maintain a positive environment.

## How to Contribute

### Reporting Bugs

1. Check the [issue tracker](https://github.com/LemonStudio-hub/scp-os/issues) to see if the bug has been reported
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node.js version)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain how it fits with the project goals

### Code Contributions

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
3. **Make your changes** following the project conventions
4. **Write tests** for new functionality
5. **Ensure all tests pass**: `pnpm run test`
6. **Ensure type checking passes**: `pnpm run lint`
7. **Commit** with a clear message (see Conventional Commits below)
8. **Push** and open a Pull Request

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `ci`: CI/CD changes
- `chore`: Other changes

**Examples:**
- `feat(terminal): add command highlighting`
- `fix(composables): resolve tab state persistence`
- `docs(readme): update installation instructions`
- `ci(workflow): fix pnpm version in CI`

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/scp-os.git
cd scp-os

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
pnpm run test

# Type checking
pnpm run lint
```

## Project Conventions

### TypeScript
- Use strict mode
- Avoid `any` type
- Provide explicit return types for functions
- Use interfaces for object shapes

### Vue 3
- Use Composition API with `<script setup>`
- Use `ref` for primitive values, `reactive` for objects
- Keep components focused (Single Responsibility)

### Testing
- Name tests clearly: `it('should do X when Y')`
- Test edge cases and error conditions
- Mock external dependencies

### File Naming
- Components: PascalCase (`SCPTerminal.vue`)
- Utilities: camelCase (`terminal.ts`)
- Tests: `*.test.ts`
- Constants: kebab-case files, UPPER_CASE exports

## Pull Request Guidelines

- Keep PRs focused and reasonably sized
- Include tests for new functionality
- Update documentation if needed
- Reference related issues in description
- Ensure CI passes before requesting review

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License (for code) and CC BY-SA 3.0 (for SCP Foundation content).
