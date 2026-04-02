import type { CommandType } from '../types/command'

export const AVAILABLE_COMMANDS: CommandType[] = [
  'start',
  'restart',
  'shutdown',
  'help',
  'status',
  'clear',
  'cls',
  'containment',
  'scp-list',
  'info',
  'protocol',
  'emergency',
  'logout',
  'version',
  'about',
  'search',
  'network',
  'performance'
]

export const COMMAND_DESCRIPTIONS: Record<CommandType, string> = {
  start: 'Start the system (first-time initialization)',
  restart: 'Restart the system',
  shutdown: 'Shutdown the system',
  help: 'Display available commands',
  status: 'Show system status and containment statistics',
  clear: 'Clear terminal screen',
  cls: 'Clear terminal screen',
  containment: 'Display containment protocol classification',
  'scp-list': 'List known SCP objects',
  info: 'Query detailed information about specific SCP (supports CN branch with CN- prefix)',
  protocol: 'Display security protocols and task forces',
  emergency: 'Display emergency contact information',
  logout: 'Secure logout',
  version: 'Display system version',
  about: 'Display system information',
  search: 'Search SCP database (supports Chinese keywords)',
  network: 'Test network connection to Foundation Wiki',
  performance: 'Open Performance Monitor Dashboard'
}

export const COMMAND_USAGE: Record<CommandType, string> = {
  start: 'start',
  restart: 'restart',
  shutdown: 'shutdown now',
  help: 'help',
  status: 'status',
  clear: 'clear',
  cls: 'cls',
  containment: 'containment',
  'scp-list': 'scp-list',
  info: 'info <number>|info CN-<number>',
  protocol: 'protocol',
  emergency: 'emergency',
  logout: 'logout',
  version: 'version',
  about: 'about',
  search: 'search <keyword>',
  network: 'network',
  performance: 'performance'
}