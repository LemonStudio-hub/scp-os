import type { CommandHandler } from '../../types/command'
import type { PermissionRisk, PermissionSummary } from './permission-registry'

export type LocalAppRuntime = 'command-module' | 'iframe-app'

export interface LocalAppCommandManifest {
  name: string
  aliases?: string[]
  description: string
  usage?: string
  permissions?: string[]
}

export interface LocalAppManifest {
  schemaVersion: 1
  id: string
  name: string
  version: string
  runtime: LocalAppRuntime
  entry: string
  description?: string
  author?: string
  icon?: string
  commands?: LocalAppCommandManifest[]
  window?: {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    resizable?: boolean
  }
  sandbox?: {
    allowSameOrigin?: boolean
    allowPopups?: boolean
    allowTopNavigationByUserActivation?: boolean
  }
  permissions?: string[]
}

export interface InstalledLocalApp {
  manifest: LocalAppManifest
  rootPath: string
  toolId: string
  source: 'directory' | 'zip'
  installedAt: number
}

export interface LocalAppInstallResult {
  success: boolean
  app?: InstalledLocalApp
  error?: string
  validation?: PackageValidationResult
}

export interface LocalAppPackageFile {
  path: string
  content: string
  size?: number
}

export interface PackageDiagnostic {
  severity: 'error' | 'warning'
  code: string
  message: string
  path?: string
}

export interface PackageValidationResult {
  ok: boolean
  manifest?: LocalAppManifest
  errors: PackageDiagnostic[]
  warnings: PackageDiagnostic[]
  permissions: PermissionSummary[]
  risk: PermissionRisk
}

export interface LocalAppCommandContext {
  commands: {
    register(command: LocalAppCommandManifest & { handler: CommandHandler }): void
  }
  storage: {
    get(key: string): string | null
    set(key: string, value: string): void
    remove(key: string): void
  }
  permissions: string[]
}
