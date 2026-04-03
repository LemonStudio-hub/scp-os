/**
 * Default Configuration
 * Default values for all configuration keys
 */

import type { ConfigSchema } from './types'

/**
 * Default configuration values
 */
export const defaultConfig = {
  // API Configuration
  'api.worker-url': 'https://api.woodcat.online',
  'api.timeout': 15000,

  // Cache Configuration
  'cache.duration': 30 * 60 * 1000, // 30 minutes
  'cache.max-size': 100,

  // Scraper Configuration
  'scraper.retry-attempts': 3,
  'scraper.retry-delay': 1000,

  // Terminal Configuration
  'terminal.scrollback': 1000,
  'terminal.tab-stop-width': 4,
  'terminal.font-size': 14,
  'terminal.font-family': 'Courier New, monospace',

  // Application Configuration
  'app.version': '3.0.2',
  'app.name': 'SCP Foundation Terminal',
  'app.fast-boot': true,
  'app.debug': false,

  // Theme Configuration
  'theme.name': 'scp-foundation',
  'theme.colors.primary': '#00ff00',
  'theme.colors.secondary': '#ff0000',
  'theme.colors.background': '#000000',
  'theme.colors.foreground': '#00ff00',
  'theme.colors.error': '#ff0000',
  'theme.colors.success': '#00ff00',
  'theme.colors.warning': '#ffff00',
  'theme.colors.info': '#00ffff',

  // Command Configuration
  'command.history-limit': 500,
  'command.enable-autocomplete': true,
  'command.enable-aliases': true,

  // Tab Configuration
  'tab.max-count': 10,
  'tab.auto-save': true,
  'tab.cleanup-days': 7,

  // Plugin Configuration
  'plugin.enable': true,
  'plugin.auto-load': true,
  'plugin.max-size': 1024 * 1024, // 1MB

  // UI Configuration
  'ui.sidebar-width': 300,
  'ui.sidebar-collapsible': true,
  'ui.virtual-keyboard': true,
  'ui.responsive-fonts': true,
} as const

/**
 * Configuration schemas
 */
export const configSchemas: ConfigSchema[] = [
  // API Configuration
  {
    key: 'api.worker-url',
    type: 'string',
    default: defaultConfig['api.worker-url'],
    required: true,
    description: 'Worker API URL'
  },
  {
    key: 'api.timeout',
    type: 'number',
    default: defaultConfig['api.timeout'],
    required: true,
    validate: (value) => typeof value === 'number' && value > 0,
    description: 'API timeout in milliseconds'
  },

  // Cache Configuration
  {
    key: 'cache.duration',
    type: 'number',
    default: defaultConfig['cache.duration'],
    required: true,
    validate: (value) => typeof value === 'number' && value >= 0,
    description: 'Cache duration in milliseconds'
  },
  {
    key: 'cache.max-size',
    type: 'number',
    default: defaultConfig['cache.max-size'],
    required: true,
    validate: (value) => typeof value === 'number' && value > 0,
    description: 'Maximum cache size'
  },

  // Scraper Configuration
  {
    key: 'scraper.retry-attempts',
    type: 'number',
    default: defaultConfig['scraper.retry-attempts'],
    required: true,
    validate: (value) => typeof value === 'number' && value >= 0,
    description: 'Number of retry attempts'
  },
  {
    key: 'scraper.retry-delay',
    type: 'number',
    default: defaultConfig['scraper.retry-delay'],
    required: true,
    validate: (value) => typeof value === 'number' && value >= 0,
    description: 'Retry delay in milliseconds'
  },

  // Terminal Configuration
  {
    key: 'terminal.scrollback',
    type: 'number',
    default: defaultConfig['terminal.scrollback'],
    required: true,
    validate: (value) => typeof value === 'number' && value >= 0,
    description: 'Terminal scrollback buffer size'
  },
  {
    key: 'terminal.tab-stop-width',
    type: 'number',
    default: defaultConfig['terminal.tab-stop-width'],
    required: true,
    validate: (value) => typeof value === 'number' && value > 0,
    description: 'Terminal tab stop width'
  },
  {
    key: 'terminal.font-size',
    type: 'number',
    default: defaultConfig['terminal.font-size'],
    required: true,
    validate: (value) => typeof value === 'number' && value > 0,
    description: 'Terminal font size'
  },

  // Application Configuration
  {
    key: 'app.version',
    type: 'string',
    default: defaultConfig['app.version'],
    required: true,
    description: 'Application version'
  },
  {
    key: 'app.name',
    type: 'string',
    default: defaultConfig['app.name'],
    required: true,
    description: 'Application name'
  },
  {
    key: 'app.fast-boot',
    type: 'boolean',
    default: defaultConfig['app.fast-boot'],
    required: false,
    description: 'Enable fast boot mode'
  },

  // Command Configuration
  {
    key: 'command.history-limit',
    type: 'number',
    default: defaultConfig['command.history-limit'],
    required: true,
    validate: (value) => typeof value === 'number' && value >= 0,
    description: 'Command history limit'
  },

  // Tab Configuration
  {
    key: 'tab.max-count',
    type: 'number',
    default: defaultConfig['tab.max-count'],
    required: true,
    validate: (value) => typeof value === 'number' && value > 0,
    description: 'Maximum number of tabs'
  },

  // Plugin Configuration
  {
    key: 'plugin.enable',
    type: 'boolean',
    default: defaultConfig['plugin.enable'],
    required: false,
    description: 'Enable plugin system'
  },
  {
    key: 'plugin.max-size',
    type: 'number',
    default: defaultConfig['plugin.max-size'],
    required: true,
    validate: (value) => typeof value === 'number' && value > 0,
    description: 'Maximum plugin file size'
  },
]