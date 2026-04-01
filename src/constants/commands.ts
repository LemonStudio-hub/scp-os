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
  'search',
  'scrape'
]

export const COMMAND_DESCRIPTIONS: Record<CommandType, string> = {
  help: '显示此帮助信息',
  status: '显示系统状态和收容信息',
  clear: '清空终端屏幕',
  cls: '清空终端屏幕',
  containment: '显示收容协议详情',
  'scp-list': '列出已知 SCP 对象',
  info: '显示指定 SCP 对象的信息',
  protocol: '显示安全协议详情',
  emergency: '显示紧急联系人信息',
  logout: '安全注销',
  version: '显示系统版本信息',
  about: '关于本系统',
  search: '搜索 SCP 数据库',
  scrape: '从 SCP 基金会百科爬取 SCP 信息'
}

export const COMMAND_USAGE: Record<CommandType, string> = {
  help: 'help',
  status: 'status',
  clear: 'clear',
  cls: 'cls',
  containment: 'containment',
  'scp-list': 'scp-list',
  info: 'info [编号]',
  protocol: 'protocol',
  emergency: 'emergency',
  logout: 'logout',
  version: 'version',
  about: 'about',
  search: 'search [关键词]',
  scrape: 'scrape <编号> | scrape search <关键词>'
}