import type { PhaseConfig, VariablePool } from '../types'
import { SCP_TARGET } from './scp-target'
import { generateNmapOutput } from '../templates/nmap'
import { generateNiktoOutput } from '../templates/nikto'
import { generateWhoisOutput, generateDigOutput, generateCurlOutput } from '../templates/misc'
import { typeLines, typeWithDelay, success, error, info, warning, header } from '../output'

export const reconPhase: PhaseConfig = {
  id: 'recon',
  name: '信息收集',
  description: '目标信息探测与资产发现',
  prompt: 'recon> ',
  availableCommands: ['nmap', 'whois', 'dig', 'curl', 'nikto'],
  requiredActions: ['port_scan', 'service_detect'],
  completedActions: [],

  async onEnter(vars: VariablePool, _write: (t: string) => void, writeln: (t: string) => void) {
    writeln('')
    writeln(header('阶段 1/6: 信息收集'))
    writeln('')
    writeln(info(`目标系统: ${vars.targetIP}`))
    writeln(info(`主机名: ${vars.targetHostname}`))
    writeln(info(`任务: 对目标进行信息收集，发现开放端口与运行服务`))
    writeln('')
    writeln(warning('使用 nmap 扫描目标端口，nmap -sV 进行服务版本检测'))
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
    if (cmd === 'nmap') {
      const hasScriptVuln = args.includes('--script') && args.includes('vuln')
      const hasSV = args.includes('-sV')
      const ipArg = args.find((a) => !a.startsWith('-'))

      if (!ipArg) {
        writeln(error('用法: nmap [-sV] [--script vuln] <ip>'))
        return
      }

      let scanType: 'quick' | 'full' | 'vuln' = 'quick'
      if (hasScriptVuln) {
        scanType = 'vuln'
      } else if (hasSV) {
        scanType = 'full'
      }

      const ports = vars.openPorts.length > 0 ? vars.openPorts : SCP_TARGET.ports
      await typeWithDelay(`正在执行 nmap 扫描 ${ipArg}...`, write, 3000)
      const result = generateNmapOutput(ipArg, ports, scanType)
      await typeLines(result.lines, write, writeln)

      if (result.variables?.openPorts) {
        vars.openPorts = result.variables.openPorts as VariablePool['openPorts']
      }
      if (result.variables?.vulnerabilities) {
        vars.vulnerabilities = result.variables.vulnerabilities as VariablePool['vulnerabilities']
      }

      completeAction('port_scan')
      if (hasSV || hasScriptVuln) {
        completeAction('service_detect')
      }
      writeln(success('端口扫描完成'))
    } else if (cmd === 'whois') {
      const ipArg = args[0]
      if (!ipArg) {
        writeln(error('用法: whois <ip>'))
        return
      }
      await typeWithDelay(`正在查询 WHOIS ${ipArg}...`, write, 1500)
      const result = generateWhoisOutput(ipArg)
      await typeLines(result.lines, write, writeln)
    } else if (cmd === 'dig') {
      const domain = args[0]
      if (!domain) {
        writeln(error('用法: dig <domain>'))
        return
      }
      await typeWithDelay(`正在解析 DNS ${domain}...`, write, 800)
      const result = generateDigOutput(domain)
      await typeLines(result.lines, write, writeln)
    } else if (cmd === 'curl') {
      const url = args[0]
      if (!url) {
        writeln(error('用法: curl <url>'))
        return
      }
      await typeWithDelay(`正在请求 ${url}...`, write, 1000)
      const result = generateCurlOutput(url)
      await typeLines(result.lines, write, writeln)
    } else if (cmd === 'nikto') {
      const hFlag = args.indexOf('-h')
      const ipArg = hFlag !== -1 ? args[hFlag + 1] : args[0]
      if (!ipArg) {
        writeln(error('用法: nikto -h <ip>'))
        return
      }
      const port = vars.openPorts.find((p) => p.service === 'http')?.port ?? 80
      await typeWithDelay(`正在运行 Nikto 扫描 ${ipArg}:${port}...`, write, 4000)
      const result = generateNiktoOutput(ipArg, port)
      await typeLines(result.lines, write, writeln)

      if (result.variables?.vulnerabilities) {
        vars.vulnerabilities = [
          ...vars.vulnerabilities,
          ...(result.variables.vulnerabilities as VariablePool['vulnerabilities']),
        ]
      }
      writeln(success('Web 漏洞扫描完成'))
    } else {
      writeln(warning(`未知命令: ${cmd}`))
      writeln(info('可用命令: nmap, whois, dig, curl, nikto'))
    }
  },
}
