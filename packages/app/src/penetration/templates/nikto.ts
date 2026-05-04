import type { ToolTemplateResult, VulnerabilityInfo } from '../types'
import { randomInt, randomChoice, generateTimestamp, getToolDelay } from '../randomizer'

const R = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'

const NIKTO_FINDINGS: {
  osvdb: string
  path: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}[] = [
  { osvdb: '383', path: '/admin/', description: 'Directory indexing found.', severity: 'medium' },
  { osvdb: '3268', path: '/icons/', description: 'Default directory found.', severity: 'low' },
  {
    osvdb: '3092',
    path: '/phpmyadmin/',
    description: 'phpMyAdmin directory found.',
    severity: 'high',
  },
  {
    osvdb: '3967',
    path: '/wp-login.php',
    description: 'WordPress login page found.',
    severity: 'medium',
  },
  {
    osvdb: '3233',
    path: '/server-status',
    description: 'Apache server-status found.',
    severity: 'medium',
  },
  { osvdb: '4030', path: '/cgi-bin/', description: 'CGI directory found.', severity: 'medium' },
  { osvdb: '3268', path: '/.git/', description: 'Git repository found.', severity: 'critical' },
  { osvdb: '3268', path: '/.env', description: 'Environment file exposed.', severity: 'critical' },
  { osvdb: '3092', path: '/backup/', description: 'Backup directory found.', severity: 'high' },
  {
    osvdb: '383',
    path: '/config.php.bak',
    description: 'Config backup file found.',
    severity: 'high',
  },
  {
    osvdb: '3268',
    path: '/wp-config.php.bak',
    description: 'WordPress config backup found.',
    severity: 'critical',
  },
  {
    osvdb: '3233',
    path: '/server-info',
    description: 'Apache server-info found.',
    severity: 'medium',
  },
]

const SERVER_VERSIONS = [
  'Apache/2.4.52 (Ubuntu)',
  'Apache/2.4.54 (Debian)',
  'nginx/1.24.0',
  'Apache/2.4.53 (Win64)',
  'Apache/2.2.34 (Unix)',
]

export function generateNiktoOutput(targetIP: string, port: number): ToolTemplateResult {
  const lines: string[] = []
  const hostname = 'scp-server-017.foundation.local'
  const server = randomChoice(SERVER_VERSIONS)
  const startTime = generateTimestamp()
  const vulnerabilities: VulnerabilityInfo[] = []

  lines.push('')
  lines.push(`- Nikto v2.5.0`)
  lines.push('---------------------------------------------------------------------------')
  lines.push(`+ Target IP:          ${targetIP}`)
  lines.push(`+ Target Hostname:    ${hostname}`)
  lines.push(`+ Target Port:        ${port}`)
  lines.push(`+ Start Time:         ${startTime}`)
  lines.push('---------------------------------------------------------------------------')
  lines.push(`+ Server: ${server}`)
  lines.push('')

  const findingCount = randomInt(4, 9)
  const shuffled = [...NIKTO_FINDINGS].sort(() => Math.random() - 0.5)
  const selectedFindings = shuffled.slice(0, findingCount)

  for (const f of selectedFindings) {
    const sevColor = f.severity === 'critical' ? RED : f.severity === 'high' ? YELLOW : CYAN
    lines.push(`+ ${sevColor}OSVDB-${f.osvdb}${R}: ${f.path}: ${f.description}`)
    lines.push(`  ${GRAY}→ ${sevColor}[${f.severity.toUpperCase()}]${R}`)

    vulnerabilities.push({
      cve: `OSVDB-${f.osvdb}`,
      severity: f.severity,
      service: 'http',
      port: port,
      description: `${f.path}: ${f.description}`,
      exploitable: f.severity === 'critical' || f.severity === 'high',
    })
  }

  lines.push('')
  lines.push('+ ' + GREEN + 'Server: ' + server + R)

  const interestingHeaders = [
    'X-Powered-By: PHP/8.1.13',
    'X-Frame-Options: SAMEORIGIN',
    'X-Content-Type-Options: nosniff',
    'Set-Cookie: PHPSESSID=...; path=/; HttpOnly',
  ]
  const headerCount = randomInt(1, 3)
  const selectedHeaders = interestingHeaders.sort(() => Math.random() - 0.5).slice(0, headerCount)
  for (const h of selectedHeaders) {
    lines.push(`+ ${GRAY}${h}${R}`)
  }

  lines.push('')
  lines.push('---------------------------------------------------------------------------')
  const endTime = generateTimestamp()
  lines.push(`+ End Time:           ${endTime}`)
  lines.push(`+ ${randomInt(1, 3)} host(s) tested`)
  lines.push('---------------------------------------------------------------------------')
  lines.push('')

  return {
    lines,
    delay: getToolDelay('nikto'),
    variables: {
      vulnerabilities,
    },
  }
}
