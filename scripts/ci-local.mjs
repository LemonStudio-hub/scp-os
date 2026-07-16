#!/usr/bin/env node
/**
 * Local CI gate — mirrors .github/workflows/ci.yml before push.
 *
 * Usage: pnpm run ci:local
 *
 * Steps: typecheck → lint → format (touched app files) → test → production build
 * Do not push if this script exits non-zero.
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)

const isWin = process.platform === 'win32'
let failed = 0

function banner(title) {
  console.log(`\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}\n`)
}

function run(label, command, opts = {}) {
  banner(label)
  console.log(`$ ${command}\n`)
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, ...opts.env },
    cwd: root,
  })
  const code = result.status ?? 1
  if (code !== 0) {
    console.error(`\n✖ FAILED: ${label} (exit ${code})`)
    failed = code || 1
    if (!opts.continueOnFail) process.exit(failed)
  } else {
    console.log(`\n✓ ${label}`)
  }
  return code === 0
}

function changedAppFiles() {
  try {
    const out = execSync('git diff --name-only HEAD -- packages/app', {
      encoding: 'utf8',
      cwd: root,
    })
    const staged = execSync('git diff --cached --name-only -- packages/app', {
      encoding: 'utf8',
      cwd: root,
    })
    const set = new Set(
      `${out}\n${staged}`
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((f) => !f.includes('..'))
        .map((f) => f.replace(/^packages\/app\//, ''))
        .filter((f) => existsSync(path.join(root, 'packages/app', f))),
    )
    return [...set]
  } catch {
    return []
  }
}

// 1) Typecheck (app + worker) — same as CI
run('Typecheck', 'pnpm run typecheck')

// 2) ESLint
run('ESLint', 'pnpm run lint:check')

// 3) Prettier
// Full-tree format:check is unreliable on Windows with core.autocrlf=true
// (working tree is CRLF, Prettier endOfLine is lf). CI runs on Linux LF.
// Locally we check only touched app files; always run full check on non-Windows.
banner('Prettier format check')
if (isWin) {
  const files = changedAppFiles()
  if (files.length === 0) {
    console.log('Windows: no dirty packages/app files — skip format check')
    console.log('(CI still runs full prettier --check on Linux)')
  } else {
    console.log(`Windows: checking ${files.length} dirty file(s) under packages/app`)
    const quoted = files.map((f) => `"${f.replace(/"/g, '\\"')}"`).join(' ')
    run(
      'Prettier (dirty files)',
      `pnpm --filter @scp-os/app exec prettier --check ${quoted}`,
      { continueOnFail: false },
    )
  }
} else {
  run('Prettier (full tree)', 'pnpm --filter @scp-os/app run format:check')
}

// 4) Tests (app + worker)
run('Tests', 'pnpm run test', {
  env: { NODE_OPTIONS: '--max-old-space-size=4096' },
})

// 5) Production build (catches Vue SFC parse errors prettier can introduce)
run('Production build', 'pnpm run build:production', {
  env: { NODE_ENV: 'production' },
})

banner(failed ? 'LOCAL CI FAILED — do not push' : 'LOCAL CI PASSED — safe to push')
process.exit(failed)
