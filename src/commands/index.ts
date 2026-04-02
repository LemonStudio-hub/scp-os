import type { CommandType, CommandHandler, CommandMap } from '../types/command'
import { COMMAND_DESCRIPTIONS, COMMAND_USAGE } from '../constants/commands'
import { ANSICode } from '../constants/theme'
import { scraper } from '../utils/scraper'

export const commandHandlers: CommandMap = {
  help: (_args, _write, writeln) => {
    const helpText = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                        Available Commands${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      ...Object.entries(COMMAND_DESCRIPTIONS).map(([cmd, desc]) => 
        `  ${COMMAND_USAGE[cmd as CommandType]} - ${desc}`
      ),
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    helpText.forEach(line => writeln(line))
  },

  status: (_args, _write, writeln) => {
    const statusInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                      System Status Report${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
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
      `${ANSICode.green}                    Containment Protocols${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
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
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    containmentInfo.forEach(line => writeln(line))
  },

  'scp-list': (_args, _write, writeln) => {
    const scpList = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                      Known SCP Objects${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      '  Popular Objects:',
      '',
      '  SCP-173 - 雕像 (雕像)',
      '  SCP-096 - 羞涩的人 (人形)',
      '  SCP-682 - 不灭孽蜥 (爬行动物)',
      '  SCP-999 - 痒痒怪 (橙色生物)',
      '  SCP-049 - 疫医 (人形)',
      '  SCP-914 - 万能加工机 (机器)',
      '  SCP-3008 - 无限宜家 (建筑)',
      '  SCP-087 - 楼梯间 (空间)',
      '  SCP-106 - 老人 (人形)',
      '  SCP-1471 - 恶魔 (数字实体)',
      '',
      `${ANSICode.cyan}  Tip: Use "info <number>" to view details${ANSICode.reset}`,
      `${ANSICode.cyan}  Use "search <keyword>" to search for specific objects${ANSICode.reset}`,
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    scpList.forEach(line => writeln(line))
  },

  info: async (args, _write, writeln) => {
    const scpNumber = args[0]
    if (!scpNumber) {
      writeln(`${ANSICode.yellow}Please specify SCP number, e.g.: info 173${ANSICode.reset}`)
      return
    }

    writeln(`${ANSICode.cyan}Querying SCP-${scpNumber}...${ANSICode.reset}`)
    writeln('')

    try {
      // Fetch from Foundation Wiki API
      writeln(`${ANSICode.cyan}Connecting to Foundation Wiki...${ANSICode.reset}`)
      writeln('')

      const result = await scraper.scrapeSCP(scpNumber)

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
        writeln(`  - Check your internet connection`)
        writeln(`  - Try again later (server might be busy)`)
        writeln(`  - Check if SCP-${scpNumber} exists on SCP Wiki`)
        writeln('')
        writeln(`${ANSICode.red}Network query failed${ANSICode.reset}`)
      }
    } catch (error) {
      writeln(`${ANSICode.red}Query failed: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  },

  protocol: (_args, _write, writeln) => {
    const protocols = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                    Security Protocols${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
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
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    protocols.forEach(line => writeln(line))
  },

  emergency: (_args, _write, writeln) => {
    const emergencyInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                  Emergency Contact Information${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
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
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    emergencyInfo.forEach(line => writeln(line))
  },

  version: (_args, _write, writeln) => {
    const versionInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                      System Version${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      '  SCP Foundation Terminal System',
      '  Version: 3.0.2',
      '  Security Level: 4',
      '  Last Updated: 2026-04-01',
      '',
      `${ANSICode.red}  Authorized Personnel Only${ANSICode.reset}`,
      `${ANSICode.red}  Unauthorized access will result in severe penalties${ANSICode.reset}`,
      '',
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
    ]
    versionInfo.forEach(line => writeln(line))
  },

  about: (_args, _write, writeln) => {
    const aboutInfo = [
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      `${ANSICode.green}                          About System${ANSICode.reset}`,
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
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
      `${ANSICode.red}═══════════════════════════════════════════════════════════════${ANSICode.reset}`
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

  logout: (_args, _write, writeln) => {
    writeln(`${ANSICode.yellow}Logging out securely...${ANSICode.reset}`)
    writeln(`${ANSICode.green}Session terminated.${ANSICode.reset}`)
    writeln('Thank you for using the SCP Foundation Terminal System.')
    writeln('')
    writeln(`${ANSICode.green}Secure. Contain. Protect.${ANSICode.reset}`)
    writeln('')
  }
}

export function getCommandHandler(command: CommandType): CommandHandler | null {
  return commandHandlers[command] || null
}