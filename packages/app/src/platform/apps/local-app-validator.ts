import type {
  LocalAppManifest,
  LocalAppPackageFile,
  LocalAppRuntime,
  PackageDiagnostic,
  PackageValidationResult,
} from './local-app.types'
import { permissionRegistry } from './permission-registry'

const MAX_PACKAGE_BYTES = 50 * 1024 * 1024
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILE_COUNT = 1000

const APP_ID_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i
const SEMVERISH_RE = /^[0-9]+(?:\.[0-9]+){0,2}(?:[-+][a-z0-9.-]+)?$/i
const COMMAND_RE = /^[a-z][a-z0-9:_-]{0,63}$/i

function diagnostic(
  severity: 'error' | 'warning',
  code: string,
  message: string,
  path?: string
): PackageDiagnostic {
  return { severity, code, message, path }
}

export function normalizePackagePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '')
}

export function isSafePackagePath(path: string): boolean {
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path)) return false
  const normalized = normalizePackagePath(path)
  if (!normalized) return false
  return normalized.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
}

function fileSize(file: LocalAppPackageFile): number {
  return typeof file.size === 'number' ? file.size : file.content.length
}

function validateString(
  raw: unknown,
  field: string,
  errors: PackageDiagnostic[],
  options: { required?: boolean; max?: number; pattern?: RegExp } = {}
): string | undefined {
  if (raw === undefined || raw === null) {
    if (options.required)
      errors.push(diagnostic('error', 'MANIFEST_FIELD_REQUIRED', `${field} is required`))
    return undefined
  }
  if (typeof raw !== 'string' || raw.trim() === '') {
    errors.push(
      diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} must be a non-empty string`)
    )
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

function validateBoolean(
  raw: unknown,
  field: string,
  errors: PackageDiagnostic[]
): boolean | undefined {
  if (raw === undefined) return undefined
  if (typeof raw !== 'boolean') {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} must be boolean`))
    return undefined
  }
  return raw
}

function validateNumber(
  raw: unknown,
  field: string,
  errors: PackageDiagnostic[]
): number | undefined {
  if (raw === undefined) return undefined
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', `${field} must be a finite number`))
    return undefined
  }
  return raw
}

function parseManifest(
  raw: unknown,
  errors: PackageDiagnostic[],
  warnings: PackageDiagnostic[]
): LocalAppManifest | null {
  const manifest = raw as Partial<LocalAppManifest>
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    errors.push(diagnostic('error', 'MANIFEST_INVALID', 'scp-app.json must contain an object'))
    return null
  }

  if (manifest.schemaVersion !== 1) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'schemaVersion must be 1'))
  }

  const id = validateString(manifest.id, 'id', errors, {
    required: true,
    max: 64,
    pattern: APP_ID_RE,
  })
  const name = validateString(manifest.name, 'name', errors, { required: true, max: 80 })
  const version = validateString(manifest.version, 'version', errors, {
    required: true,
    max: 40,
    pattern: SEMVERISH_RE,
  })
  const runtime = validateString(manifest.runtime, 'runtime', errors, { required: true }) as
    | LocalAppRuntime
    | undefined
  const entry = validateString(manifest.entry, 'entry', errors, { required: true, max: 240 })

  if (runtime && runtime !== 'command-module' && runtime !== 'iframe-app') {
    errors.push(
      diagnostic('error', 'MANIFEST_FIELD_INVALID', 'runtime must be command-module or iframe-app')
    )
  }
  if (entry && !isSafePackagePath(entry)) {
    errors.push(diagnostic('error', 'UNSAFE_PATH', `entry has unsafe path: ${entry}`))
  }

  const permissions = validatePermissions(manifest.permissions, runtime, errors, warnings)
  const commands = validateCommands(manifest.commands, errors)
  const windowConfig = validateWindow(manifest.window, errors)
  const sandbox = validateSandbox(manifest.sandbox, errors)

  if (errors.length > 0 || !id || !name || !version || !runtime || !entry) return null

  return {
    schemaVersion: 1,
    id,
    name,
    version,
    runtime,
    entry: normalizePackagePath(entry),
    description: typeof manifest.description === 'string' ? manifest.description : undefined,
    author: typeof manifest.author === 'string' ? manifest.author : undefined,
    icon: typeof manifest.icon === 'string' ? manifest.icon : undefined,
    commands,
    window: windowConfig,
    sandbox,
    permissions,
  }
}

function validatePermissions(
  raw: unknown,
  runtime: LocalAppRuntime | undefined,
  errors: PackageDiagnostic[],
  warnings: PackageDiagnostic[]
): string[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'permissions must be an array'))
    return []
  }

  const seen = new Set<string>()
  const permissions: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string' || item.trim() === '') {
      errors.push(
        diagnostic('error', 'MANIFEST_FIELD_INVALID', 'permission id must be a non-empty string')
      )
      continue
    }
    const id = item.trim()
    const definition = permissionRegistry.get(id)
    if (!definition) {
      errors.push(diagnostic('error', 'UNKNOWN_PERMISSION', `Unknown permission: ${id}`))
      continue
    }
    if (runtime && !definition.runtimes.includes(runtime)) {
      warnings.push(
        diagnostic('warning', 'PERMISSION_RUNTIME_MISMATCH', `${id} is unusual for ${runtime}`)
      )
    }
    if (!seen.has(id)) {
      seen.add(id)
      permissions.push(id)
    }
  }
  return permissions
}

function validateCommands(raw: unknown, errors: PackageDiagnostic[]): LocalAppManifest['commands'] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'commands must be an array'))
    return []
  }

  const seen = new Set<string>()
  return raw
    .map((command, index) => {
      const data = command as Record<string, unknown>
      const name = validateString(data.name, `commands[${index}].name`, errors, {
        required: true,
        pattern: COMMAND_RE,
      })
      const description =
        validateString(data.description, `commands[${index}].description`, errors, {
          required: true,
        }) ?? ''
      const aliases = Array.isArray(data.aliases)
        ? data.aliases
            .filter((alias): alias is string => typeof alias === 'string')
            .map((alias) => alias.trim())
            .filter(Boolean)
        : []
      const usage = typeof data.usage === 'string' ? data.usage : undefined
      const permissions = Array.isArray(data.permissions)
        ? data.permissions.filter(
            (permission): permission is string => typeof permission === 'string'
          )
        : undefined

      for (const token of [name, ...aliases]) {
        if (!token) continue
        if (!COMMAND_RE.test(token)) {
          errors.push(diagnostic('error', 'COMMAND_INVALID', `Invalid command or alias: ${token}`))
          continue
        }
        const normalized = token.toLowerCase()
        if (seen.has(normalized)) {
          errors.push(
            diagnostic('error', 'COMMAND_DUPLICATE', `Duplicate command or alias: ${token}`)
          )
        }
        seen.add(normalized)
      }

      return name ? { name, aliases, description, usage, permissions } : null
    })
    .filter(Boolean) as LocalAppManifest['commands']
}

function validateWindow(raw: unknown, errors: PackageDiagnostic[]): LocalAppManifest['window'] {
  if (raw === undefined) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'window must be an object'))
    return undefined
  }
  const data = raw as Record<string, unknown>
  return {
    width: validateNumber(data.width, 'window.width', errors),
    height: validateNumber(data.height, 'window.height', errors),
    minWidth: validateNumber(data.minWidth, 'window.minWidth', errors),
    minHeight: validateNumber(data.minHeight, 'window.minHeight', errors),
    resizable: validateBoolean(data.resizable, 'window.resizable', errors),
  }
}

function validateSandbox(raw: unknown, errors: PackageDiagnostic[]): LocalAppManifest['sandbox'] {
  if (raw === undefined) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(diagnostic('error', 'MANIFEST_FIELD_INVALID', 'sandbox must be an object'))
    return undefined
  }
  const data = raw as Record<string, unknown>
  return {
    allowSameOrigin: validateBoolean(data.allowSameOrigin, 'sandbox.allowSameOrigin', errors),
    allowPopups: validateBoolean(data.allowPopups, 'sandbox.allowPopups', errors),
    allowTopNavigationByUserActivation: validateBoolean(
      data.allowTopNavigationByUserActivation,
      'sandbox.allowTopNavigationByUserActivation',
      errors
    ),
  }
}

export function validateLocalAppPackage(files: LocalAppPackageFile[]): PackageValidationResult {
  const errors: PackageDiagnostic[] = []
  const warnings: PackageDiagnostic[] = []

  if (files.length > MAX_FILE_COUNT) {
    errors.push(
      diagnostic('error', 'PACKAGE_TOO_MANY_FILES', `Package has more than ${MAX_FILE_COUNT} files`)
    )
  }

  let totalSize = 0
  for (const file of files) {
    const size = fileSize(file)
    totalSize += size
    if (!isSafePackagePath(file.path)) {
      errors.push(
        diagnostic('error', 'UNSAFE_PATH', `Unsafe package path: ${file.path}`, file.path)
      )
    }
    if (size > MAX_FILE_BYTES) {
      errors.push(
        diagnostic('error', 'FILE_TOO_LARGE', `File exceeds 10MB: ${file.path}`, file.path)
      )
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
    errors.push(
      diagnostic('error', 'MANIFEST_DUPLICATE', 'Package contains multiple scp-app.json files')
    )
  }

  let manifest: LocalAppManifest | null = null
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

function buildResult(
  manifest: LocalAppManifest | null,
  errors: PackageDiagnostic[],
  warnings: PackageDiagnostic[]
): PackageValidationResult {
  const permissionIds = manifest?.permissions ?? []
  return {
    ok: errors.length === 0,
    manifest: errors.length === 0 ? (manifest ?? undefined) : undefined,
    errors,
    warnings,
    permissions: permissionRegistry.summarize(permissionIds),
    risk: permissionRegistry.highestRisk(permissionIds),
  }
}
