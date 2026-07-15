import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const fflateUrl = pathToFileURL(
  path.join(rootDir, 'packages/app/node_modules/fflate/esm/index.mjs')
).href
const { unzipSync, strFromU8 } = await import(fflateUrl)

const MAX_PACKAGE_BYTES = 50 * 1024 * 1024
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILE_COUNT = 1000
const APP_ID_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i
const SEMVERISH_RE = /^[0-9]+(?:\.[0-9]+){0,2}(?:[-+][a-z0-9.-]+)?$/i
const COMMAND_RE = /^[a-z][a-z0-9:_-]{0,63}$/i

const permissions = [
  ['storage', '本地存储', 'low', ['iframe-app', 'command-module'], 'available'],
  ['notifications', '通知', 'low', ['iframe-app'], 'available'],
  ['window.control', '窗口控制', 'low', ['iframe-app'], 'available'],
  ['ui.cursor', '鼠标样式', 'medium', ['iframe-app'], 'available'],
  ['theme.read', '读取主题', 'low', ['iframe-app'], 'available'],
  ['theme.write', '修改主题', 'medium', ['iframe-app'], 'available'],
  ['network', '网络访问', 'medium', ['iframe-app'], 'planned'],
  ['clipboard.read', '读取剪贴板', 'high', ['iframe-app'], 'planned'],
  ['clipboard.write', '写入剪贴板', 'medium', ['iframe-app'], 'planned'],
  ['filesystem.read', '读取文件', 'high', ['iframe-app', 'command-module'], 'planned'],
  ['filesystem.write', '写入文件', 'high', ['iframe-app', 'command-module'], 'planned'],
  ['terminal.run', '执行终端命令', 'high', ['iframe-app'], 'planned'],
  ['shortcuts.write', '管理快捷方式', 'high', ['iframe-app'], 'planned'],
].map(([id, title, risk, runtimes, status]) => ({ id, title, risk, runtimes, status }))

const permissionById = new Map(permissions.map((permission) => [permission.id, permission]))
const riskRank = { low: 1, medium: 2, high: 3 }

function diagnostic(severity, code, message, filePath) {
  return { severity, code, message, path: filePath }
}

function normalizePackagePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '')
}

function isSafePackagePath(filePath) {
  if (!filePath || filePath.startsWith('/') || /^[a-z]:/i.test(filePath)) return false
  const normalized = normalizePackagePath(filePath)
  if (!normalized) return false
  return normalized.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
}

function isTextPath(filePath) {
  return /\.(html?|css|js|mjs|json|txt|md|svg|xml|csv|log)$/i.test(filePath)
}

function validateString(raw, field, errors, options = {}) {
  if (raw === undefined || raw === null) {
    if (options.required) {
      errors.push(diagnostic('error', 'MANIFEST_FIELD_REQUIRED', `${field} is required`))
    }
    return undefined
  }
  if (typeof raw !== 'string' || raw.trim() === '') {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} must be a non-empty string`))
    return undefined
  }
  const value = raw.trim()
  if (options.max && value.length > options.max) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} is too long`))
  }
  if (options.pattern && !options.pattern.test(value)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} has invalid format`))
  }
  return value
}

function validateBoolean(raw, field, errors) {
  if (raw === undefined) return undefined
  if (typeof raw !== 'boolean') {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} must be boolean`))
    return undefined
  }
  return raw
}

function validateNumber(raw, field, errors) {
  if (raw === undefined) return undefined
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} must be a finite number`))
    return undefined
  }
  return raw
}

function validatePermissions(raw, runtime, errors, warnings) {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'permissions must be an array'))
    return []
  }

  const seen = new Set()
  const result = []
  for (const item of raw) {
    if (typeof item !== 'string' || item.trim() === '') {
      errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'permission id must be a non-empty string'))
      continue
    }
    const id = item.trim()
    const permission = permissionById.get(id)
    if (!permission) {
      errors.push(diagnostic('error', 'UNKNOWN_PERMISSION', `Unknown permission: ${id}`))
      continue
    }
    if (runtime && !permission.runtimes.includes(runtime)) {
      warnings.push(diagnostic('warning', 'PERMISSION_RUNTIME_MISMATCH', `${id} is unusual for ${runtime}`))
    }
    if (!seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  return result
}

function validateCommands(raw, errors) {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'commands must be an array'))
    return []
  }

  const seen = new Set()
  return raw
    .map((command, index) => {
      if (!command || typeof command !== 'object' || Array.isArray(command)) {
        errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `commands[${index}] must be an object`))
        return null
      }

      const name = validateString(command.name, `commands[${index}].name`, errors, {
        required: true,
        pattern: COMMAND_RE,
      })
      const description =
        validateString(command.description, `commands[${index}].description`, errors, {
          required: true,
        }) ?? ''
      const aliases = Array.isArray(command.aliases)
        ? command.aliases.filter((alias) => typeof alias === 'string').map((alias) => alias.trim()).filter(Boolean)
        : []

      for (const token of [name, ...aliases]) {
        if (!token) continue
        if (!COMMAND_RE.test(token)) {
          errors.push(diagnostic('error', 'COMMAND_INVALID', `Invalid command or alias: ${token}`))
          continue
        }
        const normalized = token.toLowerCase()
        if (seen.has(normalized)) {
          errors.push(diagnostic('error', 'COMMAND_DUPLICATE', `Duplicate command or alias: ${token}`))
        }
        seen.add(normalized)
      }

      return name
        ? {
            name,
            aliases,
            description,
            usage: typeof command.usage === 'string' ? command.usage : undefined,
            permissions: Array.isArray(command.permissions)
              ? command.permissions.filter((permission) => typeof permission === 'string')
              : undefined,
          }
        : null
    })
    .filter(Boolean)
}

function validateWindow(raw, errors) {
  if (raw === undefined) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'window must be an object'))
    return undefined
  }
  return {
    width: validateNumber(raw.width, 'window.width', errors),
    height: validateNumber(raw.height, 'window.height', errors),
    minWidth: validateNumber(raw.minWidth, 'window.minWidth', errors),
    minHeight: validateNumber(raw.minHeight, 'window.minHeight', errors),
    resizable: validateBoolean(raw.resizable, 'window.resizable', errors),
  }
}

function validateSandbox(raw, errors) {
  if (raw === undefined) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'sandbox must be an object'))
    return undefined
  }
  return {
    allowSameOrigin: validateBoolean(raw.allowSameOrigin, 'sandbox.allowSameOrigin', errors),
    allowPopups: validateBoolean(raw.allowPopups, 'sandbox.allowPopups', errors),
    allowTopNavigationByUserActivation: validateBoolean(
      raw.allowTopNavigationByUserActivation,
      'sandbox.allowTopNavigationByUserActivation',
      errors
    ),
  }
}

function parseManifest(raw, errors, warnings) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_INVALID', 'scp-app.json must contain an object'))
    return null
  }

  if (raw.schemaVersion !== 1) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'schemaVersion must be 1'))
  }

  const id = validateString(raw.id, 'id', errors, { required: true, max: 64, pattern: APP_ID_RE })
  const name = validateString(raw.name, 'name', errors, { required: true, max: 80 })
  const version = validateString(raw.version, 'version', errors, {
    required: true,
    max: 40,
    pattern: SEMVERISH_RE,
  })
  const runtime = validateString(raw.runtime, 'runtime', errors, { required: true })
  const entry = validateString(raw.entry, 'entry', errors, { required: true, max: 240 })

  if (runtime && runtime !== 'command-module' && runtime !== 'iframe-app') {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'runtime must be command-module or iframe-app'))
  }
  if (entry && !isSafePackagePath(entry)) {
    errors.push(diagnostic('error', 'UNSAFE_PATH', `entry has unsafe path: ${entry}`))
  }

  const manifest = {
    schemaVersion: 1,
    id,
    name,
    version,
    runtime,
    entry: entry ? normalizePackagePath(entry) : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    author: typeof raw.author === 'string' ? raw.author : undefined,
    icon: typeof raw.icon === 'string' ? raw.icon : undefined,
    permissions: validatePermissions(raw.permissions, runtime, errors, warnings),
    commands: validateCommands(raw.commands, errors),
    window: validateWindow(raw.window, errors),
    sandbox: validateSandbox(raw.sandbox, errors),
  }

  return errors.length === 0 && id && name && version && runtime && entry ? manifest : null
}

function validateLocalAppPackage(files) {
  const errors = []
  const warnings = []

  if (files.length > MAX_FILE_COUNT) {
    errors.push(diagnostic('error', 'PACKAGE_TOO_MANY_FILES', `Package has more than ${MAX_FILE_COUNT} files`))
  }

  let totalSize = 0
  for (const file of files) {
    totalSize += file.size
    if (!isSafePackagePath(file.path)) {
      errors.push(diagnostic('error', 'UNSAFE_PATH', `Unsafe package path: ${file.path}`, file.path))
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(diagnostic('error', 'FILE_TOO_LARGE', `File exceeds 10MB: ${file.path}`, file.path))
    }
  }
  if (totalSize > MAX_PACKAGE_BYTES) {
    errors.push(diagnostic('error', 'PACKAGE_TOO_LARGE', 'Package exceeds 50MB'))
  }

  const manifestFiles = files.filter((file) => /(^|\/)scp-app\.json$/i.test(file.path))
  if (manifestFiles.length === 0) {
    errors.push(diagnostic('error', 'MANIFEST_MISSING', 'Missing scp-app.json'))
    return buildResult(null, errors, warnings)
  }
  if (manifestFiles.length > 1) {
    errors.push(diagnostic('error', 'MANIFEST_DUPLICATE', 'Package contains multiple scp-app.json files'))
  }

  let manifest = null
  try {
    manifest = parseManifest(JSON.parse(manifestFiles[0].content), errors, warnings)
  } catch {
    errors.push(diagnostic('error', 'MANIFEST_JSON_INVALID', 'scp-app.json is not valid JSON'))
  }

  if (manifest) {
    const rootPrefix = manifestFiles[0].path.replace(/scp-app\.json$/i, '')
    const entryPath = normalizePackagePath(`${rootPrefix}${manifest.entry}`)
    if (!files.some((file) => file.path === entryPath)) {
      errors.push(diagnostic('error', 'ENTRY_MISSING', `Entry file not found: ${manifest.entry}`))
    }
  }

  return buildResult(manifest, errors, warnings)
}

function buildResult(manifest, errors, warnings) {
  const ids = manifest?.permissions ?? []
  const summarized = ids.map((id) => permissionById.get(id)).filter(Boolean)
  const risk = summarized.reduce(
    (highest, permission) => (riskRank[permission.risk] > riskRank[highest] ? permission.risk : highest),
    'low'
  )
  return {
    ok: errors.length === 0,
    manifest: errors.length === 0 ? manifest ?? undefined : undefined,
    errors,
    warnings,
    permissions: summarized.map(({ id, title, risk, status }) => ({ id, title, risk, status })),
    risk,
  }
}

function readDirectoryPackage(inputPath) {
  const files = []
  const root = path.resolve(inputPath)

  function walk(current) {
    for (const dirent of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, dirent.name)
      if (dirent.isDirectory()) {
        walk(absolute)
        continue
      }
      if (!dirent.isFile()) continue
      const relative = normalizePackagePath(path.relative(root, absolute))
      const content = fs.readFileSync(absolute)
      files.push({
        path: relative,
        content: isTextPath(relative) ? content.toString('utf8') : '',
        size: content.byteLength,
      })
    }
  }

  walk(root)
  return files
}

function readZipPackage(inputPath) {
  const bytes = fs.readFileSync(inputPath)
  if (bytes.byteLength > MAX_PACKAGE_BYTES) {
    return [
      {
        path: path.basename(inputPath),
        content: '',
        size: bytes.byteLength,
      },
    ]
  }
  const unzipped = unzipSync(new Uint8Array(bytes))
  return Object.entries(unzipped)
    .filter(([filePath]) => !filePath.endsWith('/'))
    .map(([filePath, content]) => {
      const normalized = normalizePackagePath(filePath)
      return {
        path: normalized,
        content: isTextPath(normalized) ? strFromU8(content) : '',
        size: content.byteLength,
      }
    })
}

function printResult(result) {
  const app = result.manifest ? `${result.manifest.name} (${result.manifest.id})` : 'unknown app'
  console.log(`${result.ok ? 'OK' : 'FAILED'} ${app}`)
  console.log(`risk: ${result.risk}`)

  if (result.permissions.length) {
    console.log('permissions:')
    for (const permission of result.permissions) {
      console.log(`  - ${permission.id} (${permission.risk}, ${permission.status}) ${permission.title}`)
    }
  }

  if (result.errors.length) {
    console.log('errors:')
    for (const item of result.errors) console.log(`  - [${item.code}] ${item.message}`)
  }
  if (result.warnings.length) {
    console.log('warnings:')
    for (const item of result.warnings) console.log(`  - [${item.code}] ${item.message}`)
  }
}

const target = process.argv[2]
if (!target) {
  console.error('Usage: pnpm validate:local-app <directory-or-zip>')
  process.exit(2)
}

const resolved = path.resolve(target)
if (!fs.existsSync(resolved)) {
  console.error(`Path not found: ${target}`)
  process.exit(2)
}

const stat = fs.statSync(resolved)
const packageFiles = stat.isDirectory() ? readDirectoryPackage(resolved) : readZipPackage(resolved)
const result = validateLocalAppPackage(packageFiles)
printResult(result)
process.exit(result.ok ? 0 : 1)
