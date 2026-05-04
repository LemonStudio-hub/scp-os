import type { ToolTemplateResult, PortInfo, VulnerabilityInfo } from '../types'
import { randomInt, randomFloat, randomChoice, getToolDelay } from '../randomizer'

const R = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'
const BOLD = '\x1b[1m'

const COMMON_PORTS: { port: number; service: string; versions: string[] }[] = [
  { port: 21, service: 'ftp', versions: ['vsftpd 3.0.3', 'ProFTPD 1.3.5e', 'Pure-FTPd'] },
  {
    port: 22,
    service: 'ssh',
    versions: ['OpenSSH 8.9p1 Ubuntu 3ubuntu0.1', 'OpenSSH 7.4', 'OpenSSH 9.0p1'],
  },
  { port: 25, service: 'smtp', versions: ['Postfix smtpd', 'Exim 4.94.2'] },
  { port: 53, service: 'domain', versions: ['ISC BIND 9.18.1', 'PowerDNS 4.3.1'] },
  {
    port: 80,
    service: 'http',
    versions: ['Apache httpd 2.4.52', 'nginx 1.24.0', 'lighttpd 1.4.67'],
  },
  { port: 110, service: 'pop3', versions: ['Dovecot pop3d', 'Courier Pop3'] },
  { port: 111, service: 'rpcbind', versions: ['2-4 RPC #100000'] },
  { port: 139, service: 'netbios-ssn', versions: ['Samba smbd 4.15.5'] },
  { port: 443, service: 'https', versions: ['Apache httpd 2.4.52 (TLS)', 'nginx 1.24.0 (TLS)'] },
  { port: 445, service: 'microsoft-ds', versions: ['Samba smbd 4.15.5', 'Windows Server 2019'] },
  { port: 993, service: 'imaps', versions: ['Dovecot imapd (TLS)'] },
  { port: 1433, service: 'ms-sql-s', versions: ['Microsoft SQL Server 2019 15.00.2000'] },
  { port: 3306, service: 'mysql', versions: ['MySQL 8.0.32', 'MySQL 5.7.41', 'MariaDB 10.6.12'] },
  { port: 3389, service: 'ms-wbt-server', versions: ['Microsoft Terminal Services'] },
  { port: 5432, service: 'postgresql', versions: ['PostgreSQL 15.2', 'PostgreSQL 14.7'] },
  { port: 5900, service: 'vnc', versions: ['RealVNC 5.3.2', 'TightVNC'] },
  { port: 6379, service: 'redis', versions: ['Redis 7.0.8', 'Redis 6.2.10'] },
  { port: 8080, service: 'http-proxy', versions: ['Apache Tomcat 9.0.72', 'Jetty 11.0.13'] },
  { port: 8443, service: 'https-alt', versions: ['Apache Tomcat 9.0.72 (TLS)'] },
  { port: 27017, service: 'mongodb', versions: ['MongoDB 6.0.4'] },
]

const VULN_ENTRIES: {
  cve: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
}[] = [
  { cve: 'CVE-2023-44487', severity: 'high', description: 'HTTP/2 Rapid Reset Attack' },
  { cve: 'CVE-2023-38408', severity: 'high', description: 'OpenSSH ssh-agent PKCS#11 bypass' },
  {
    cve: 'CVE-2023-27522',
    severity: 'medium',
    description: 'Apache mod_proxy HTTP request smuggling',
  },
  { cve: 'CVE-2022-26134', severity: 'critical', description: 'OGNL injection in Confluence' },
  {
    cve: 'CVE-2021-41773',
    severity: 'critical',
    description: 'Apache path traversal and file disclosure',
  },
  {
    cve: 'CVE-2023-22515',
    severity: 'critical',
    description: 'Broken access control in Atlassian Confluence',
  },
  {
    cve: 'CVE-2022-0847',
    severity: 'high',
    description: 'Dirty Pipe - Linux kernel pipe buffer flag overwrite',
  },
  {
    cve: 'CVE-2021-3449',
    severity: 'medium',
    description: 'OpenSSL TLS server crash via signature algorithms',
  },
  { cve: 'CVE-2023-46604', severity: 'critical', description: 'Apache ActiveMQ RCE via OpenWire' },
  {
    cve: 'CVE-2022-22965',
    severity: 'critical',
    description: 'Spring4Shell - RCE via data binding',
  },
]

export function generateNmapOutput(
  targetIP: string,
  ports: PortInfo[],
  scanType: 'quick' | 'full' | 'vuln'
): ToolTemplateResult {
  const lines: string[] = []
  const hostname = 'scp-server-017.foundation.local'
  const latency = randomFloat(0.001, 0.01).toFixed(4)

  lines.push('')
  lines.push(`Starting Nmap 7.94 ( https://nmap.org )`)
  lines.push('')
  lines.push(`Nmap scan report for ${hostname} (${targetIP})`)
  lines.push(`Host is up (${latency}s latency).`)

  if (scanType === 'full') {
    lines.push(`Not shown: ${randomInt(990, 998)} closed tcp ports (reset)`)
  }

  lines.push('')
  lines.push(`${BOLD}PORT      STATE    SERVICE         VERSION${R}`)
  lines.push('')

  const selectedPorts = ports.length > 0 ? ports : generateDefaultPorts(scanType)
  const openPorts: PortInfo[] = []

  for (const p of selectedPorts) {
    const portStr = p.port.toString().padEnd(5)
    const proto = `/${p.protocol}`.padEnd(4)
    const state = p.state.padEnd(8)
    const service = p.service.padEnd(16)
    const version = p.version

    let stateColor = GREEN
    if (p.state === 'filtered') stateColor = YELLOW
    if (p.state === 'closed') stateColor = RED

    lines.push(`${portStr}${proto} ${stateColor}${state}${R} ${service} ${GRAY}${version}${R}`)

    if (p.state === 'open') {
      openPorts.push(p)
    }
  }

  if (scanType === 'vuln') {
    lines.push('')
    lines.push(`${CYAN}┌─────────────────────────────────────────────┐${R}`)
    lines.push(`${CYAN}│           Nmap Vulnerability Scan            │${R}`)
    lines.push(`${CYAN}└─────────────────────────────────────────────┘${R}`)
    lines.push('')

    const vulnCount = randomInt(2, 5)
    const shuffled = [...VULN_ENTRIES].sort(() => Math.random() - 0.5)
    const vulnerabilities: VulnerabilityInfo[] = []

    for (let i = 0; i < Math.min(vulnCount, shuffled.length); i++) {
      const v = shuffled[i]
      const targetPort = randomChoice(openPorts.length > 0 ? openPorts : selectedPorts)
      const sevColor = v.severity === 'critical' ? RED : v.severity === 'high' ? YELLOW : CYAN

      lines.push(`${sevColor}${v.severity.toUpperCase().padEnd(8)}${R} ${v.cve}`)
      lines.push(`         ${v.description}`)
      lines.push(`         Affected: ${targetPort.service} on port ${targetPort.port}`)
      lines.push('')

      vulnerabilities.push({
        cve: v.cve,
        severity: v.severity,
        service: targetPort.service,
        port: targetPort.port,
        description: v.description,
        exploitable: v.severity === 'critical' || v.severity === 'high',
      })
    }

    lines.push(`${GREEN}VULNS: ${vulnerabilities.length} vulnerabilities detected${R}`)

    const result: ToolTemplateResult = {
      lines,
      delay: getToolDelay('nmap'),
      variables: {
        openPorts,
        vulnerabilities,
      },
    }
    return result
  }

  lines.push('')
  const scanTime = randomFloat(3.5, 25.0).toFixed(2)
  lines.push(`Nmap done: 1 IP address (1 host up) scanned in ${scanTime} seconds`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('nmap'),
    variables: {
      openPorts,
    },
  }
}

function generateDefaultPorts(scanType: 'quick' | 'full' | 'vuln'): PortInfo[] {
  const count =
    scanType === 'quick'
      ? randomInt(3, 6)
      : scanType === 'full'
        ? randomInt(6, 12)
        : randomInt(4, 8)
  const shuffled = [...COMMON_PORTS].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  return selected.map((p) => ({
    port: p.port,
    protocol: 'tcp' as const,
    service: p.service,
    version: randomChoice(p.versions),
    state: 'open' as const,
  }))
}
