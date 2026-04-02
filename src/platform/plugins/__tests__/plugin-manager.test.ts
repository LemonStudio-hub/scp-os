/**
 * Unit tests for Plugin System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PluginManager,
  getGlobalPluginManager,
  resetGlobalPluginManager
} from '../plugin-manager'
import {
  ExtensionRegistry,
  getGlobalExtensionRegistry,
  resetGlobalExtensionRegistry
} from '../../extensions/extension-point'
import { EventBus, getGlobalEventBus, resetGlobalEventBus } from '../../events/event-bus'
import type {
  CommandPlugin,
  ThemePlugin,
  DataSourcePlugin,
  UIPlugin,
  CommandDefinition
} from '../types'
import { PluginStatus } from '../types'

describe('PluginManager', () => {
  let pluginManager: PluginManager
  let eventBus: EventBus
  let extensionRegistry: ExtensionRegistry

  beforeEach(() => {
    eventBus = new EventBus()
    extensionRegistry = new ExtensionRegistry()
    pluginManager = new PluginManager({
      eventBus,
      extensionRegistry
    })
    resetGlobalPluginManager()
    resetGlobalExtensionRegistry()
    resetGlobalEventBus()
  })

  describe('Plugin Registration', () => {
    it('should register a valid plugin', async () => {
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      const result = await pluginManager.register(plugin)

      expect(result.success).toBe(true)
      expect(result.plugin).toBe(plugin)
      expect(pluginManager.has('test-command')).toBe(true)
    })

    it('should reject duplicate plugin registration', async () => {
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      await pluginManager.register(plugin)
      const result = await pluginManager.register(plugin)

      expect(result.success).toBe(false)
      expect(result.error).toContain('already registered')
    })

    it('should reject plugin with missing dependencies', async () => {
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        dependencies: ['non-existent'],
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      const result = await pluginManager.register(plugin)

      expect(result.success).toBe(false)
      expect(result.error).toContain('requires non-existent')
    })

    it('should validate plugin structure', async () => {
      const invalidPlugin = {} as CommandPlugin

      const result = await pluginManager.register(invalidPlugin)

      expect(result.success).toBe(false)
      expect(result.error).toContain('validation failed')
    })
  })

  describe('Plugin Lifecycle', () => {
    it('should load plugin and call onLoad hook', async () => {
      const onLoad = vi.fn()
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        onLoad,
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      await pluginManager.register(plugin)

      expect(onLoad).toHaveBeenCalled()
      expect(pluginManager.getStatus('test-command')).toBe(PluginStatus.LOADED)
    })

    it('should enable plugin and call onEnable hook', async () => {
      const onEnable = vi.fn()
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        onEnable,
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      await pluginManager.register(plugin)
      await pluginManager.enable('test-command')

      expect(onEnable).toHaveBeenCalled()
      expect(pluginManager.getStatus('test-command')).toBe(PluginStatus.ENABLED)
    })

    it('should disable plugin and call onDisable hook', async () => {
      const onDisable = vi.fn()
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        onDisable,
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      await pluginManager.register(plugin)
      await pluginManager.enable('test-command')
      await pluginManager.disable('test-command')

      expect(onDisable).toHaveBeenCalled()
      expect(pluginManager.getStatus('test-command')).toBe(PluginStatus.DISABLED)
    })

    it('should unload plugin and call onUnload hook', async () => {
      const onUnload = vi.fn()
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        onUnload,
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      await pluginManager.register(plugin)
      await pluginManager.unregister('test-command')

      expect(onUnload).toHaveBeenCalled()
    })

    it('should handle errors in lifecycle hooks', async () => {
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        onLoad: () => {
          throw new Error('Load error')
        },
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      const result = await pluginManager.register(plugin)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Load error')
      expect(pluginManager.getStatus('test-command')).toBe(PluginStatus.ERROR)
    })
  })

  describe('Extension Registration', () => {
    it('should register command extensions', async () => {
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        commands: [
          {
            name: 'test',
            aliases: ['t'],
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      await pluginManager.register(plugin)
      await pluginManager.enable('test-command')

      const command = extensionRegistry.getCommand('test')
      expect(command).toBeDefined()
      expect(command?.name).toBe('test')

      const commandByAlias = extensionRegistry.getCommand('t')
      expect(commandByAlias).toBeDefined()
      expect(commandByAlias?.name).toBe('test')
    })

    it('should register theme extensions', async () => {
      const plugin: ThemePlugin = {
        name: 'test-theme',
        version: '1.0.0',
        type: 'theme',
        theme: {
          name: 'test-theme',
          colors: {
            primary: '#000000',
            secondary: '#ffffff',
            background: '#000000',
            foreground: '#ffffff',
            error: '#ff0000',
            success: '#00ff00',
            warning: '#ffff00',
            info: '#00ffff'
          },
          terminal: {
            ansiColors: {
              black: '',
              red: '',
              green: '',
              yellow: '',
              blue: '',
              magenta: '',
              cyan: '',
              white: '',
              reset: ''
            },
            fontFamily: 'monospace',
            fontSize: 14
          }
        }
      }

      await pluginManager.register(plugin)

      const theme = extensionRegistry.getTheme('test-theme')
      expect(theme).toBeDefined()
      expect(theme?.name).toBe('test-theme')
    })
  })

  describe('Plugin Query', () => {
    it('should get plugin by name', async () => {
      const plugin: CommandPlugin = {
        name: 'test-command',
        version: '1.0.0',
        type: 'command',
        commands: [
          {
            name: 'test',
            description: 'Test command',
            handler: vi.fn()
          }
        ]
      }

      await pluginManager.register(plugin)

      const retrieved = pluginManager.getPlugin('test-command')
      expect(retrieved).toBe(plugin)
    })

    it('should get all plugins', async () => {
      const plugin1: CommandPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        type: 'command',
        commands: [{ name: 'test1', description: 'Test', handler: vi.fn() }]
      }

      const plugin2: ThemePlugin = {
        name: 'plugin2',
        version: '1.0.0',
        type: 'theme',
        theme: {
          name: 'test',
          colors: {
            primary: '#000',
            secondary: '#fff',
            background: '#000',
            foreground: '#fff',
            error: '#f00',
            success: '#0f0',
            warning: '#ff0',
            info: '#0ff'
          },
          terminal: {
            ansiColors: {
              black: '',
              red: '',
              green: '',
              yellow: '',
              blue: '',
              magenta: '',
              cyan: '',
              white: '',
              reset: ''
            },
            fontFamily: 'monospace',
            fontSize: 14
          }
        }
      }

      await pluginManager.register(plugin1)
      await pluginManager.register(plugin2)

      const allPlugins = pluginManager.getAllPlugins()
      expect(allPlugins).toHaveLength(2)
    })

    it('should get enabled plugins', async () => {
      const plugin1: CommandPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        type: 'command',
        commands: [{ name: 'test1', description: 'Test', handler: vi.fn() }]
      }

      const plugin2: CommandPlugin = {
        name: 'plugin2',
        version: '1.0.0',
        type: 'command',
        commands: [{ name: 'test2', description: 'Test', handler: vi.fn() }]
      }

      await pluginManager.register(plugin1)
      await pluginManager.enable('plugin1')
      await pluginManager.register(plugin2)
      // plugin2 is not enabled

      const enabledPlugins = pluginManager.getEnabledPlugins()
      expect(enabledPlugins).toHaveLength(1)
      expect(enabledPlugins[0].name).toBe('plugin1')
    })

    it('should get plugins by type', async () => {
      const plugin1: CommandPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        type: 'command',
        commands: [{ name: 'test1', description: 'Test', handler: vi.fn() }]
      }

      const plugin2: ThemePlugin = {
        name: 'plugin2',
        version: '1.0.0',
        type: 'theme',
        theme: {
          name: 'test',
          colors: {
            primary: '#000',
            secondary: '#fff',
            background: '#000',
            foreground: '#fff',
            error: '#f00',
            success: '#0f0',
            warning: '#ff0',
            info: '#0ff'
          },
          terminal: {
            ansiColors: {
              black: '',
              red: '',
              green: '',
              yellow: '',
              blue: '',
              magenta: '',
              cyan: '',
              white: '',
              reset: ''
            },
            fontFamily: 'monospace',
            fontSize: 14
          }
        }
      }

      await pluginManager.register(plugin1)
      await pluginManager.register(plugin2)

      const commandPlugins = pluginManager.getPluginsByType<CommandPlugin>('command')
      expect(commandPlugins).toHaveLength(1)
      expect(commandPlugins[0].name).toBe('plugin1')
    })
  })

  describe('Global Plugin Manager', () => {
    it('should return same global instance', () => {
      const instance1 = getGlobalPluginManager()
      const instance2 = getGlobalPluginManager()

      expect(instance1).toBe(instance2)
    })

    it('should reset global instance', () => {
      const instance1 = getGlobalPluginManager()
      resetGlobalPluginManager()
      const instance2 = getGlobalPluginManager()

      expect(instance1).not.toBe(instance2)
    })
  })
})