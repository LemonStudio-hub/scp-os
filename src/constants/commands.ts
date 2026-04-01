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
  help: '显示命令帮助信息',
  status: '显示站点状态和收容统计',
  clear: '清空终端屏幕',
  cls: '清空终端屏幕',
  containment: '显示收容协议分类信息',
  'scp-list': '列出已收录的 SCP 对象',
  info: '查询指定 SCP 对象的详细信息',
  protocol: '显示安全协议和任务部队信息',
  emergency: '显示紧急联系方式',
  logout: '安全注销终端',
  version: '显示系统版本',
  about: '显示系统信息',
  search: '搜索 SCP 数据库'
}

export const COMMAND_USAGE: Record<CommandType, string> = {
  help: 'help',
  status: 'status',
  clear: 'clear',
  cls: 'cls',
  containment: 'containment',
  'scp-list': 'scp-list',
  info: 'info <编号>',
  protocol: 'protocol',
  emergency: 'emergency',
  logout: 'logout',
  version: 'version',
  about: 'about',
  search: 'search <关键词>'
}