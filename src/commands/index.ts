import type { CommandType, CommandHandler, CommandMap } from '../types/command'
import { COMMAND_DESCRIPTIONS, COMMAND_USAGE } from '../constants/commands'
import { ANSICode } from '../constants/theme'
import { SCP_DATABASE, SCP_LIST } from '../constants/scpDatabase'
import { scraper } from '../utils/scraper'

export const commandHandlers: CommandMap = {
  help: (_args, _write, writeln) => {
    const helpText = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                        可用命令列表${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      ...Object.entries(COMMAND_DESCRIPTIONS).map(([cmd, desc]) => 
        `  ${COMMAND_USAGE[cmd as CommandType]} - ${desc}`
      ),
      '',
      `${ANSICode.cyan}手势控制:${ANSICode.reset}`,
      `  三指上滑      - 清屏`,
      `  双指左滑      - 历史记录上一条`,
      `  双指右滑      - 历史记录下一条`,
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    helpText.forEach(line => writeln(line))
  },

  status: (_args, _write, writeln) => {
    const statusInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                        系统状态报告${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      `  系统状态:        ${ANSICode.green}⚡ 运行正常${ANSICode.reset}`,
      '  活跃收容:        4,891 个对象',
      '  收容失效:        23 起事件',
      '  待处理:          156 个异常',
      '  威胁等级:        中等',
      '',
      '  区域状态:',
      '    Site-19        ✓ 正常运行',
      '    Site-17        ✓ 正常运行',
      '    Area-12        ⚠ 收容协议升级中',
      '    Site-13        🚫 封闭中',
      '',
      '  网络连接:        加密连接 [AES-256]',
      '  数据库状态:      同步完成',
      '  最后更新:        2026-03-31 14:32:15 UTC',
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    statusInfo.forEach(line => writeln(line))
  },

  clear: (_args, write, _writeln) => {
    write('\x1b[2J\x1b[H')
  },

  cls: (_args, write, _writeln) => {
    write('\x1b[2J\x1b[H')
  },

  containment: (_args, _write, writeln) => {
    const containmentInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                      收容协议数据库${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      '  协议等级分类:',
      '',
      `${ANSICode.green}  [Safe] 安全级:${ANSICode.reset}`,
      '    - 标准收容程序足够',
      '    - 无需特殊资源',
      '    - 定期检查即可',
      '',
      `${ANSICode.yellow}  [Euclid] 欧几里得级:${ANSICode.reset}`,
      '    - 需要持续监控',
      '    - 收容措施复杂',
      '    - 可能需要特殊资源',
      '',
      `${ANSICode.red}  [Keter] 刻耳柏洛斯级:${ANSICode.reset}`,
      '    - 极难收容',
      '    - 高度危险',
      '    - 需要大量资源',
      '    - 24小时监控',
      '',
      `${ANSICode.magenta}  [Thaumiel] 塔耳塔洛斯级:${ANSICode.reset}`,
      '    - 用于收容其他 SCP',
      '    - 基金会秘密武器',
      '    - 极高保密级别',
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    containmentInfo.forEach(line => writeln(line))
  },

  'scp-list': (_args, _write, writeln) => {
    const scpList = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                        已知 SCP 对象${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      '  热门收录对象 (显示前10个):',
      '',
      ...SCP_LIST.map(scp => `  ${scp}`),
      '',
      `${ANSICode.cyan}  提示: 使用 "info [编号]" 查看详细信息${ANSICode.reset}`,
      `${ANSICode.cyan}  使用 "search [关键词]" 搜索特定对象${ANSICode.reset}`,
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    scpList.forEach(line => writeln(line))
  },

  info: async (args, _write, writeln) => {
    const scpNumber = args[0]
    if (!scpNumber) {
      writeln(`${ANSICode.yellow}请指定 SCP 编号，例如: info 173${ANSICode.reset}`)
      return
    }

    writeln(`${ANSICode.cyan}正在查询 SCP-${scpNumber}...${ANSICode.reset}`)
    writeln('')

    try {
      // 先尝试从本地数据库查找
      const localInfo = SCP_DATABASE[scpNumber]
      
      if (localInfo) {
        writeln(`${ANSICode.yellow}[本地数据库]${ANSICode.reset}`)
        writeln('')
        localInfo.description.forEach(line => writeln(line))
        return
      }

      // 本地没有，从基金会百科爬取
      writeln(`${ANSICode.cyan}正在连接基金会百科...${ANSICode.reset}`)
      writeln('')
      
      const result = await scraper.scrapeSCP(scpNumber)
      
      if (result.success && result.data) {
        if (result.cached) {
          writeln(`${ANSICode.yellow}[来自缓存]${ANSICode.reset}`)
          writeln('')
        }
        
        const formattedLines = scraper.formatForTerminal(result.data)
        formattedLines.forEach(line => writeln(line))
      } else {
        writeln(`${ANSICode.red}查询失败: ${result.error}${ANSICode.reset}`)
        writeln(`${ANSICode.yellow}提示: 确保SCP编号正确，例如: 173, 096, 682${ANSICode.reset}`)
        writeln(`${ANSICode.yellow}本地数据库未收录此SCP，且网络查询失败${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}查询失败: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  protocol: (_args, _write, writeln) => {
    const protocols = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                      安全协议数据库${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      '  主要安全协议:',
      '',
      `${ANSICode.magenta}  [Omega-7] 任务部队协议:${ANSICode.reset}`,
      '    - 用于处理极度危险的 SCP 对象',
      '    - 成员由收容异常个体组成',
      '    - 只在紧急情况下激活',
      '',
      `${ANSICode.red}  [Alpha-1] 红右手协议:${ANSICode.reset}`,
      '    - 基金会最高级别安保协议',
      '    - 用于保护 O5 议会',
      '    - 成员忠诚度无可置疑',
      '',
      `${ANSICode.yellow}  [Nu-7] 落锤协议:${ANSICode.reset}`,
      '    - 军事化应对协议',
      '    - 用于处理收容失效事件',
      '    - 配备重型武器和装备',
      '',
      `${ANSICode.cyan}  [Zeta-9] 鼹鼠协议:${ANSICode.reset}`,
      '    - 地下探索协议',
      '    - 用于探索异常空间',
      '    - 配备专业勘探设备',
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    protocols.forEach(line => writeln(line))
  },

  emergency: (_args, _write, writeln) => {
    const emergencyInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                      紧急联系人信息${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      `${ANSICode.red}  🚨 收容失效紧急热线:${ANSICode.reset}`,
      '    - 内线: 911',
      '    - 外线: +1-SCP-EMERGENCY',
      '',
      '  📞 各部门联系电话:',
      '    - 研究部:      ext. 1001',
      '    - 收容部:      ext. 1002',
      '    - 安全部:      ext. 1003',
      '    - 医疗部:      ext. 1004',
      '    - 任务部队:    ext. 1005',
      '',
      '  🏥 站点医疗中心:',
      '    - 急救:        ext. 2001',
      '    - 心理咨询:    ext. 2002',
      '    - 记忆消除:    ext. 2003',
      '',
      `${ANSICode.yellow}  ⚠ 注意: 所有紧急联系都需要经过身份验证${ANSICode.reset}`,
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    emergencyInfo.forEach(line => writeln(line))
  },

  version: (_args, _write, writeln) => {
    const versionInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                        系统版本信息${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      '  SCP 基金会终端系统',
      '  版本: 3.0.2',
      '  安全级别: 4级',
      '  最后更新: 2026-04-01',
      '',
      `${ANSICode.red}  仅限授权人员访问${ANSICode.reset}`,
      `${ANSICode.red}  违规访问将受到严厉处罚${ANSICode.reset}`,
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    versionInfo.forEach(line => writeln(line))
  },

  about: (_args, _write, writeln) => {
    const aboutInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                          关于系统${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      '  SCP 基金会终端系统',
      '  安全级别: 4级',
      '  访问权限: 授权人员',
      '',
      '  系统功能:',
      '    - SCP 数据库查询',
      '    - 收容协议查看',
      '    - 站点状态监控',
      '    - 紧急情况响应',
      '    - 安全通信通道',
      '',
      '  安全特性:',
      '    - AES-256 加密通信',
      '    - 访问日志记录',
      '    - 操作审计追踪',
      '    - 多因素身份验证',
      '',
      `${ANSICode.red}  警告: 本系统仅供授权人员使用${ANSICode.reset}`,
      `${ANSICode.red}  未经授权的访问将立即触发安全警报${ANSICode.reset}`,
      '',
      `${ANSICode.green}  Secure. Contain. Protect.${ANSICode.reset}`,
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    aboutInfo.forEach(line => writeln(line))
  },

  search: (args, _write, writeln) => {
    try {
      const keyword = args.join(' ')
      if (!keyword) {
        writeln(`${ANSICode.yellow}请输入搜索关键词，例如: search 雕像${ANSICode.reset}`)
        return
      }

      const results = SCP_LIST.filter(item =>
        item.toLowerCase().includes(keyword.toLowerCase())
      )

      if (results.length > 0) {
        writeln(`${ANSICode.green}找到 ${results.length} 个结果:${ANSICode.reset}`)
        results.forEach(result => writeln(`  - ${result}`))
      } else {
        writeln(`${ANSICode.red}未找到匹配的结果${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}搜索失败: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  logout: (_args, _write, writeln) => {
    writeln(`${ANSICode.yellow}正在安全注销...${ANSICode.reset}`)
    writeln(`${ANSICode.green}会话已终止。${ANSICode.reset}`)
    writeln('感谢您使用 SCP 基金会终端系统。')
    writeln('')
    writeln(`${ANSICode.green}Secure. Contain. Protect.${ANSICode.reset}`)
    writeln('')
  }
}

export function getCommandHandler(command: CommandType): CommandHandler | null {
  return commandHandlers[command] || null
}