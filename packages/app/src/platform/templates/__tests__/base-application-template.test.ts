import { describe, it, expect } from 'vitest'
import { SimpleApplicationTemplate } from '../base-application-template'
import type {
  ApplicationTemplateMetadata,
  ApplicationTemplateConfig,
} from '../application-template.interface'

const createMetadata = (
  overrides: Partial<ApplicationTemplateMetadata> = {}
): ApplicationTemplateMetadata => ({
  id: 'tpl-1',
  name: 'Test Template',
  description: 'A template for testing',
  version: '1.0.0',
  author: 'tester',
  category: 'terminal',
  ...overrides,
})

const createConfig = (
  overrides: Partial<ApplicationTemplateConfig> = {}
): ApplicationTemplateConfig => ({
  appName: 'TestApp',
  appVersion: '1.0.0',
  defaultTheme: 'dark',
  uiTheme: { primary: '#000', secondary: '#fff' } as any,
  plugins: [{ name: 'plugin-a', enabled: true }],
  capabilities: { terminal: true, data: false, ui: false },
  features: {
    multiTab: true,
    gestureSupport: false,
    voiceControl: false,
    accessibility: true,
  },
  ...overrides,
})

describe('SimpleApplicationTemplate', () => {
  describe('validate', () => {
    it('returns no errors for valid config', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig())
      const result = tpl.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error when appName is missing', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig({ appName: '' }))
      const result = tpl.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Application name is required')
    })

    it('returns error when appName is whitespace only', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig({ appName: '   ' }))
      const result = tpl.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Application name is required')
    })

    it('returns error when appVersion is missing', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig({ appVersion: '' }))
      const result = tpl.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Application version is required')
    })

    it('returns error when plugins is not an array', () => {
      const tpl = new SimpleApplicationTemplate(
        createMetadata(),
        createConfig({ plugins: undefined as any })
      )
      const result = tpl.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Plugins must be an array')
    })

    it('returns error when a plugin has no name', () => {
      const tpl = new SimpleApplicationTemplate(
        createMetadata(),
        createConfig({
          plugins: [
            { name: 'good-plugin', enabled: true },
            { name: '', enabled: true },
          ],
        })
      )
      const result = tpl.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Plugin at index 1 must have a name')
    })
  })

  describe('getSummary', () => {
    it('returns summary with enabled features', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig())
      const summary = tpl.getSummary()

      expect(summary.name).toBe('Test Template')
      expect(summary.description).toBe('A template for testing')
      expect(summary.category).toBe('terminal')
      expect(summary.features).toContain('Multi-tab support')
      expect(summary.features).toContain('Accessibility features')
      expect(summary.features).not.toContain('Gesture controls')
      expect(summary.features).not.toContain('Voice control')
    })

    it('includes all features when all are enabled', () => {
      const tpl = new SimpleApplicationTemplate(
        createMetadata(),
        createConfig({
          features: {
            multiTab: true,
            gestureSupport: true,
            voiceControl: true,
            accessibility: true,
          },
        })
      )
      const summary = tpl.getSummary()
      expect(summary.features).toHaveLength(4)
    })

    it('returns empty features when all are disabled', () => {
      const tpl = new SimpleApplicationTemplate(
        createMetadata(),
        createConfig({
          features: {
            multiTab: false,
            gestureSupport: false,
            voiceControl: false,
            accessibility: false,
          },
        })
      )
      const summary = tpl.getSummary()
      expect(summary.features).toHaveLength(0)
    })
  })

  describe('toJSON', () => {
    it('returns valid JSON with metadata and config', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig())
      const json = tpl.toJSON()
      const parsed = JSON.parse(json)

      expect(parsed.metadata.id).toBe('tpl-1')
      expect(parsed.config.appName).toBe('TestApp')
    })

    it('produces pretty-printed JSON', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig())
      const json = tpl.toJSON()
      // Pretty-printed with 2-space indent
      expect(json).toContain('\n  ')
    })
  })

  describe('clone', () => {
    it('creates an independent deep copy', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig())
      const cloned = tpl.clone()

      // Modify the clone
      cloned.config.appName = 'ModifiedApp'
      cloned.config.plugins.push({ name: 'new-plugin', enabled: true })
      cloned.config.features.multiTab = false
      cloned.metadata.name = 'Modified Template'

      // Original is unchanged
      expect(tpl.config.appName).toBe('TestApp')
      expect(tpl.config.plugins).toHaveLength(1)
      expect(tpl.config.features.multiTab).toBe(true)
      expect(tpl.metadata.name).toBe('Test Template')
    })

    it('cloned template validates independently', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig())
      const cloned = tpl.clone()

      // Invalidate the clone
      cloned.config.appName = ''
      const cloneResult = cloned.validate()
      expect(cloneResult.valid).toBe(false)

      // Original still valid
      const originalResult = tpl.validate()
      expect(originalResult.valid).toBe(true)
    })

    it('clone preserves all data', () => {
      const tpl = new SimpleApplicationTemplate(createMetadata(), createConfig())
      const cloned = tpl.clone()

      expect(cloned.metadata).toEqual(tpl.metadata)
      expect(cloned.config).toEqual(tpl.config)
      expect(cloned.toJSON()).toBe(tpl.toJSON())
    })
  })
})
