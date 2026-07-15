import { describe, expect, it } from 'vitest'
import { validateLocalAppPackage } from './local-app-validator'
import type { LocalAppPackageFile } from './local-app.types'

function basePackage(overrides: Record<string, unknown> = {}): LocalAppPackageFile[] {
  return [
    {
      path: 'scp-app.json',
      content: JSON.stringify({
        schemaVersion: 1,
        id: 'local.validator-test',
        name: 'Validator Test',
        version: '1.0.0',
        runtime: 'iframe-app',
        entry: 'index.html',
        permissions: ['storage'],
        ...overrides,
      }),
      size: 160,
    },
    {
      path: 'index.html',
      content: '<!doctype html><html><body>ok</body></html>',
      size: 44,
    },
  ]
}

function errorCodes(files: LocalAppPackageFile[]): string[] {
  return validateLocalAppPackage(files).errors.map((error) => error.code)
}

describe('validateLocalAppPackage', () => {
  it('accepts a valid iframe local app package', () => {
    const result = validateLocalAppPackage(basePackage())

    expect(result.ok).toBe(true)
    expect(result.manifest?.id).toBe('local.validator-test')
    expect(result.permissions[0]).toMatchObject({ id: 'storage', risk: 'low' })
  })

  it('rejects missing manifest and missing entry files', () => {
    expect(errorCodes([{ path: 'index.html', content: 'ok', size: 2 }])).toContain(
      'MANIFEST_MISSING'
    )
    expect(errorCodes(basePackage({ entry: 'missing.html' }))).toContain('ENTRY_MISSING')
  })

  it('rejects unsafe paths and unknown permissions', () => {
    const unsafe = basePackage()
    unsafe.push({ path: '../escape.txt', content: 'bad', size: 3 })

    expect(errorCodes(unsafe)).toContain('UNSAFE_PATH')
    expect(errorCodes(basePackage({ permissions: ['storage', 'unknown.permission'] }))).toContain(
      'UNKNOWN_PERMISSION'
    )
  })

  it('rejects duplicate command names and aliases', () => {
    const result = validateLocalAppPackage(
      basePackage({
        runtime: 'command-module',
        entry: 'commands.js',
        commands: [
          {
            name: 'hello',
            aliases: ['hi'],
            description: 'Say hello',
          },
          {
            name: 'hi',
            aliases: [],
            description: 'Conflict',
          },
        ],
      }).concat({ path: 'commands.js', content: 'export function activate() {}', size: 29 })
    )

    expect(result.errors.map((error) => error.code)).toContain('COMMAND_DUPLICATE')
  })

  it('rejects package size, file size, and file count limits', () => {
    const tooLargeFile = basePackage().concat({
      path: 'large.bin',
      content: '',
      size: 11 * 1024 * 1024,
    })
    expect(errorCodes(tooLargeFile)).toContain('FILE_TOO_LARGE')

    const tooLargePackage = basePackage().concat({
      path: 'total.bin',
      content: '',
      size: 51 * 1024 * 1024,
    })
    expect(errorCodes(tooLargePackage)).toContain('PACKAGE_TOO_LARGE')

    const tooManyFiles = basePackage().concat(
      Array.from({ length: 1001 }, (_, index) => ({
        path: `files/${index}.txt`,
        content: 'x',
        size: 1,
      }))
    )
    expect(errorCodes(tooManyFiles)).toContain('PACKAGE_TOO_MANY_FILES')
  })
})
