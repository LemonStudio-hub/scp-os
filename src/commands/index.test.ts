import { describe, it, expect, beforeEach, vi } from 'vitest'
import { commandHandlers, getCommandHandler } from './index'
import type { CommandType } from '../types/command'
import * as scraperModule from '../utils/scraper'

// Mock scraper module
vi.mock('../utils/scraper', () => ({
  default: {
    scrapeSCP: vi.fn(),
    formatForTerminal: vi.fn(),
  },
}))

describe('commands/index', () => {
  let writeMock: any
  let writelnMock: any

  beforeEach(() => {
    writeMock = vi.fn()
    writelnMock = vi.fn()
    
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('getCommandHandler', () => {
    it('应该返回有效的命令处理器', () => {
      const handler = getCommandHandler('help')
      expect(handler).toBeDefined()
      expect(typeof handler).toBe('function')
    })

    it('应该为所有已知命令返回处理器', () => {
      const commands: CommandType[] = [
        'help', 'status', 'clear', 'cls', 'containment',
        'scp-list', 'info', 'protocol', 'emergency',
        'version', 'about', 'search', 'logout'
      ]

      commands.forEach(cmd => {
        const handler = getCommandHandler(cmd)
        expect(handler).toBeDefined()
      })
    })

    it('应该为未知命令返回 null', () => {
      const handler = getCommandHandler('unknown' as CommandType)
      expect(handler).toBeNull()
    })
  })

  describe('help 命令', () => {
    it('应该显示所有可用命令', () => {
      const handler = commandHandlers.help
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('可用命令列表')
      expect(output).toContain('help')
      expect(output).toContain('status')
    })

    it('应该显示手势控制信息', () => {
      const handler = commandHandlers.help
      handler([], writeMock, writelnMock)
      
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('手势控制')
      expect(output).toContain('三指上滑')
      expect(output).toContain('双指左滑')
    })
  })

  describe('status 命令', () => {
    it('应该显示系统状态信息', () => {
      const handler = commandHandlers.status
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('系统状态报告')
      expect(output).toContain('运行正常')
      expect(output).toContain('活跃收容')
    })

    it('应该显示区域状态', () => {
      const handler = commandHandlers.status
      handler([], writeMock, writelnMock)
      
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Site-19')
      expect(output).toContain('Site-17')
    })
  })

  describe('clear 命令', () => {
    it('应该发送清屏指令', () => {
      const handler = commandHandlers.clear
      handler([], writeMock, writelnMock)
      
      expect(writeMock).toHaveBeenCalledWith('\x1b[2J\x1b[H')
    })
  })

  describe('cls 命令', () => {
    it('应该发送清屏指令', () => {
      const handler = commandHandlers.cls
      handler([], writeMock, writelnMock)
      
      expect(writeMock).toHaveBeenCalledWith('\x1b[2J\x1b[H')
    })
  })

  describe('containment 命令', () => {
    it('应该显示收容协议信息', () => {
      const handler = commandHandlers.containment
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('收容协议数据库')
      expect(output).toContain('安全级')
      expect(output).toContain('欧几里得级')
      expect(output).toContain('刻耳柏洛斯级')
    })
  })

  describe('scp-list 命令', () => {
    it('应该显示 SCP 列表', () => {
      const handler = commandHandlers['scp-list']
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('已知 SCP 对象')
      expect(output).toContain('SCP-173')
    })

    it('应该显示提示信息', () => {
      const handler = commandHandlers['scp-list']
      handler([], writeMock, writelnMock)
      
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('info [编号]')
      expect(output).toContain('search [关键词]')
    })
  })

  describe('info 命令', () => {
    it('应该显示指定 SCP 的信息', () => {
      const handler = commandHandlers.info
      handler(['173'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('SCP-173')
    })

    it('应该在未提供参数时显示提示', () => {
      const handler = commandHandlers.info
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalledWith(
        expect.stringContaining('请指定 SCP 编号')
      )
    })

    it('应该在 SCP 不存在时显示错误', async () => {
      // Mock scraper to return failure
      const scraper = (await import('../utils/scraper')).default
      vi.mocked(scraper.scrapeSCP).mockResolvedValue({
        success: false,
        error: 'SCP 对象不存在或无法访问',
      })
      
      const handler = commandHandlers.info
      await handler(['9999'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      // 测试应该显示查询失败的信息
      expect(output).toContain('查询失败')
      expect(output).toContain('9999')
    })
  })

  describe('protocol 命令', () => {
    it('应该显示安全协议信息', () => {
      const handler = commandHandlers.protocol
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('安全协议数据库')
      expect(output).toContain('Omega-7')
      expect(output).toContain('Alpha-1')
    })
  })

  describe('emergency 命令', () => {
    it('应该显示紧急联系人信息', () => {
      const handler = commandHandlers.emergency
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('紧急联系人信息')
      expect(output).toContain('收容失效')
      expect(output).toContain('911')
    })
  })

  describe('version 命令', () => {
    it('应该显示版本信息', () => {
      const handler = commandHandlers.version
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('系统版本信息')
      expect(output).toContain('3.0.2')
      expect(output).toContain('安全级别')
    })
  })

  describe('about 命令', () => {
    it('应该显示关于信息', () => {
      const handler = commandHandlers.about
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('关于系统')
      expect(output).toContain('Secure. Contain. Protect.')
    })

    it('应该包含警告信息', () => {
      const handler = commandHandlers.about
      handler([], writeMock, writelnMock)
      
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('仅供授权人员使用')
    })
  })

  describe('search 命令', () => {
    it('应该搜索并显示结果', () => {
      const handler = commandHandlers.search
      handler(['173'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('找到')
      expect(output).toContain('SCP-173')
    })

    it('应该在未提供参数时显示提示', () => {
      const handler = commandHandlers.search
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalledWith(
        expect.stringContaining('请输入搜索关键词')
      )
    })

    it('应该在无结果时显示提示', () => {
      const handler = commandHandlers.search
      handler(['不存在的关键词'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalledWith(
        expect.stringContaining('未找到匹配的结果')
      )
    })

    it('应该支持多关键词搜索', () => {
      const handler = commandHandlers.search
      handler(['SCP', '173'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
    })

    it('应该不区分大小写', () => {
      const handler = commandHandlers.search
      handler(['scp'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('找到')
    })
  })

  describe('logout 命令', () => {
    it('应该显示注销信息', () => {
      const handler = commandHandlers.logout
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('安全注销')
      expect(output).toContain('会话已终止')
      expect(output).toContain('Secure. Contain. Protect.')
    })
  })

  })

export { commandHandlers }