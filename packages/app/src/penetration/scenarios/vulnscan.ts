import type { PhaseConfig, VariablePool } from '../types'
import { SCP_TARGET } from './scp-target'
import { generateNmapOutput } from '../templates/nmap'
import { generateNiktoOutput } from '../templates/nikto'
import { generateSqlmapOutput } from '../templates/sqlmap'
import { typeLines, typeWithDelay, success, error, info, warning, dim, header } from '../output'

export const vulnscanPhase: PhaseConfig = {
  id: 'vulnscan',
  name: '漏洞识别',
  description: '漏洞扫描与安全评估',
  prompt: 'vulnscan> ',
  availableCommands: ['nmap --script vuln', 'nikto', 'sqlmap', 'searchsploit'],
  requiredActions: ['vuln_scan', 'vuln_identify'],
  completedActions: [],

  async onEnter(vars: VariablePool, _write: (t: string) => void, writeln: (t: string) => void) {
    writeln('')
    writeln(header('阶段 2/6: 漏洞识别'))
    writeln('')
    writeln(info(`目标: ${vars.targetIP} (${vars.targetHostname})`))
    if (vars.openPorts.length > 0) {
      writeln(info(`已发现 ${vars.openPorts.length} 个开放端口`))
      const services = vars.openPorts.map((p) => `${p.service}:${p.port}`).join(', ')
      writeln(dim(`  服务: ${services}`))
    }
    writeln('')
    writeln(warning('基于信息收集结果，对目标进行漏洞扫描'))
    writeln('')
  },

  async handleCommand(
    cmd: string,
    args: string[],
    vars: VariablePool,
    write: (t: string) => void,
    writeln: (t: string) => void,
    completeAction: (action: string) => void
  ) {
    const targetIP = vars.targetIP

    if (cmd === 'nmap' && args.includes('--script') && args.includes('vuln')) {
      const ipArg = args.find((a) => !a.startsWith('-')) ?? targetIP
      await typeWithDelay(`正在执行漏洞扫描 ${ipArg}...`, write, 5000)
      const ports = vars.openPorts.length > 0 ? vars.openPorts : SCP_TARGET.ports
      const result = generateNmapOutput(ipArg, ports, 'vuln')
      await typeLines(result.lines, write, writeln)

      if (result.variables?.vulnerabilities) {
        vars.vulnerabilities = result.variables.vulnerabilities as VariablePool['vulnerabilities']
      }
      completeAction('vuln_scan')
      writeln(success('漏洞扫描完成'))
    } else if (cmd === 'nikto') {
      const hFlag = args.indexOf('-h')
      const ipArg = hFlag !== -1 ? args[hFlag + 1] : targetIP
      const port = vars.openPorts.find((p) => p.service === 'http')?.port ?? 80
      await typeWithDelay(`正在运行 Nikto Web 漏洞扫描 ${ipArg}:${port}...`, write, 4000)
      const result = generateNiktoOutput(ipArg, port)
      await typeLines(result.lines, write, writeln)

      if (result.variables?.vulnerabilities) {
        vars.vulnerabilities = [
          ...vars.vulnerabilities,
          ...(result.variables.vulnerabilities as VariablePool['vulnerabilities']),
        ]
      }
      completeAction('vuln_scan')
      writeln(success('Web 漏洞扫描完成'))
    } else if (cmd === 'sqlmap') {
      const uFlag = args.indexOf('-u')
      const urlArg = uFlag !== -1 ? args[uFlag + 1] : args[0]
      if (!urlArg) {
        writeln(error('用法: sqlmap -u <url>'))
        return
      }
      await typeWithDelay(`正在运行 SQL 注入检测 ${urlArg}...`, write, 5000)
      const result = generateSqlmapOutput(urlArg)
      await typeLines(result.lines, write, writeln)

      if (result.variables?.vulnerabilities) {
        vars.vulnerabilities = [
          ...vars.vulnerabilities,
          ...(result.variables.vulnerabilities as VariablePool['vulnerabilities']),
        ]
      }
      completeAction('vuln_identify')
      writeln(success('SQL 注入检测完成'))
    } else if (cmd === 'searchsploit') {
      const keyword = args[0]
      if (!keyword) {
        writeln(error('用法: searchsploit <service>'))
        return
      }
      await typeWithDelay(`正在搜索漏洞利用 ${keyword}...`, write, 2000)

      const knownExploits: Record<string, { cve: string; name: string; rank: string }[]> = {
        apache: [
          {
            cve: 'CVE-2023-44487',
            name: 'exploit/multi/http/apache_http2_rapid_reset',
            rank: 'great',
          },
          {
            cve: 'CVE-2021-41773',
            name: 'exploit/multi/http/apache_path_traversal',
            rank: 'excellent',
          },
        ],
        ssh: [{ cve: 'CVE-2023-38408', name: 'exploit/multi/ssh/ssh_agent_bypass', rank: 'good' }],
        mysql: [
          {
            cve: 'CVE-2023-22515',
            name: 'exploit/multi/http/confluence_access_control',
            rank: 'excellent',
          },
        ],
        nginx: [
          { cve: 'CVE-2023-46604', name: 'exploit/multi/http/activemq_rce', rank: 'excellent' },
        ],
        activemq: [
          { cve: 'CVE-2023-46604', name: 'exploit/multi/http/activemq_rce', rank: 'excellent' },
        ],
        http: [
          {
            cve: 'CVE-2023-44487',
            name: 'exploit/multi/http/apache_http2_rapid_reset',
            rank: 'great',
          },
          {
            cve: 'CVE-2023-22515',
            name: 'exploit/multi/http/confluence_access_control',
            rank: 'excellent',
          },
        ],
      }

      const results = knownExploits[keyword.toLowerCase()] ?? []
      writeln('')
      writeln(`\x1b[36m SearchSploit 搜索结果: "${keyword}"\x1b[0m`)
      writeln('')

      if (results.length === 0) {
        writeln(warning('未找到匹配的漏洞利用'))
      } else {
        for (const r of results) {
          const rankColor =
            r.rank === 'excellent' ? '\x1b[32m' : r.rank === 'great' ? '\x1b[33m' : '\x1b[36m'
          writeln(`  ${r.cve.padEnd(16)} ${r.name.padEnd(50)} ${rankColor}${r.rank}\x1b[0m`)
        }
      }
      writeln('')
      completeAction('vuln_identify')
    } else if (cmd === 'vulns') {
      writeln('')
      writeln(`\x1b[36m━━━ 已发现漏洞 ━━━\x1b[0m`)
      writeln('')
      if (vars.vulnerabilities.length === 0) {
        writeln(warning('尚未发现漏洞，请先执行扫描'))
      } else {
        for (const v of vars.vulnerabilities) {
          const sevColor =
            v.severity === 'critical' ? '\x1b[31m' : v.severity === 'high' ? '\x1b[33m' : '\x1b[36m'
          writeln(`  ${sevColor}${v.severity.toUpperCase().padEnd(8)}\x1b[0m ${v.cve}`)
          writeln(`         ${v.description}`)
          writeln(
            `         端口: ${v.port}/${v.service}  可利用: ${v.exploitable ? '\x1b[32m是\x1b[0m' : '\x1b[31m否\x1b[0m'}`
          )
          writeln('')
        }
      }
      writeln(success(`共 ${vars.vulnerabilities.length} 个漏洞`))
    } else {
      writeln(warning(`未知命令: ${cmd}`))
      writeln(info('可用命令: nmap --script vuln, nikto, sqlmap, searchsploit, vulns'))
    }
  },
}
