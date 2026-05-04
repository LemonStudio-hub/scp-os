import type { ToolTemplateResult } from '../types'
import { randomInt, randomChoice, getToolDelay } from '../randomizer'

const R = '\x1b[0m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'
const BOLD = '\x1b[1m'

const MSF_MODULES = [
  'exploit/windows/smb/ms17_010_eternalblue',
  'exploit/windows/smb/ms17_010_psexec',
  'exploit/unix/webapp/wp_admin_shell_upload',
  'exploit/multi/http/apache_mod_cgi_bash_env_exec',
  'exploit/linux/http/libssh_auth_bypass',
  'exploit/windows/http/iis_webdav_scstoragepathfromurl',
  'exploit/multi/samba/usermap_script',
  'exploit/windows/smb/psexec',
  'exploit/linux/ftp/vsftpd_234_backdoor',
  'exploit/unix/ftp/proftpd_modcopy_exec',
  'exploit/windows/smb/cve_2020_0796_smbghost',
  'auxiliary/scanner/smb/smb_version',
  'auxiliary/scanner/ssh/ssh_version',
  'auxiliary/scanner/http/dir_scanner',
  'payload/windows/x64/meterpreter/reverse_tcp',
  'payload/windows/x64/meterpreter/reverse_https',
  'payload/linux/x64/meterpreter/reverse_tcp',
  'payload/windows/x64/shell_reverse_tcp',
]

const BANNER_LINES = [
  '',
  `       ${GREEN}.${BOLD}####${R}     ${GREEN}.${BOLD}#####${R}     ${GREEN}.${BOLD}####${R}    ${GREEN}.${BOLD}####${R}   ${GREEN}.${BOLD}########${R}  ${GREEN}.${BOLD}########${R}`,
  `     ${GREEN}.${BOLD}##...##${R}   ${GREEN}.${BOLD}##...##${R}   ${GREEN}.${BOLD}##..##${R}  ${GREEN}.${BOLD}##..##${R}  ${GREEN}.${BOLD}##........${R} ${GREEN}.${BOLD}##......${R}`,
  `    ${GREEN}.${BOLD}##....##${R}  ${GREEN}.${BOLD}##....##${R}  ${GREEN}.${BOLD}##..##${R}  ${GREEN}.${BOLD}##..##${R}  ${GREEN}.${BOLD}##........${R} ${GREEN}.${BOLD}##......${R}`,
  `   ${GREEN}.${BOLD}#########${R}  ${GREEN}.${BOLD}#########${R}  ${GREEN}.${BOLD}#####${R}   ${GREEN}.${BOLD}#####${R}  ${GREEN}.${BOLD}######${R}    ${GREEN}.${BOLD}######${R}`,
  `  ${GREEN}.${BOLD}##.....##${R}  ${GREEN}.${BOLD}##.....##${R}  ${GREEN}.${BOLD}##...##${R} ${GREEN}.${BOLD}##...##${R} ${GREEN}.${BOLD}##........${R} ${GREEN}.${BOLD}##......${R}`,
  ` ${GREEN}.${BOLD}##.....##${R}  ${GREEN}.${BOLD}##.....##${R}  ${GREEN}.${BOLD}##....##${R} ${GREEN}.${BOLD}##....##${R} ${GREEN}.${BOLD}##........${R} ${GREEN}.${BOLD}##......${R}`,
  '',
  ` ${CYAN}Metasploit Framework v6.3.44-dev${R}`,
  ` ${GRAY}--${R} ${YELLOW}=${R} ${GRAY}[${CYAN}metasploit v6.3.44-dev${R}${GRAY}]${R}  ${randomInt(2300, 2500)} exploits ${GRAY}-${R} ${randomInt(1200, 1400)} auxiliary ${GRAY}-${R} ${randomInt(400, 500)} post`,
  ` ${GRAY}--${R} ${YELLOW}=${R} ${GRAY}[${CYAN}payloads${R}${GRAY}]${R}  ${randomInt(900, 1100)} payloads ${GRAY}-${R} ${randomInt(40, 50)} encoders ${GRAY}-${R} ${randomInt(10, 20)} nops`,
  '',
]

export function generateMsfBanner(): string[] {
  return [...BANNER_LINES]
}

export function generateMsfSearch(module: string): string[] {
  const lines: string[] = []
  lines.push('')
  lines.push(`${CYAN}msf6 >${R} search ${module}`)
  lines.push('')

  const matchingModules = MSF_MODULES.filter((m) => m.toLowerCase().includes(module.toLowerCase()))

  if (matchingModules.length === 0) {
    lines.push(`${GRAY}[*]${R} No results from search.`)
    lines.push('')
    return lines
  }

  lines.push('Matching Modules')
  lines.push('================')
  lines.push('')
  lines.push(`  #  ${'Name'.padEnd(50)} ${'Rank'.padEnd(10)} Check`)
  lines.push(`  -  ${''.padEnd(50, '-')} ${''.padEnd(10, '-')} -----`)

  const ranks = ['excellent', 'great', 'good', 'normal', 'average', 'low']
  const checks = ['Yes', 'No']

  for (let i = 0; i < matchingModules.length; i++) {
    const rank = randomChoice(ranks)
    const check = randomChoice(checks)
    const num = (i + 1).toString().padStart(2, ' ')
    lines.push(
      `  ${num}  ${GREEN}${matchingModules[i].padEnd(50)}${R} ${YELLOW}${rank.padEnd(10)}${R} ${check}`
    )
  }

  lines.push('')
  return lines
}

export function generateMsfUse(exploit: string): string[] {
  const lines: string[] = []
  lines.push('')
  lines.push(`${CYAN}msf6 >${R} use ${exploit}`)
  lines.push(
    `${GRAY}[*]${R} Using configured payload ${GREEN}payload/windows/x64/meterpreter/reverse_tcp${R}`
  )
  lines.push('')
  lines.push(`${CYAN}msf6 exploit(${exploit}) >${R}`)
  lines.push('')
  return lines
}

export function generateMsfSetPayload(payload: string, targetIP: string): string[] {
  const lines: string[] = []
  const lhost = '10.0.0.1'
  const lport = randomInt(4400, 4600)

  lines.push('')
  lines.push(`${CYAN}msf6 exploit(...) >${R} set payload ${payload}`)
  lines.push(`payload => ${GREEN}${payload}${R}`)
  lines.push('')
  lines.push(`${CYAN}msf6 exploit(...) >${R} set RHOSTS ${targetIP}`)
  lines.push(`RHOSTS => ${GREEN}${targetIP}${R}`)
  lines.push('')
  lines.push(`${CYAN}msf6 exploit(...) >${R} set LHOST ${lhost}`)
  lines.push(`LHOST => ${GREEN}${lhost}${R}`)
  lines.push('')
  lines.push(`${CYAN}msf6 exploit(...) >${R} set LPORT ${lport}`)
  lines.push(`LPORT => ${GREEN}${lport}${R}`)
  lines.push('')

  return lines
}

export function generateMsfExploit(targetIP: string): ToolTemplateResult {
  const lines: string[] = []
  const lhost = '10.0.0.1'
  const lport = randomInt(4400, 4600)
  const sessionId = randomInt(1, 5)

  lines.push('')
  lines.push(`${CYAN}msf6 exploit(...) >${R} exploit`)
  lines.push('')

  lines.push(`${GRAY}[*]${R} Started reverse TCP handler on ${lhost}:${lport}`)
  lines.push(`${GRAY}[*]${R} ${targetIP}:445 - Connecting to target...`)
  lines.push(`${GRAY}[*]${R} ${targetIP}:445 - Connection established`)
  lines.push(`${GRAY}[*]${R} ${targetIP}:445 - Target OS: Windows Server 2019 (10.0 Build 17763)`)
  lines.push(`${GRAY}[*]${R} ${targetIP}:445 - Sending exploit...`)
  lines.push(`${GRAY}[*]${R} ${targetIP}:445 - Sending stage (200774 bytes) to ${targetIP}`)
  lines.push('')
  lines.push(
    `${GREEN}${BOLD}[+]${R} ${GREEN}Meterpreter session ${sessionId} opened (${lhost}:${lport} -> ${targetIP}:${randomInt(49000, 65000)})${R}`
  )
  lines.push('')
  lines.push(`${CYAN}meterpreter >${R}`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('msfconsole'),
    variables: {
      currentAccess: 'user',
    },
    triggerGlitch: true,
  }
}
