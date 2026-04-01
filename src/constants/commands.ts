import type { CommandType } from '../types/command'

export const AVAILABLE_COMMANDS: CommandType[] = [
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
  'search'
]

export const COMMAND_DESCRIPTIONS: Record<CommandType, string> = {
  help: 'Display available commands',
  status: 'Show system status and containment statistics',
  clear: 'Clear terminal screen',
  cls: 'Clear terminal screen',
  containment: 'Display containment protocol classification',
  'scp-list': 'List known SCP objects',
  info: 'Query detailed information about specific SCP',
  protocol: 'Display security protocols and task forces',
  emergency: 'Display emergency contact information',
  logout: 'Secure logout',
  version: 'Display system version',
  about: 'Display system information',
  search: 'Search SCP database'
}

export const COMMAND_USAGE: Record<CommandType, string> = {
  help: 'help',
  status: 'status',
  clear: 'clear',
  cls: 'cls',
  containment: 'containment',
  'scp-list': 'scp-list',
  info: 'info <number>',
  protocol: 'protocol',
  emergency: 'emergency',
  logout: 'logout',
  version: 'version',
  about: 'about',
  search: 'search <keyword>'
}