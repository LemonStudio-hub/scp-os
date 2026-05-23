const fs = require('fs')
const path = require('path')

const TARGET_DIRS = ['components', 'desktop', 'mobile', 'tools']

const REPLACEMENTS = [
  // GitHub dark colors → CSS variables
  { from: 'background: #161b22;', to: 'background: var(--gui-bg-surface);' },
  { from: 'background: #21262d;', to: 'background: var(--gui-border-default);' },
  { from: 'border: 1px solid #21262d;', to: 'border: 1px solid var(--gui-border-default);' },
  {
    from: 'border-bottom: 1px solid #21262d;',
    to: 'border-bottom: 1px solid var(--gui-border-default);',
  },
  { from: 'color: #c9d1d9;', to: 'color: var(--gui-text-secondary);' },
  { from: 'color: #8b949e;', to: 'color: var(--gui-text-tertiary);' },
  { from: 'color: #58a6ff;', to: 'color: var(--gui-accent);' },
  { from: 'color: #e6edf3;', to: 'color: var(--gui-text-primary);' },
  { from: 'color: #fff;', to: 'color: var(--gui-text-inverse);' },
  { from: 'color: #484f58;', to: 'color: var(--gui-text-disabled);' },
  { from: 'color: #f85149;', to: 'color: var(--gui-error);' },
  { from: 'background: #30363d;', to: 'background: var(--gui-border-default);' },
  { from: 'color: #1c2129;', to: 'color: var(--gui-bg-surface-hover);' },
  { from: 'background: #1c2129;', to: 'background: var(--gui-bg-surface-hover);' },
  { from: 'color: #238636;', to: 'color: var(--gui-success);' },
  { from: 'background: #238636;', to: 'background: var(--gui-success);' },
  { from: 'color: #3fb950;', to: 'color: var(--gui-success);' },
  { from: 'color: #d29922;', to: 'color: var(--gui-warning);' },
  { from: 'color: #a371f7;', to: 'color: var(--gui-accent);' },

  // Semantic rgba backgrounds
  { from: 'background: rgba(248, 81, 73, 0.9);', to: 'background: var(--gui-error-bg);' },
  { from: 'background: rgba(56, 139, 253, 0.12);', to: 'background: var(--gui-accent-soft);' },
  { from: 'background: rgba(46, 160, 67, 0.12);', to: 'background: var(--gui-success-bg);' },
  { from: 'background: rgba(210, 153, 34, 0.12);', to: 'background: var(--gui-warning-bg);' },
  { from: 'background: rgba(163, 113, 247, 0.12);', to: 'background: var(--gui-accent-soft);' },
  { from: 'background: rgba(56, 139, 253, 0.04);', to: 'background: var(--gui-accent-soft);' },
  { from: 'background: rgba(248, 81, 73, 0.1);', to: 'background: var(--gui-error-bg);' },

  // Common status colors
  { from: "color: '#FF3B30'", to: "color: 'var(--gui-error)'" },
  { from: "color: '#34C759'", to: "color: 'var(--gui-success)'" },
  { from: "color: '#FF9500'", to: "color: 'var(--gui-warning)'" },
  { from: "color: '#5AC8FA'", to: "color: 'var(--gui-info)'" },
  { from: "color: '#0A84FF'", to: "color: 'var(--gui-info)'" },
  { from: "background: '#FF3B30'", to: "background: 'var(--gui-error)'" },
  { from: "background: '#34C759'", to: "background: 'var(--gui-success)'" },
  { from: "background: '#FF9500'", to: "background: 'var(--gui-warning)'" },
  { from: "background: '#5AC8FA'", to: "background: 'var(--gui-info)'" },
  { from: "background: '#0A84FF'", to: "background: 'var(--gui-info)'" },

  // Border colors
  { from: 'border-color: #21262d;', to: 'border-color: var(--gui-border-default);' },
  { from: 'border-color: #30363d;', to: 'border-color: var(--gui-border-default);' },
  { from: 'border-color: #58a6ff;', to: 'border-color: var(--gui-accent);' },
  { from: 'border-color: #ff9500;', to: 'border-color: var(--gui-warning);' },
  { from: 'border-left-color: #ff9500;', to: 'border-left-color: var(--gui-warning);' },
  { from: 'border-left-color: #58a6ff;', to: 'border-left-color: var(--gui-accent);' },
  { from: 'border-top-color: #58a6ff;', to: 'border-top-color: var(--gui-accent);' },
  { from: 'border: 2px solid #30363d;', to: 'border: 2px solid var(--gui-border-default);' },
  { from: 'border: 2px solid #fff;', to: 'border: 2px solid var(--gui-text-inverse);' },

  // More subtle text colors
  { from: 'color: #0d1117;', to: 'color: var(--gui-bg-base);' },
]

function findVueFiles(dir) {
  const results = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...findVueFiles(fullPath))
    } else if (item.name.endsWith('.vue')) {
      results.push(fullPath)
    }
  }
  return results
}

const baseDir = path.join(__dirname)
const files = []
TARGET_DIRS.forEach((d) => {
  const dir = path.join(baseDir, d)
  if (fs.existsSync(dir)) files.push(...findVueFiles(dir))
})

let totalChanges = 0
const changedFiles = []

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  let fileChanges = 0

  for (const repl of REPLACEMENTS) {
    const regex = new RegExp(repl.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    const matches = content.match(regex)
    if (matches) {
      content = content.replace(regex, repl.to)
      fileChanges += matches.length
    }
  }

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content)
    totalChanges += fileChanges
    changedFiles.push(`${path.relative(baseDir, filePath)}: ${fileChanges} changes`)
  }
})

console.log(`Replaced ${totalChanges} occurrences across ${changedFiles.length} files:`)
changedFiles.forEach((f) => console.log('  ' + f))
