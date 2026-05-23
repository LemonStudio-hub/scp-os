const fs = require('fs');
const path = require('path');

// ── Configuration ─────────────────────────────────────────────────────
const TARGET_DIRS = [
  'packages/app/src/gui',
];

const FILE_EXTENSIONS = ['.vue', '.css', '.ts'];

// Files to skip (already fixed or special cases)
const SKIP_FILES = [
  'themeStore.ts',
  'index.ts', // themes/index.ts is the source of truth
  'design-tokens.ts',
];

// ── Replacement Rules ─────────────────────────────────────────────────
// Each rule: find regex, replacement string
// We process ONLY inside <style> blocks and inline style="..." attributes
// We SKIP anything already inside var(...)

function createVarRegex(property, value) {
  // Match `property: value` but NOT when preceded by `var(..., ` or inside var()
  // This is a best-effort heuristic
  return new RegExp(`(?<!var\\([^)]{0,50})\\b(${property}):\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
}

const STYLE_REPLACEMENTS = [
  // Backgrounds
  { find: /background:\s*#0a0a0a\b/g, rep: 'background: var(--gui-bg-base, #0a0a0a)' },
  { find: /background:\s*#0f0f0f\b/g, rep: 'background: var(--gui-bg-surface, #0f0f0f)' },
  { find: /background:\s*#111111\b/g, rep: 'background: var(--gui-bg-surface, #111111)' },
  { find: /background:\s*#1a1a1a\b/g, rep: 'background: var(--gui-bg-surface-raised, #1a1a1a)' },
  { find: /background:\s*#141414\b/g, rep: 'background: var(--gui-bg-surface, #141414)' },
  { find: /background:\s*#242424\b/g, rep: 'background: var(--gui-bg-surface-raised, #242424)' },
  { find: /background:\s*#1c1c1e\b/g, rep: 'background: var(--gui-bg-surface, #1c1c1e)' },
  { find: /background:\s*#2c2c2e\b/g, rep: 'background: var(--gui-bg-surface-raised, #2c2c2e)' },
  { find: /background:\s*#000000\b/g, rep: 'background: var(--gui-bg-base, #000000)' },
  { find: /background:\s*#060606\b/g, rep: 'background: var(--gui-bg-base, #060606)' },
  { find: /background:\s*#ffffff\b/g, rep: 'background: var(--gui-bg-surface, #ffffff)' },

  // Background-color shorthand
  { find: /background-color:\s*#0a0a0a\b/g, rep: 'background-color: var(--gui-bg-base, #0a0a0a)' },
  { find: /background-color:\s*#111111\b/g, rep: 'background-color: var(--gui-bg-surface, #111111)' },
  { find: /background-color:\s*#1a1a1a\b/g, rep: 'background-color: var(--gui-bg-surface-raised, #1a1a1a)' },
  { find: /background-color:\s*#000000\b/g, rep: 'background-color: var(--gui-bg-base, #000000)' },

  // Text colors
  { find: /color:\s*#ffffff\b/g, rep: 'color: var(--gui-text-primary, #ffffff)' },
  { find: /color:\s*#fff\b/g, rep: 'color: var(--gui-text-primary, #fff)' },
  { find: /color:\s*#e0e0e0\b/g, rep: 'color: var(--gui-text-primary, #e0e0e0)' },
  { find: /color:\s*#cccccc\b/g, rep: 'color: var(--gui-text-secondary, #cccccc)' },
  { find: /color:\s*#aaaaaa\b/g, rep: 'color: var(--gui-text-secondary, #aaaaaa)' },
  { find: /color:\s*#888888\b/g, rep: 'color: var(--gui-text-secondary, #888888)' },
  { find: /color:\s*#666666\b/g, rep: 'color: var(--gui-text-tertiary, #666666)' },
  { find: /color:\s*#6a6a6a\b/g, rep: 'color: var(--gui-text-tertiary, #6a6a6a)' },
  { find: /color:\s*#444444\b/g, rep: 'color: var(--gui-text-disabled, #444444)' },
  { find: /color:\s*#4a4a4a\b/g, rep: 'color: var(--gui-text-disabled, #4a4a4a)' },
  { find: /color:\s*#000000\b/g, rep: 'color: var(--gui-text-inverse, #000000)' },
  { find: /color:\s*#000\b/g, rep: 'color: var(--gui-text-inverse, #000)' },

  // Borders
  { find: /border:\s*1px solid #1a1a1a\b/g, rep: 'border: 1px solid var(--gui-border-subtle, #1a1a1a)' },
  { find: /border:\s*1px solid #2a2a2a\b/g, rep: 'border: 1px solid var(--gui-border-default, #2a2a2a)' },
  { find: /border:\s*1px solid #222222\b/g, rep: 'border: 1px solid var(--gui-border-default, #222222)' },
  { find: /border:\s*0\.5px solid #1a1a1a\b/g, rep: 'border: 0.5px solid var(--gui-border-subtle, #1a1a1a)' },
  { find: /border-bottom:\s*1px solid #1a1a1a\b/g, rep: 'border-bottom: 1px solid var(--gui-border-subtle, #1a1a1a)' },
  { find: /border-bottom:\s*1px solid #2a2a2a\b/g, rep: 'border-bottom: 1px solid var(--gui-border-default, #2a2a2a)' },
  { find: /border-top:\s*1px solid #1a1a1a\b/g, rep: 'border-top: 1px solid var(--gui-border-subtle, #1a1a1a)' },
  { find: /border-top:\s*1px solid #2a2a2a\b/g, rep: 'border-top: 1px solid var(--gui-border-default, #2a2a2a)' },
  { find: /border-right:\s*1px solid #1a1a1a\b/g, rep: 'border-right: 1px solid var(--gui-border-subtle, #1a1a1a)' },

  // Special accent/error colors
  { find: /color:\s*#e94560\b/g, rep: 'color: var(--gui-error, #e94560)' },
  { find: /color:\s*#ff3b30\b/g, rep: 'color: var(--gui-error, #ff3b30)' },
  { find: /color:\s*#ffcc00\b/g, rep: 'color: var(--gui-warning, #ffcc00)' },
  { find: /color:\s*#0a84ff\b/g, rep: 'color: var(--gui-info, #0a84ff)' },
  { find: /color:\s*#34c759\b/g, rep: 'color: var(--gui-success, #34c759)' },

  // Common rgba patterns for hover/active backgrounds
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.04\)/g, rep: 'background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.06\)/g, rep: 'background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)/g, rep: 'background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/g, rep: 'background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.12))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.15\)/g, rep: 'background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.15))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\)/g, rep: 'background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)/g, rep: 'background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.03))' },
  { find: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/g, rep: 'background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.05))' },

  // Border rgba patterns
  { find: /border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.06\)/g, rep: 'border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06))' },
  { find: /border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08))' },
  { find: /border:\s*0\.5px solid rgba\(255,\s*255,\s*255,\s*0\.06\)/g, rep: 'border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06))' },
  { find: /border:\s*0\.5px solid rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08))' },
  { find: /border:\s*1\.5px solid rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'border: 1.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08))' },
  { find: /border:\s*2px solid rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'border: 2px solid var(--gui-border-default, rgba(255, 255, 255, 0.08))' },
  { find: /border:\s*2px solid rgba\(255,\s*255,\s*255,\s*0\.1\)/g, rep: 'border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.1))' },
  { find: /border:\s*2px solid rgba\(255,\s*255,\s*255,\s*0\.25\)/g, rep: 'border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.25))' },
  { find: /border:\s*2px solid rgba\(255,\s*255,\s*255,\s*0\.3\)/g, rep: 'border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.3))' },
  { find: /border:\s*3px solid rgba\(255,\s*255,\s*255,\s*0\.2\)/g, rep: 'border: 3px solid var(--gui-border-default, rgba(255, 255, 255, 0.2))' },
  { find: /border-bottom:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.03\)/g, rep: 'border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.03))' },
  { find: /border-bottom:\s*0\.5px solid rgba\(255,\s*255,\s*255,\s*0\.06\)/g, rep: 'border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06))' },
  { find: /border-top:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.06\)/g, rep: 'border-top: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06))' },

  // Border-color rgba patterns
  { find: /border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.06\)/g, rep: 'border-color: var(--gui-border-subtle, rgba(255, 255, 255, 0.06))' },
  { find: /border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08))' },
  { find: /border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)/g, rep: 'border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.1))' },
  { find: /border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/g, rep: 'border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.12))' },

  // Inner glow / inset shadows
  { find: /inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.03\)/g, rep: 'var(--gui-inner-glow, inset 0 1px 0 rgba(255, 255, 255, 0.03))' },
  { find: /inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.05\)/g, rep: 'var(--gui-inner-glow, inset 0 1px 0 rgba(255, 255, 255, 0.05))' },
  { find: /inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.06\)/g, rep: 'var(--gui-inner-glow, inset 0 1px 0 rgba(255, 255, 255, 0.06))' },
  { find: /inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'var(--gui-inner-glow, inset 0 1px 0 rgba(255, 255, 255, 0.08))' },
  { find: /inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.1\)/g, rep: 'var(--gui-inner-glow, inset 0 1px 0 rgba(255, 255, 255, 0.1))' },

  // Text rgba patterns (subtle text colors)
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.08\)/g, rep: 'color: var(--gui-text-disabled, rgba(255, 255, 255, 0.08))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.15\)/g, rep: 'color: var(--gui-text-disabled, rgba(255, 255, 255, 0.15))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.18\)/g, rep: 'color: var(--gui-text-disabled, rgba(255, 255, 255, 0.18))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.2\)/g, rep: 'color: var(--gui-text-disabled, rgba(255, 255, 255, 0.2))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.22\)/g, rep: 'color: var(--gui-text-disabled, rgba(255, 255, 255, 0.22))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.25\)/g, rep: 'color: var(--gui-text-disabled, rgba(255, 255, 255, 0.25))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.3\)/g, rep: 'color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.3))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.35\)/g, rep: 'color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.35))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.4\)/g, rep: 'color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.4))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.45\)/g, rep: 'color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.45))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/g, rep: 'color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.5))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.55\)/g, rep: 'color: var(--gui-text-secondary, rgba(255, 255, 255, 0.55))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/g, rep: 'color: var(--gui-text-secondary, rgba(255, 255, 255, 0.6))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.65\)/g, rep: 'color: var(--gui-text-secondary, rgba(255, 255, 255, 0.65))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/g, rep: 'color: var(--gui-text-secondary, rgba(255, 255, 255, 0.7))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.75\)/g, rep: 'color: var(--gui-text-secondary, rgba(255, 255, 255, 0.75))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.8\)/g, rep: 'color: var(--gui-text-primary, rgba(255, 255, 255, 0.8))' },
  { find: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.9\)/g, rep: 'color: var(--gui-text-primary, rgba(255, 255, 255, 0.9))' },

  // Error/warning backgrounds
  { find: /background:\s*rgba\(255,\s*59,\s*48,\s*0\.1\)/g, rep: 'background: var(--gui-error-bg, rgba(255, 59, 48, 0.1))' },
  { find: /background:\s*rgba\(255,\s*59,\s*48,\s*0\.12\)/g, rep: 'background: var(--gui-error-bg, rgba(255, 59, 48, 0.12))' },
  { find: /background:\s*rgba\(255,\s*59,\s*48,\s*0\.15\)/g, rep: 'background: var(--gui-error-bg, rgba(255, 59, 48, 0.15))' },
  { find: /background:\s*rgba\(255,\s*59,\s*48,\s*0\.25\)/g, rep: 'background: var(--gui-error-bg, rgba(255, 59, 48, 0.25))' },
  { find: /background:\s*rgba\(255,\s*204,\s*0,\s*0\.1\)/g, rep: 'background: var(--gui-warning-bg, rgba(255, 204, 0, 0.1))' },
  { find: /background:\s*rgba\(255,\s*204,\s*0,\s*0\.12\)/g, rep: 'background: var(--gui-warning-bg, rgba(255, 204, 0, 0.12))' },
  { find: /background:\s*rgba\(255,\s*204,\s*0,\s*0\.15\)/g, rep: 'background: var(--gui-warning-bg, rgba(255, 204, 0, 0.15))' },
  { find: /background:\s*rgba\(255,\s*204,\s*0,\s*0\.25\)/g, rep: 'background: var(--gui-warning-bg, rgba(255, 204, 0, 0.25))' },

  // Box shadows (keep rgba(0,0,0,...) as-is for shadows, but wrap in var if appropriate)
  // We won't mass-replace shadows since they're generally OK across themes

  // Backdrop/overlay backgrounds
  { find: /background:\s*rgba\(0,\s*0,\s*0,\s*0\.5\)/g, rep: 'background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5))' },
  { find: /background:\s*rgba\(0,\s*0,\s*0,\s*0\.6\)/g, rep: 'background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.6))' },
  { find: /background:\s*rgba\(0,\s*0,\s*0,\s*0\.8\)/g, rep: 'background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.8))' },
  { find: /background:\s*rgba\(0,\s*0,\s*0,\s*0\.9\)/g, rep: 'background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.9))' },

  // Spinner borders
  { find: /border:\s*3px solid #1a1a1a\b/g, rep: 'border: 3px solid var(--gui-border-subtle, #1a1a1a)' },
  { find: /border:\s*2px solid rgba\(255,\s*255,\s*255,\s*0\.3\)/g, rep: 'border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.3))' },
];

// ── File Discovery ────────────────────────────────────────────────────
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules') continue;
      findFiles(fullPath, files);
    } else if (item.isFile()) {
      const ext = path.extname(item.name);
      if (FILE_EXTENSIONS.includes(ext) && !SKIP_FILES.some(s => item.name.includes(s))) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

// ── Process a Single File ─────────────────────────────────────────────
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let changes = 0;

  // Process <style> blocks
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  content = content.replace(styleRegex, (match, styleContent) => {
    let newStyle = styleContent;
    for (const rule of STYLE_REPLACEMENTS) {
      const before = newStyle;
      newStyle = newStyle.replace(rule.find, rule.rep);
      if (newStyle !== before) {
        const count = (before.match(rule.find) || []).length;
        changes += count;
      }
    }
    return match.replace(styleContent, newStyle);
  });

  // Process inline style="..." in templates
  const inlineStyleRegex = /style="([^"]*)"/g;
  content = content.replace(inlineStyleRegex, (match, inlineStyle) => {
    let newStyle = inlineStyle;
    for (const rule of STYLE_REPLACEMENTS) {
      const before = newStyle;
      // For inline styles, remove the `g` flag behavior by creating a new regex
      const inlineRule = new RegExp(rule.find.source.replace(/\\b/g, ''), 'g');
      newStyle = newStyle.replace(inlineRule, rule.rep);
      if (newStyle !== before) {
        const count = (before.match(inlineRule) || []).length;
        changes += count;
      }
    }
    return `style="${newStyle}"`;
  });

  // Process inline :style objects in JS (simplified)
  // e.g. background: '#0a0a0a' -> background: 'var(--gui-bg-base, #0a0a0a)'
  const jsReplacements = [
    { find: /background:\s*['"`]#0a0a0a['"`]/g, rep: "background: 'var(--gui-bg-base, #0a0a0a)'" },
    { find: /background:\s*['"`]#111111['"`]/g, rep: "background: 'var(--gui-bg-surface, #111111)'" },
    { find: /background:\s*['"`]#1a1a1a['"`]/g, rep: "background: 'var(--gui-bg-surface-raised, #1a1a1a)'" },
    { find: /color:\s*['"`]#ffffff['"`]/g, rep: "color: 'var(--gui-text-primary, #ffffff)'" },
    { find: /color:\s*['"`]#fff['"`]/g, rep: "color: 'var(--gui-text-primary, #fff)'" },
    { find: /color:\s*['"`]#000000['"`]/g, rep: "color: 'var(--gui-text-inverse, #000000)'" },
    { find: /border:\s*['"`][^'"`]*rgba\(255,\s*255,\s*255,\s*0\.06\)['"`]/g, rep: (m) => m.replace('rgba(255, 255, 255, 0.06)', 'var(--gui-border-subtle, rgba(255, 255, 255, 0.06))') },
  ];

  for (const rule of jsReplacements) {
    const before = content;
    content = content.replace(rule.find, rule.rep);
    if (content !== before) {
      changes += 1;
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { path: filePath, changes };
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────
const rootDir = path.resolve(__dirname);
let allFiles = [];
for (const dir of TARGET_DIRS) {
  const fullDir = path.join(rootDir, dir);
  if (fs.existsSync(fullDir)) {
    allFiles = allFiles.concat(findFiles(fullDir));
  }
}

console.log(`Found ${allFiles.length} files to process`);

const results = [];
for (const file of allFiles) {
  try {
    const result = processFile(file);
    if (result) {
      results.push(result);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}

console.log(`\nModified ${results.length} files:`);
let totalChanges = 0;
for (const r of results) {
  console.log(`  ${path.relative(rootDir, r.path)}: ${r.changes} replacements`);
  totalChanges += r.changes;
}
console.log(`\nTotal replacements: ${totalChanges}`);
