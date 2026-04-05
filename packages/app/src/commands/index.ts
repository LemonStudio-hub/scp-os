import type { CommandType, CommandHandler, CommandMap } from '../types/command'
import { COMMAND_DESCRIPTIONS, COMMAND_USAGE } from '../constants/commands'
import { ANSICode } from '../constants/theme'
import { scraper } from '../utils/scraper'
import { filesystem } from '../utils/filesystem'
import { useTabsStore } from '../stores/tabs'
import { useSystemStore } from '../stores/system'
import { createBorderLine, createBorderedTitle, isNarrowTerminal } from '../utils/terminalResponsive'
import { generateInfoQueryLogs } from '../utils/infoQueryLogs'

// 响应式边框辅助函数
function border(color: string = ANSICode.red, char: string = '═'): string {
  return `${color}${createBorderLine(char)}${ANSICode.reset}`
}

function borderedTitle(text: string, color: string = ANSICode.green): string {
  return `${color}${createBorderedTitle(` ${text} `, '═')}${ANSICode.reset}`
}

export const commandHandlers: CommandMap = {
  start: async (_args, _write, writeln) => {
    // Clear screen first
    if (window.__terminalController) {
      window.__terminalController.clear()
    }
    
    // Mark system as running
    const systemStore = useSystemStore()
    systemStore.markSystemRunning()
    
    // Use global terminal controller to display boot log and welcome message
    if (window.__terminalController) {
      await window.__terminalController.displayBootLog()
      window.__terminalController.markBootLogShown()
      window.__terminalController.displayWelcomeMessage()
    } else {
      writeln(`${ANSICode.red}Error: Terminal controller not available.${ANSICode.reset}`)
      writeln('')
    }
  },

  restart: async (_args, _write, writeln) => {
    // Reset boot log shown flag so boot log shows again after restart
    const systemStore = useSystemStore()
    systemStore.resetBootLogShown()
    systemStore.markSystemRunning()
    
    // Use global terminal controller to clear terminal and display boot log
    if (window.__terminalController) {
      window.__terminalController.clear()
      await window.__terminalController.displayBootLog()
      window.__terminalController.markBootLogShown()
      window.__terminalController.displayWelcomeMessage()
    } else {
      writeln(`${ANSICode.red}Error: Terminal controller not available.${ANSICode.reset}`)
      writeln('')
    }
  },

  shutdown: async (args, _write, writeln) => {
    const confirmation = args[0]?.toLowerCase()
    
    if (confirmation === 'now') {
      writeln(`${ANSICode.yellow}Shutting down system...${ANSICode.reset}`)
      writeln('')
      
      // Get stores
      const tabsStore = useTabsStore()
      const systemStore = useSystemStore()
      
      // Clear all tabs
      tabsStore.clearAllTabs()
      
      // Mark system as shutdown
      systemStore.markSystemShutdown()
      systemStore.resetBootLogShown()
      
      // Use global terminal controller to display shutdown log and startup prompt
      if (window.__terminalController) {
        await window.__terminalController.displayShutdownLog()
        window.__terminalController.displayStartupPrompt()
      } else {
        writeln(`${ANSICode.red}Error: Terminal controller not available.${ANSICode.reset}`)
        writeln('')
      }
    } else {
      writeln(`${ANSICode.yellow}Usage: shutdown now${ANSICode.reset}`)
      writeln('')
      writeln(`${ANSICode.gray}This will shutdown the system and clear all tabs.${ANSICode.reset}`)
    }
  },

  help: (_args, _write, writeln) => {
    const b = border()
    const t = borderedTitle('Available Commands')
    const isNarrow = isNarrowTerminal()
    
    const helpText = [
      b,
      t,
      b,
      '',
      ...Object.entries(COMMAND_DESCRIPTIONS).map(([cmd, desc]) => {
        const usage = COMMAND_USAGE[cmd as CommandType]
        if (isNarrow) {
          // 移动端：简化格式
          return `  ${usage}\n    ${desc}`
        }
        return `  ${usage} - ${desc}`
      }),
      '',
      b
    ]
    helpText.forEach(line => writeln(line))
  },

  status: (_args, _write, writeln) => {
    const b = border()
    const t = borderedTitle('System Status Report')
    
    const statusInfo = [
      b,
      t,
      b,
      '',
      `  System Status:        ${ANSICode.green}⚡ Online${ANSICode.reset}`,
      '  Active Containment:   4,891 objects',
      '  Containment Breaches: 23 incidents',
      '  Pending:              156 anomalies',
      '  Threat Level:         Medium',
      '',
      '  Site Status:',
      '    Site-19        ✓ Operational',
      '    Site-17        ✓ Operational',
      '    Area-12        ⚠ Containment upgrade in progress',
      '    Site-13        🚫 Locked down',
      '',
      '  Network Connection:   Encrypted [AES-256]',
      '  Database Status:      Synchronized',
      '  Last Update:          2026-03-31 14:32:15 UTC',
      '',
      b
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
    const b = border()
    const t = borderedTitle('Containment Protocols')
    
    const containmentInfo = [
      b,
      t,
      b,
      '',
      '  Containment Classifications:',
      '',
      `${ANSICode.green}  [Safe] Safe Class:${ANSICode.reset}`,
      '    - Standard containment procedures sufficient',
      '    - No special resources required',
      '    - Regular monitoring needed',
      '',
      `${ANSICode.yellow}  [Euclid] Euclid Class:${ANSICode.reset}`,
      '    - Requires constant monitoring',
      '    - Complex containment procedures',
      '    - May require special resources',
      '',
      `${ANSICode.red}  [Keter] Keter Class:${ANSICode.reset}`,
      '    - Extremely difficult to contain',
      '    - Highly dangerous',
      '    - Requires massive resources',
      '    - 24-hour monitoring mandatory',
      '',
      `${ANSICode.magenta}  [Thaumiel] Thaumiel Class:${ANSICode.reset}`,
      '    - Used to contain other SCPs',
      '    - Foundation secret weapons',
      '    - Extremely high classification',
      '',
      b
    ]
    containmentInfo.forEach(line => writeln(line))
  },

  'scp-list': (_args, _write, writeln) => {
    const b = border()
    const t = borderedTitle('Known SCP Objects')
    
    const scpList = [
      b,
      t,
      b,
      '',
      '  English Branch:',
      '',
      '  SCP-173 - The Sculpture (Statue)',
      '  SCP-096 - The Shy Guy (Humanoid)',
      '  SCP-682 - The Hard-to-Destroy Reptile (Reptile)',
      '  SCP-999 - The Tickle Monster (Orange Creature)',
      '  SCP-049 - The Plague Doctor (Humanoid)',
      '',
      '  Chinese Branch (CN):',
      '',
      '  CN-001 - 深红之王',
      '  CN-002 - 龙之神',
      '  CN-003 - 天蛾人',
      '  CN-009 - 不灭孽蜥',
      '  CN-173 - 雕像',
      '',
      `${ANSICode.cyan}  Tip: Use "info <number>" for English branch${ANSICode.reset}`,
      `${ANSICode.cyan}  Use "info CN-<number>" for Chinese branch${ANSICode.reset}`,
      `${ANSICode.cyan}  Use "search <keyword>" to search for specific objects${ANSICode.reset}`,
      '',
      b
    ]
    scpList.forEach(line => writeln(line))
  },

  info: async (args, _write, writeln) => {
    const input = args[0]
    if (!input) {
      writeln(`${ANSICode.yellow}Please specify SCP number, e.g.: info 173, info CN-001${ANSICode.reset}`)
      return
    }

    // 解析分部和编号
    let forcedBranch: string | null = null // 用户是否强制指定了分部
    let scpNumber = input

    // 检查是否是中文分部 (CN-xxx 格式)
    if (input.toUpperCase().startsWith('CN-')) {
      forcedBranch = 'cn'
      scpNumber = input.slice(3) // 移除 CN- 前缀
    } else if (input.toUpperCase().startsWith('EN-')) {
      forcedBranch = 'en'
      scpNumber = input.slice(3) // 移除 EN- 前缀
    }

    try {
      if (forcedBranch) {
        // 用户强制指定了分部，直接查询
        writeln(`${ANSICode.cyan}Connecting to ${forcedBranch.toUpperCase()} Branch Wiki...${ANSICode.reset}`)
        writeln('')

        // 显示查询日志（带动画效果）
        const queryLogs = generateInfoQueryLogs(scpNumber, forcedBranch)
        for (const line of queryLogs) {
          writeln(line)
          // 动态延迟，模拟真实查询过程
          let delay = 20
          if (line.includes('[NET]') || line.includes('[AUTH]')) delay = 40
          if (line.includes('[FETCH]') || line.includes('[HTTP]')) delay = 60
          if (line.includes('[PARSE]') || line.includes('[CLEAN]')) delay = 30
          if (line.includes('[DONE]')) delay = 100
          if (line.trim() === '') delay = 10
          await new Promise(r => setTimeout(r, delay + Math.random() * 20))
        }

        const result = await scraper.scrapeSCP(scpNumber, forcedBranch)

        if (result.success && result.data) {
          if (result.cached) {
            writeln(`${ANSICode.yellow}[From Cache]${ANSICode.reset}`)
            writeln('')
          }

          const formattedLines = scraper.formatForTerminal(result.data)
          formattedLines.forEach(line => writeln(line))
        } else {
          writeln(`${ANSICode.red}Query failed: ${result.error}${ANSICode.reset}`)
          writeln('')
          writeln(`${ANSICode.yellow}Tips:${ANSICode.reset}`)
          writeln(`  - Ensure the SCP number is correct, e.g.: 173, 096, 682`)
          writeln(`  - For Chinese branch SCPs, use CN- prefix, e.g.: CN-001`)
          writeln(`  - For English branch SCPs, use EN- prefix, e.g.: EN-173`)
          writeln(`  - Check your internet connection`)
          writeln(`  - Try again later (server might be busy)`)
          writeln('')
          writeln(`${ANSICode.red}Network query failed${ANSICode.reset}`)
        }
      } else {
        // 未指定分部，优先查询中文分部，找不到再查英文主站点
        writeln(`${ANSICode.cyan}Connecting to Chinese Branch Wiki...${ANSICode.reset}`)
        writeln('')

        // 显示查询日志（带动画效果）
        const queryLogs = generateInfoQueryLogs(scpNumber, 'cn')
        for (const line of queryLogs) {
          writeln(line)
          let delay = 20
          if (line.includes('[NET]') || line.includes('[AUTH]')) delay = 40
          if (line.includes('[FETCH]') || line.includes('[HTTP]')) delay = 60
          if (line.includes('[PARSE]') || line.includes('[CLEAN]')) delay = 30
          if (line.includes('[DONE]')) delay = 100
          if (line.trim() === '') delay = 10
          await new Promise(r => setTimeout(r, delay + Math.random() * 20))
        }

        const cnResult = await scraper.scrapeSCP(scpNumber, 'cn')

        if (cnResult.success && cnResult.data) {
          if (cnResult.cached) {
            writeln(`${ANSICode.yellow}[From Cache - Chinese Branch]${ANSICode.reset}`)
            writeln('')
          } else {
            writeln(`${ANSICode.green}[Source: Chinese Branch Wiki]${ANSICode.reset}`)
            writeln('')
          }

          const formattedLines = scraper.formatForTerminal(cnResult.data)
          formattedLines.forEach(line => writeln(line))
        } else {
          // 中文分部找不到，尝试英文主站点
          writeln(`${ANSICode.yellow}Not found on Chinese Branch, trying English Main Site...${ANSICode.reset}`)
          writeln('')

          // 显示查询日志（带动画效果）
          const enQueryLogs = generateInfoQueryLogs(scpNumber, 'en')
          for (const line of enQueryLogs) {
            writeln(line)
            let delay = 20
            if (line.includes('[NET]') || line.includes('[AUTH]')) delay = 40
            if (line.includes('[FETCH]') || line.includes('[HTTP]')) delay = 60
            if (line.includes('[PARSE]') || line.includes('[CLEAN]')) delay = 30
            if (line.includes('[DONE]')) delay = 100
            if (line.trim() === '') delay = 10
            await new Promise(r => setTimeout(r, delay + Math.random() * 20))
          }

          const enResult = await scraper.scrapeSCP(scpNumber, 'en')

          if (enResult.success && enResult.data) {
            if (enResult.cached) {
              writeln(`${ANSICode.yellow}[From Cache - English Main Site]${ANSICode.reset}`)
              writeln('')
            } else {
              writeln(`${ANSICode.green}[Source: English Main Site]${ANSICode.reset}`)
              writeln('')
            }

            const formattedLines = scraper.formatForTerminal(enResult.data)
            formattedLines.forEach(line => writeln(line))
          } else {
            writeln(`${ANSICode.red}Query failed: SCP-${scpNumber} not found on both Chinese and English Wikis${ANSICode.reset}`)
            writeln('')
            writeln(`${ANSICode.yellow}Tips:${ANSICode.reset}`)
            writeln(`  - Ensure the SCP number is correct, e.g.: 173, 096, 682`)
            writeln(`  - For Chinese branch SCPs, use CN- prefix, e.g.: CN-001`)
            writeln(`  - For English branch SCPs, use EN- prefix, e.g.: EN-173`)
            writeln(`  - Check your internet connection`)
            writeln(`  - Try again later (server might be busy)`)
            writeln('')
            writeln(`${ANSICode.red}Network query failed${ANSICode.reset}`)
          }
        }
      }
    } catch (error) {
      writeln(`${ANSICode.red}Query failed: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  protocol: (_args, _write, writeln) => {
    const protocols = [
      border(),
      borderedTitle("Security Protocols"),
      border(),
      '',
      '  Major Security Protocols:',
      '',
      `${ANSICode.magenta}  [Omega-7] Task Force Protocol:${ANSICode.reset}`,
      '    - Handles extremely dangerous SCP objects',
      '    - Members are contained anomalous individuals',
      '    - Activated only in emergencies',
      '',
      `${ANSICode.red}  [Alpha-1] Red Right Hand Protocol:${ANSICode.reset}`,
      '    - Foundation highest security protocol',
      '    - Protects the O5 Council',
      '    - Members unquestionably loyal',
      '',
      `${ANSICode.yellow}  [Nu-7] Hammer Down Protocol:${ANSICode.reset}`,
      '    - Military response protocol',
      '    - Handles containment breach events',
      '    - Equipped with heavy weapons',
      '',
      `${ANSICode.cyan}  [Zeta-9] Mole Rats Protocol:${ANSICode.reset}`,
      '    - Underground exploration protocol',
      '    - Explores anomalous spaces',
      '    - Equipped with specialized equipment',
      '',
      border()
    ]
    protocols.forEach(line => writeln(line))
  },

  emergency: (_args, _write, writeln) => {
    const emergencyInfo = [
      border(),
      borderedTitle("Emergency Contact"),
      border(),
      '',
      `${ANSICode.red}  🚨 Containment Breach Hotline:${ANSICode.reset}`,
      '    - Internal: 911',
      '    - External: +1-SCP-EMERGENCY',
      '',
      '  📞 Department Contacts:',
      '    - Research Dept:    ext. 1001',
      '    - Containment Dept: ext. 1002',
      '    - Security Dept:    ext. 1003',
      '    - Medical Dept:     ext. 1004',
      '    - Task Forces:      ext. 1005',
      '',
      '  🏥 Site Medical Center:',
      '    - Emergency:        ext. 2001',
      '    - Counseling:       ext. 2002',
      '    - Amnestic:         ext. 2003',
      '',
      `${ANSICode.yellow}  ⚠ Note: All emergency contacts require authentication${ANSICode.reset}`,
      '',
      border()
    ]
    emergencyInfo.forEach(line => writeln(line))
  },

  version: (_args, _write, writeln) => {
    const versionInfo = [
      border(),
      borderedTitle("System Version"),
      border(),
      '',
      '  SCP Foundation Terminal System',
      '  Version: 3.0.2',
      '  Security Level: 4',
      '  Last Updated: 2026-04-01',
      '',
      `${ANSICode.red}  Authorized Personnel Only${ANSICode.reset}`,
      `${ANSICode.red}  Unauthorized access will result in severe penalties${ANSICode.reset}`,
      '',
      border()
    ]
    versionInfo.forEach(line => writeln(line))
  },

  about: (_args, _write, writeln) => {
    const aboutInfo = [
      border(),
      borderedTitle("About SCP-OS"),
      border(),
      '',
      '  SCP Foundation Terminal System',
      '  Security Level: 4',
      '  Access: Authorized Personnel',
      '',
      '  System Features:',
      '    - SCP Database Query',
      '    - Containment Protocol Viewing',
      '    - Site Status Monitoring',
      '    - Emergency Response',
      '    - Secure Communication Channel',
      '',
      '  Security Features:',
      '    - AES-256 Encrypted Communication',
      '    - Access Log Recording',
      '    - Operation Audit Tracking',
      '    - Multi-Factor Authentication',
      '',
      `${ANSICode.red}  Warning: This system is for authorized personnel only${ANSICode.reset}`,
      `${ANSICode.red}  Unauthorized access will immediately trigger security alerts${ANSICode.reset}`,
      '',
      `${ANSICode.green}  Secure. Contain. Protect.${ANSICode.reset}`,
      '',
      border()
    ]
    aboutInfo.forEach(line => writeln(line))
  },

  search: async (args, _write, writeln) => {
    try {
      const keyword = args.join(' ')
      if (!keyword) {
        writeln(`${ANSICode.yellow}Please enter search keyword, e.g.: search statue${ANSICode.reset}`)
        return
      }

      writeln(`${ANSICode.cyan}Searching for "${keyword}"...${ANSICode.reset}`)
      writeln('')

      const result = await scraper.searchSCP(keyword)

      if (result.success && result.data) {
        writeln(`${ANSICode.green}Found matching SCP object:${ANSICode.reset}`)
        writeln('')
        const formattedLines = scraper.formatForTerminal(result.data)
        formattedLines.forEach(line => writeln(line))
      } else {
        writeln(`${ANSICode.red}${result.error}${ANSICode.reset}`)
        writeln('')
        writeln(`${ANSICode.yellow}Tips:${ANSICode.reset}`)
        writeln(`  - Try using a different keyword`)
        writeln(`  - Check your internet connection`)
        writeln(`  - Use "info <number>" if you know the SCP number`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}Search failed: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  network: async (_args, _write, writeln) => {
    writeln(`${ANSICode.cyan}Testing network connection to Foundation Wiki...${ANSICode.reset}`)
    writeln('')

    const result = await scraper.testConnection()

    if (result.success) {
      writeln(`${ANSICode.green}✓ Network connection is working${ANSICode.reset}`)
      writeln('')
      writeln(`${ANSICode.cyan}API Details:${ANSICode.reset}`)
      writeln(`  Status: ${result.details?.status || 'Online'}`)
      writeln(`  Version: ${result.details?.version || 'Unknown'}`)
      writeln('')
      writeln(`${ANSICode.green}All systems operational. Ready for queries.${ANSICode.reset}`)
    } else {
      writeln(`${ANSICode.red}✗ Network connection failed${ANSICode.reset}`)
      writeln('')
      writeln(`${ANSICode.cyan}Error Details:${ANSICode.reset}`)
      writeln(`  Message: ${result.message}`)
      if (result.details?.code) {
        writeln(`  Code: ${result.details.code}`)
      }
      if (result.details?.url) {
        writeln(`  URL: ${result.details.url}`)
      }
      writeln('')
      writeln(`${ANSICode.yellow}Possible Solutions:${ANSICode.reset}`)
      writeln(`  - Check your internet connection`)
      writeln(`  - Verify firewall or proxy settings`)
      writeln(`  - Try using a different network`)
      writeln(`  - Contact system administrator if problem persists`)
      writeln('')
      writeln(`${ANSICode.red}Connection failed. Unable to query SCP database.${ANSICode.reset}`)
    }
    writeln('')
  },

  performance: (_args, _write, writeln) => {
    writeln(`${ANSICode.cyan}Opening Performance Monitor Dashboard...${ANSICode.reset}`)
    writeln('')
    
    console.log('[Performance Command] Executing performance command')
    console.log('[Performance Command] window.openPerformanceDashboard exists:', typeof window.openPerformanceDashboard)
    
    if (window.openPerformanceDashboard) {
      console.log('[Performance Command] Calling openPerformanceDashboard function')
      window.openPerformanceDashboard()
      writeln(`${ANSICode.green}✓ Performance Dashboard opened${ANSICode.reset}`)
      writeln('')
      writeln(`${ANSICode.gray}Monitor real-time metrics, view performance issues,${ANSICode.reset}`)
      writeln(`${ANSICode.gray}and receive optimization recommendations.${ANSICode.reset}`)
    } else {
      console.error('[Performance Command] openPerformanceDashboard function not found')
      writeln(`${ANSICode.red}✗ Failed to open Performance Dashboard${ANSICode.reset}`)
      writeln('')
      writeln(`${ANSICode.yellow}Debug info:${ANSICode.reset}`)
      writeln(`  - Function exists: ${typeof window.openPerformanceDashboard !== 'undefined'}`)
      writeln(`  - Window object: ${typeof window !== 'undefined'}`)
    }
  },

  logout: (_args, _write, writeln) => {
    writeln(`${ANSICode.yellow}Logging out securely...${ANSICode.reset}`)
    writeln(`${ANSICode.green}Session terminated.${ANSICode.reset}`)
    writeln('Thank you for using the SCP Foundation Terminal System.')
    writeln('')
    writeln(`${ANSICode.green}Secure. Contain. Protect.${ANSICode.reset}`)
    writeln('')
  },

  ls: (_args, _write, writeln) => {
    const path = _args[0] || ''
    
    try {
      // 检查路径是否存在
      if (path) {
        const node = filesystem.getNodeByPath(path)
        if (!node) {
          writeln(`${ANSICode.red}ls: cannot access '${path}': No such file or directory${ANSICode.reset}`)
          return
        }
        if (node.type !== 'directory') {
          writeln(`${ANSICode.red}ls: cannot access '${path}': Not a directory${ANSICode.reset}`)
          return
        }
      }
      
      const files = filesystem.listDirectory(path)
      
      if (files.length === 0) {
        writeln(`${ANSICode.gray}total 0${ANSICode.reset}`)
        return
      }
      
      // 计算总大小
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      writeln(`${ANSICode.gray}total ${Math.ceil(totalSize / 1024)}${ANSICode.reset}`)
      
      files.forEach(file => {
        const permissions = [
          file.type === 'directory' ? 'd' : '-',
          file.permissions.user.read ? 'r' : '-',
          file.permissions.user.write ? 'w' : '-',
          file.permissions.user.execute ? 'x' : '-',
          file.permissions.group.read ? 'r' : '-',
          file.permissions.group.write ? 'w' : '-',
          file.permissions.group.execute ? 'x' : '-',
          file.permissions.others.read ? 'r' : '-',
          file.permissions.others.write ? 'w' : '-',
          file.permissions.others.execute ? 'x' : '-'
        ].join('')
        
        const size = file.size.toString().padStart(10)
        const mtime = new Date(file.mtime).toLocaleString()
        const name = file.type === 'directory' ? `${ANSICode.blue}${file.name}/${ANSICode.reset}` : file.name
        
        writeln(`${permissions} ${file.owner} ${file.group} ${size} ${mtime} ${name}`)
      })
    } catch (error) {
      writeln(`${ANSICode.red}ls: error reading directory '${path}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  cd: (_args, _write, writeln) => {
    const path = _args[0]
    if (!path) {
      // 如果没有参数，切换到用户主目录
      if (filesystem.changeDirectory('~')) {
        return
      }
      writeln(`${ANSICode.yellow}Usage: cd <path>${ANSICode.reset}`)
      return
    }
    
    try {
      const node = filesystem.getNodeByPath(path)
      if (!node) {
        writeln(`${ANSICode.red}cd: ${path}: No such file or directory${ANSICode.reset}`)
        return
      }
      
      if (node.type !== 'directory') {
        writeln(`${ANSICode.red}cd: ${path}: Not a directory${ANSICode.reset}`)
        return
      }
      
      if (filesystem.changeDirectory(path)) {
        // 目录更改成功，不输出任何内容
      } else {
        writeln(`${ANSICode.red}cd: ${path}: Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}cd: error changing directory '${path}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  pwd: (_args, _write, writeln) => {
    writeln(filesystem.getCurrentDirectory())
  },

  mkdir: (_args, _write, writeln) => {
    const dirPath = _args[0]
    if (!dirPath) {
      writeln(`${ANSICode.yellow}Usage: mkdir <directory>${ANSICode.reset}`)
      return
    }
    
    try {
      // 检查父目录是否存在
      const parts = dirPath.split('/').filter(p => p !== '')
      parts.pop()
      const parentPath = parts.join('/')
      
      if (parentPath) {
        const parentNode = filesystem.getNodeByPath(parentPath)
        if (!parentNode) {
          writeln(`${ANSICode.red}mkdir: cannot create directory '${dirPath}': No such file or directory${ANSICode.reset}`)
          return
        }
        if (parentNode.type !== 'directory') {
          writeln(`${ANSICode.red}mkdir: cannot create directory '${dirPath}': Not a directory${ANSICode.reset}`)
          return
        }
      }
      
      // 检查目录是否已存在
      const existingNode = filesystem.getNodeByPath(dirPath)
      if (existingNode) {
        writeln(`${ANSICode.red}mkdir: cannot create directory '${dirPath}': File exists${ANSICode.reset}`)
        return
      }
      
      if (filesystem.createDirectory(dirPath)) {
        writeln(`${ANSICode.green}Created directory: ${dirPath}${ANSICode.reset}`)
      } else {
        writeln(`${ANSICode.red}mkdir: cannot create directory '${dirPath}': Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}mkdir: error creating directory '${dirPath}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  rm: (_args, _write, writeln) => {
    const path = _args[0]
    const recursive = _args.includes('-r') || _args.includes('-rf')
    
    if (!path || path.startsWith('-')) {
      writeln(`${ANSICode.yellow}Usage: rm [-r] <file|directory>${ANSICode.reset}`)
      return
    }
    
    try {
      const node = filesystem.getNodeByPath(path)
      if (!node) {
        writeln(`${ANSICode.red}rm: cannot remove '${path}': No such file or directory${ANSICode.reset}`)
        return
      }
      
      // 检查是否是目录且没有递归选项
      if (node.type === 'directory' && !recursive) {
        // 检查目录是否为空
        const children = Object.keys(node.children || {})
        if (children.length > 0) {
          writeln(`${ANSICode.red}rm: cannot remove '${path}': Is a directory${ANSICode.reset}`)
          writeln(`${ANSICode.gray}Use 'rm -r ${path}' to remove directories and their contents${ANSICode.reset}`)
          return
        }
      }
      
      if (filesystem.deleteNode(path)) {
        writeln(`${ANSICode.green}Removed: ${path}${ANSICode.reset}`)
      } else {
        writeln(`${ANSICode.red}rm: cannot remove '${path}': Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}rm: error removing '${path}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  cat: (_args, _write, writeln) => {
    const filePath = _args[0]
    if (!filePath) {
      writeln(`${ANSICode.yellow}Usage: cat <file>${ANSICode.reset}`)
      return
    }
    
    try {
      const node = filesystem.getNodeByPath(filePath)
      if (!node) {
        writeln(`${ANSICode.red}cat: ${filePath}: No such file or directory${ANSICode.reset}`)
        return
      }
      
      if (node.type === 'directory') {
        writeln(`${ANSICode.red}cat: ${filePath}: Is a directory${ANSICode.reset}`)
        return
      }
      
      const content = filesystem.readFile(filePath)
      if (content !== null) {
        writeln(content)
      } else {
        writeln(`${ANSICode.red}cat: ${filePath}: Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}cat: error reading '${filePath}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  echo: (_args, _write, writeln) => {
    if (_args.length === 0) {
      writeln('')
      return
    }
    
    // 解析重定向操作符
    let redirectIndex = -1
    let appendMode = false
    
    for (let i = 0; i < _args.length; i++) {
      if (_args[i] === '>' || _args[i] === '>>') {
        redirectIndex = i
        appendMode = _args[i] === '>>'
        break
      }
    }
    
    if (redirectIndex !== -1) {
      const text = _args.slice(0, redirectIndex).join(' ')
      const filePath = _args[redirectIndex + 1]
      
      if (!filePath) {
        writeln(`${ANSICode.red}echo: missing file operand${ANSICode.reset}`)
        return
      }
      
      // 检查文件是否存在
      const existingContent = filesystem.readFile(filePath)
      
      if (appendMode && existingContent !== null) {
        // 追加模式
        const newContent = existingContent + (existingContent.endsWith('\n') ? '' : '\n') + text
        if (filesystem.writeFile(filePath, newContent)) {
          // 重定向成功，不输出任何内容
        } else {
          writeln(`${ANSICode.red}echo: cannot write to '${filePath}': Permission denied${ANSICode.reset}`)
        }
      } else {
        // 覆盖模式或创建新文件
        if (existingContent !== null) {
          // 文件存在，直接写入
          if (filesystem.writeFile(filePath, text)) {
            // 重定向成功，不输出任何内容
          } else {
            writeln(`${ANSICode.red}echo: cannot write to '${filePath}': Permission denied${ANSICode.reset}`)
          }
        } else {
          // 文件不存在，创建新文件
          if (filesystem.createFile(filePath, text)) {
            // 重定向成功，不输出任何内容
          } else {
            writeln(`${ANSICode.red}echo: cannot create file '${filePath}': No such file or directory${ANSICode.reset}`)
          }
        }
      }
    } else {
      writeln(_args.join(' '))
    }
  },

  touch: (_args, _write, writeln) => {
    const filePath = _args[0]
    if (!filePath) {
      writeln(`${ANSICode.yellow}Usage: touch <file>${ANSICode.reset}`)
      return
    }
    
    try {
      // 检查父目录是否存在
      const parts = filePath.split('/').filter(p => p !== '')
      parts.pop()
      const parentPath = parts.join('/')
      
      if (parentPath) {
        const parentNode = filesystem.getNodeByPath(parentPath)
        if (!parentNode) {
          writeln(`${ANSICode.red}touch: cannot create file '${filePath}': No such file or directory${ANSICode.reset}`)
          return
        }
        if (parentNode.type !== 'directory') {
          writeln(`${ANSICode.red}touch: cannot create file '${filePath}': Not a directory${ANSICode.reset}`)
          return
        }
      }
      
      // 检查文件是否已存在
      const existingNode = filesystem.getNodeByPath(filePath)
      if (existingNode) {
        if (existingNode.type === 'directory') {
          writeln(`${ANSICode.red}touch: cannot create file '${filePath}': Is a directory${ANSICode.reset}`)
          return
        }
        // 文件已存在，更新修改时间
        existingNode.mtime = Date.now()
        writeln(`${ANSICode.green}Updated: ${filePath}${ANSICode.reset}`)
        return
      }
      
      if (filesystem.createFile(filePath)) {
        writeln(`${ANSICode.green}Created: ${filePath}${ANSICode.reset}`)
      } else {
        writeln(`${ANSICode.red}touch: cannot create file '${filePath}': Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}touch: error creating file '${filePath}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  cp: (_args, _write, writeln) => {
    const source = _args[0]
    const destination = _args[1]
    
    if (!source || !destination) {
      writeln(`${ANSICode.yellow}Usage: cp <source> <destination>${ANSICode.reset}`)
      return
    }
    
    try {
      // 检查源文件是否存在
      const sourceNode = filesystem.getNodeByPath(source)
      if (!sourceNode) {
        writeln(`${ANSICode.red}cp: cannot stat '${source}': No such file or directory${ANSICode.reset}`)
        return
      }
      
      // 检查目标父目录是否存在
      const destParts = destination.split('/').filter(p => p !== '')
      destParts.pop()
      const destParentPath = destParts.join('/')
      
      if (destParentPath) {
        const destParentNode = filesystem.getNodeByPath(destParentPath)
        if (!destParentNode) {
          writeln(`${ANSICode.red}cp: cannot copy to '${destination}': No such file or directory${ANSICode.reset}`)
          return
        }
        if (destParentNode.type !== 'directory') {
          writeln(`${ANSICode.red}cp: cannot copy to '${destination}': Not a directory${ANSICode.reset}`)
          return
        }
      }
      
      // 检查目标是否已存在
      const existingNode = filesystem.getNodeByPath(destination)
      if (existingNode) {
        writeln(`${ANSICode.red}cp: cannot copy to '${destination}': File exists${ANSICode.reset}`)
        return
      }
      
      if (filesystem.copyNode(source, destination)) {
        writeln(`${ANSICode.green}Copied ${source} to ${destination}${ANSICode.reset}`)
      } else {
        writeln(`${ANSICode.red}cp: cannot copy '${source}' to '${destination}': Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}cp: error copying '${source}' to '${destination}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  mv: (_args, _write, writeln) => {
    const source = _args[0]
    const destination = _args[1]
    
    if (!source || !destination) {
      writeln(`${ANSICode.yellow}Usage: mv <source> <destination>${ANSICode.reset}`)
      return
    }
    
    try {
      // 检查源文件是否存在
      const sourceNode = filesystem.getNodeByPath(source)
      if (!sourceNode) {
        writeln(`${ANSICode.red}mv: cannot stat '${source}': No such file or directory${ANSICode.reset}`)
        return
      }
      
      // 检查目标父目录是否存在
      const destParts = destination.split('/').filter(p => p !== '')
      destParts.pop()
      const destParentPath = destParts.join('/')
      
      if (destParentPath) {
        const destParentNode = filesystem.getNodeByPath(destParentPath)
        if (!destParentNode) {
          writeln(`${ANSICode.red}mv: cannot move to '${destination}': No such file or directory${ANSICode.reset}`)
          return
        }
        if (destParentNode.type !== 'directory') {
          writeln(`${ANSICode.red}mv: cannot move to '${destination}': Not a directory${ANSICode.reset}`)
          return
        }
      }
      
      if (filesystem.moveNode(source, destination)) {
        writeln(`${ANSICode.green}Moved ${source} to ${destination}${ANSICode.reset}`)
      } else {
        writeln(`${ANSICode.red}mv: cannot move '${source}' to '${destination}': Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}mv: error moving '${source}' to '${destination}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  uname: (_args, _write, writeln) => {
    const all = _args.includes('-a')
    if (all) {
      writeln(`Linux scp-terminal 5.15.0-100-generic #110-Ubuntu SMP Wed Jun 14 15:30:30 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux`)
    } else {
      writeln(`Linux`)
    }
  },

  df: (_args, _write, writeln) => {
    writeln(`${ANSICode.green}Filesystem     1K-blocks    Used Available Use% Mounted on${ANSICode.reset}`)
    writeln(`/dev/sda1       20971520  524288  20447232   3% /`)
    writeln(`tmpfs            1048576       0   1048576   0% /dev/shm`)
    writeln(`tmpfs             524288    1024    523264   1% /run`)
  },

  free: (_args, _write, writeln) => {
    writeln(`${ANSICode.green}              total        used        free      shared  buff/cache   available${ANSICode.reset}`)
    writeln(`Mem:        4194304      524288     3145728        8192      524288     3670016`)
    writeln(`Swap:       2097152           0     2097152`)
  },

  uptime: (_args, _write, writeln) => {
    const uptime = '10:30:45 up 2 days,  4:30,  1 user,  load average: 0.00, 0.01, 0.05'
    writeln(uptime)
  },

  find: (_args, _write, writeln) => {
    const path = _args[0] || ''
    const patternIndex = _args.indexOf('-name')
    const pattern = patternIndex !== -1 ? _args[patternIndex + 1] : ''
    
    if (!pattern) {
      writeln(`${ANSICode.yellow}Usage: find <path> -name <pattern>${ANSICode.reset}`)
      return
    }
    
    try {
      // 检查起始路径是否存在
      if (path) {
        const node = filesystem.getNodeByPath(path)
        if (!node) {
          writeln(`${ANSICode.red}find: '${path}': No such file or directory${ANSICode.reset}`)
          return
        }
        if (node.type !== 'directory') {
          writeln(`${ANSICode.red}find: '${path}': Not a directory${ANSICode.reset}`)
          return
        }
      }
      
      const results = filesystem.findFiles(pattern, path)
      
      if (results.length === 0) {
        writeln(`${ANSICode.gray}No files matching '${pattern}' found${ANSICode.reset}`)
        return
      }
      
      results.forEach(file => writeln(file))
    } catch (error) {
      writeln(`${ANSICode.red}find: error searching for files: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  grep: (_args, _write, writeln) => {
    const pattern = _args[0]
    const files = _args.slice(1)
    
    if (!pattern || files.length === 0) {
      writeln(`${ANSICode.yellow}Usage: grep <pattern> <file>${ANSICode.reset}`)
      return
    }
    
    try {
      // 验证所有文件是否存在且可读
      const validFiles: string[] = []
      for (const file of files) {
        const node = filesystem.getNodeByPath(file)
        if (!node) {
          writeln(`${ANSICode.red}grep: ${file}: No such file or directory${ANSICode.reset}`)
          continue
        }
        if (node.type === 'directory') {
          writeln(`${ANSICode.red}grep: ${file}: Is a directory${ANSICode.reset}`)
          continue
        }
        validFiles.push(file)
      }
      
      if (validFiles.length === 0) {
        return
      }
      
      const results = filesystem.grepContent(pattern, validFiles)
      
      if (results.length === 0) {
        writeln(`${ANSICode.gray}No matches found for '${pattern}'${ANSICode.reset}`)
        return
      }
      
      results.forEach(result => {
        result.lines.forEach(line => {
          // 高亮匹配的部分
          const highlightedLine = line.replace(
            new RegExp(pattern, 'gi'),
            match => `${ANSICode.red}${match}${ANSICode.reset}`
          )
          writeln(`${ANSICode.green}${result.file}:${ANSICode.reset}${highlightedLine}`)
        })
      })
    } catch (error) {
      writeln(`${ANSICode.red}grep: error searching content: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  chmod: (_args, _write, writeln) => {
    const permissions = _args[0]
    const filePath = _args[1]
    
    if (!permissions || !filePath) {
      writeln(`${ANSICode.yellow}Usage: chmod <permissions> <file>${ANSICode.reset}`)
      return
    }
    
    try {
      // 检查文件是否存在
      const node = filesystem.getNodeByPath(filePath)
      if (!node) {
        writeln(`${ANSICode.red}chmod: cannot access '${filePath}': No such file or directory${ANSICode.reset}`)
        return
      }
      
      // 简化的权限设置
      const newPermissions = {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: false }
      }
      
      if (filesystem.changePermissions(filePath, newPermissions)) {
        writeln(`${ANSICode.green}Changed permissions for ${filePath}${ANSICode.reset}`)
      } else {
        writeln(`${ANSICode.red}chmod: cannot change permissions of '${filePath}': Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}chmod: error changing permissions of '${filePath}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  chown: (_args, _write, writeln) => {
    const ownerGroup = _args[0]
    const filePath = _args[1]
    
    if (!ownerGroup || !filePath) {
      writeln(`${ANSICode.yellow}Usage: chown <owner>:<group> <file>${ANSICode.reset}`)
      return
    }
    
    const [owner, group] = ownerGroup.split(':')
    if (!owner || !group) {
      writeln(`${ANSICode.yellow}Usage: chown <owner>:<group> <file>${ANSICode.reset}`)
      return
    }
    
    try {
      // 检查文件是否存在
      const node = filesystem.getNodeByPath(filePath)
      if (!node) {
        writeln(`${ANSICode.red}chown: cannot access '${filePath}': No such file or directory${ANSICode.reset}`)
        return
      }
      
      if (filesystem.changeOwner(filePath, owner, group)) {
        writeln(`${ANSICode.green}Changed owner for ${filePath} to ${owner}:${group}${ANSICode.reset}`)
      } else {
        writeln(`${ANSICode.red}chown: cannot change ownership of '${filePath}': Permission denied${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}chown: error changing ownership of '${filePath}': ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  }
}

export function getCommandHandler(command: CommandType): CommandHandler | null {
  return commandHandlers[command] || null
}