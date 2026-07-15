import type { LocalAppRuntime } from './local-app.types'

export type PermissionRisk = 'low' | 'medium' | 'high'
export type PermissionStatus = 'available' | 'planned'

export interface PermissionDefinition {
  id: string
  title: string
  description: string
  risk: PermissionRisk
  runtimes: LocalAppRuntime[]
  apis: string[]
  status: PermissionStatus
}

export interface PermissionSummary {
  id: string
  title: string
  description: string
  risk: PermissionRisk
  status: PermissionStatus
}

export const PERMISSIONS: PermissionDefinition[] = [
  {
    id: 'storage',
    title: '本地存储',
    description: '读写当前 App 命名空间内的本地数据。',
    risk: 'low',
    runtimes: ['iframe-app', 'command-module'],
    apis: ['storage:get', 'storage:set', 'storage:remove'],
    status: 'available',
  },
  {
    id: 'notifications',
    title: '通知',
    description: '向用户显示通知或通知占位消息。',
    risk: 'low',
    runtimes: ['iframe-app'],
    apis: ['notify'],
    status: 'available',
  },
  {
    id: 'window.control',
    title: '窗口控制',
    description: '修改当前 App 自己的窗口标题和尺寸。',
    risk: 'low',
    runtimes: ['iframe-app'],
    apis: ['window:setTitle', 'window:resize'],
    status: 'available',
  },
  {
    id: 'ui.cursor',
    title: '鼠标样式',
    description: '临时修改宿主界面的鼠标样式。',
    risk: 'medium',
    runtimes: ['iframe-app'],
    apis: ['ui:setCursor', 'ui:resetCursor'],
    status: 'available',
  },
  {
    id: 'theme.read',
    title: '读取主题',
    description: '读取当前主题摘要和可用主题列表。',
    risk: 'low',
    runtimes: ['iframe-app'],
    apis: ['theme:getCurrent'],
    status: 'available',
  },
  {
    id: 'theme.write',
    title: '修改主题',
    description: '修改全局自定义强调色。',
    risk: 'medium',
    runtimes: ['iframe-app'],
    apis: ['theme:setAccent', 'theme:resetAccent'],
    status: 'available',
  },
  {
    id: 'network',
    title: '网络访问',
    description: '展示或访问远程网络内容。',
    risk: 'medium',
    runtimes: ['iframe-app'],
    apis: [],
    status: 'planned',
  },
  {
    id: 'clipboard.read',
    title: '读取剪贴板',
    description: '读取系统剪贴板内容。',
    risk: 'high',
    runtimes: ['iframe-app'],
    apis: [],
    status: 'planned',
  },
  {
    id: 'clipboard.write',
    title: '写入剪贴板',
    description: '写入系统剪贴板内容。',
    risk: 'medium',
    runtimes: ['iframe-app'],
    apis: [],
    status: 'planned',
  },
  {
    id: 'filesystem.read',
    title: '读取文件',
    description: '读取 SCP-OS 虚拟文件系统内容。',
    risk: 'high',
    runtimes: ['iframe-app', 'command-module'],
    apis: [],
    status: 'planned',
  },
  {
    id: 'filesystem.write',
    title: '写入文件',
    description: '修改 SCP-OS 虚拟文件系统内容。',
    risk: 'high',
    runtimes: ['iframe-app', 'command-module'],
    apis: [],
    status: 'planned',
  },
  {
    id: 'terminal.run',
    title: '执行终端命令',
    description: '通过受控终端能力执行命令。',
    risk: 'high',
    runtimes: ['iframe-app'],
    apis: [],
    status: 'planned',
  },
  {
    id: 'shortcuts.write',
    title: '管理快捷方式',
    description: '创建或移除桌面快捷方式。',
    risk: 'high',
    runtimes: ['iframe-app'],
    apis: [],
    status: 'planned',
  },
]

export const permissionRegistry = {
  all(): PermissionDefinition[] {
    return PERMISSIONS
  },

  get(id: string): PermissionDefinition | null {
    return PERMISSIONS.find((permission) => permission.id === id) ?? null
  },

  has(id: string): boolean {
    return Boolean(this.get(id))
  },

  forApi(api: string): PermissionDefinition | null {
    return PERMISSIONS.find((permission) => permission.apis.includes(api)) ?? null
  },

  summarize(ids: string[]): PermissionSummary[] {
    return ids.map((id) => {
      const permission = this.get(id)
      return permission
        ? {
            id: permission.id,
            title: permission.title,
            description: permission.description,
            risk: permission.risk,
            status: permission.status,
          }
        : {
            id,
            title: id,
            description: '未知权限',
            risk: 'high',
            status: 'planned',
          }
    })
  },

  highestRisk(ids: string[]): PermissionRisk {
    const ranks: Record<PermissionRisk, number> = { low: 1, medium: 2, high: 3 }
    return this.summarize(ids).reduce<PermissionRisk>(
      (highest, permission) =>
        ranks[permission.risk] > ranks[highest] ? permission.risk : highest,
      'low'
    )
  },
}
