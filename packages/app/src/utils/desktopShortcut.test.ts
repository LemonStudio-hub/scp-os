import { describe, it, expect } from 'vitest'
import { parseDesktopFile, serializeDesktopFile, type DesktopShortcut } from './desktopShortcut'

describe('desktopShortcut', () => {
  describe('parseDesktopFile', () => {
    it('parses a valid .desktop file', () => {
      const content = [
        '[Desktop Entry]',
        'Name=Terminal',
        'Type=Application',
        'Tool=terminal',
        'Icon=terminal',
        'X=100',
        'Y=200',
      ].join('\n')

      const result = parseDesktopFile(content)
      expect(result).toEqual({
        name: 'Terminal',
        type: 'Application',
        tool: 'terminal',
        icon: 'terminal',
        x: 100,
        y: 200,
      })
    })

    it('returns null when Name is missing', () => {
      const content = ['[Desktop Entry]', 'Tool=terminal', 'Icon=terminal'].join('\n')
      expect(parseDesktopFile(content)).toBeNull()
    })

    it('returns null when Tool is missing', () => {
      const content = ['[Desktop Entry]', 'Name=Terminal', 'Icon=terminal'].join('\n')
      expect(parseDesktopFile(content)).toBeNull()
    })

    it('uses defaults for optional fields', () => {
      const content = ['[Desktop Entry]', 'Name=Test', 'Tool=test'].join('\n')
      const result = parseDesktopFile(content)!
      expect(result.type).toBe('Application')
      expect(result.icon).toBe('file')
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('skips empty lines and header', () => {
      const content = '\n[Desktop Entry]\n\nName=A\nTool=B\n'
      const result = parseDesktopFile(content)
      expect(result).not.toBeNull()
      expect(result!.name).toBe('A')
    })

    it('handles values containing equals sign', () => {
      const content = ['[Desktop Entry]', 'Name=A=B', 'Tool=t'].join('\n')
      const result = parseDesktopFile(content)!
      expect(result.name).toBe('A=B')
    })

    it('returns null for empty content', () => {
      expect(parseDesktopFile('')).toBeNull()
    })
  })

  describe('serializeDesktopFile', () => {
    it('serializes a shortcut to .desktop format', () => {
      const shortcut: DesktopShortcut = {
        name: 'Files',
        type: 'Application',
        tool: 'filemanager',
        icon: 'folder',
        x: 50,
        y: 150,
      }
      const result = serializeDesktopFile(shortcut)
      expect(result).toBe(
        [
          '[Desktop Entry]',
          'Name=Files',
          'Type=Application',
          'Tool=filemanager',
          'Icon=folder',
          'X=50',
          'Y=150',
        ].join('\n')
      )
    })

    it('round-trips with parseDesktopFile', () => {
      const original: DesktopShortcut = {
        name: 'Chat',
        type: 'Application',
        tool: 'chat',
        icon: 'chat',
        x: 300,
        y: 400,
      }
      const serialized = serializeDesktopFile(original)
      const parsed = parseDesktopFile(serialized)
      expect(parsed).toEqual(original)
    })
  })
})
