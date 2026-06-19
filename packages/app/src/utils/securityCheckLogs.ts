/**
 * Security check command log generator.
 * Simulates a realistic system security audit for terminal display.
 */

import { ANSICode } from '../constants/theme'

// Simulated filesystem paths for realistic scan output
const FILE_SYSTEM = [
  '/etc/scp-security/',
  '/etc/scp-security/protocols/',
  '/etc/scp-security/configs/',
  '/etc/scp-security/keys/',
  '/var/scp-data/',
  '/var/scp-data/containment/',
  '/var/scp-data/logs/',
  '/var/scp-data/database/',
  '/var/scp-data/cache/',
  '/opt/scp-terminal/',
  '/opt/scp-terminal/modules/',
  '/opt/scp-terminal/plugins/',
  '/usr/lib/scp/',
  '/usr/lib/scp/crypto/',
  '/usr/lib/scp/network/',
]

const FILE_NAMES = [
  'scp_index.db',
  'containment.db',
  'user_access.db',
  'audit_log.db',
  'security.conf',
  'firewall.rules',
  'access_control.list',
  'crypto_keys.pem',
  'ssl_certificates.crt',
  'network_config.yml',
  'containment_protocol.dat',
  'anomaly_detection.model',
  'threat_database.db',
  'emergency_response.cfg',
  'authentication_token.key',
  'session_manager.pid',
  'log_rotator.conf',
  'backup_schedule.cron',
  'monitoring_agent.conf',
  'intrusion_detection.rules',
  'data_encryption.key',
  'communication_channel.enc',
  'site_status.json',
  'personnel_database.db',
  'containment_breach.log',
  'security_scan.result',
]

// Ordered security check phases with display labels and colors
const CHECK_PHASES = [
  { name: 'SYSTEM_SCAN', icon: 'SCAN', color: ANSICode.cyan },
  { name: 'FILE_INTEGRITY', icon: 'FINT', color: ANSICode.yellow },
  { name: 'SECURITY_CHECK', icon: 'SECU', color: ANSICode.green },
  { name: 'NETWORK_AUDIT', icon: 'NETW', color: ANSICode.magenta },
  { name: 'CRYPTO_VERIFY', icon: 'CRYP', color: ANSICode.red },
]

interface ProgressState {
  current: number
  total: number
  width: number
}

/**
 * Render a Linux-style progress bar: [████████░░░░░░░░░░░░] 40%
 */
export function generateProgressBar(state: ProgressState): string {
  const percentage = Math.floor((state.current / state.total) * 100)
  const filled = Math.floor((state.current / state.total) * state.width)
  const empty = state.width - filled

  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  const pct = `${percentage}%`.padStart(4, ' ')

  return `${ANSICode.green}[${bar}]${ANSICode.reset} ${pct}`
}

/**
 * Generate a random file path from the simulated filesystem.
 */
function randomFilePath(): string {
  const dir = FILE_SYSTEM[Math.floor(Math.random() * FILE_SYSTEM.length)]
  const file = FILE_NAMES[Math.floor(Math.random() * FILE_NAMES.length)]
  return `${dir}${file}`
}

/**
 * Generate a random file size string (bytes or KB).
 */
function randomFileSize(): string {
  const size = Math.floor(Math.random() * 50000) + 100
  if (size > 10000) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

/**
 * Roll a random check status (mostly OK, rarely WARN or FAIL).
 */
function randomStatus(): { icon: string; color: string; text: string } {
  const rand = Math.random()
  if (rand > 0.05) {
    return { icon: '✓', color: ANSICode.green, text: 'OK' }
  } else if (rand > 0.02) {
    return { icon: '!', color: ANSICode.yellow, text: 'WARN' }
  }
  return { icon: '✗', color: ANSICode.red, text: 'FAIL' }
}

/**
 * Generate the full security check log output with all phases and summary.
 */
export function generateSecurityCheckLogs(): string[] {
  const logs: string[] = []

  // Header
  logs.push('')
  logs.push(
    `${ANSICode.red}╔══════════════════════════════════════════════════════════════╗${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.red}║${ANSICode.reset}          ${ANSICode.green}SCP Foundation Security Check${ANSICode.reset}                ${ANSICode.red}║${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.red}╚══════════════════════════════════════════════════════════════╝${ANSICode.reset}`
  )
  logs.push('')
  logs.push(`${ANSICode.yellow}[INIT] Initializing security check...${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}[INIT] Loading check modules...${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}[INIT] Setting up audit environment...${ANSICode.reset}`)
  logs.push(`${ANSICode.green}[INIT] Security check initialized${ANSICode.reset}`)
  logs.push('')

  const totalFiles = 150 + Math.floor(Math.random() * 50)
  let filesChecked = 0

  // Iterate through each security check phase
  for (const phase of CHECK_PHASES) {
    logs.push(`${phase.color}[${phase.icon}] Starting ${phase.name} phase...${ANSICode.reset}`)
    logs.push('')

    const phaseFiles = Math.floor(totalFiles / CHECK_PHASES.length)

    for (let i = 0; i < phaseFiles; i++) {
      filesChecked++
      const filePath = randomFilePath()
      const fileSize = randomFileSize()
      const status = randomStatus()

      logs.push(
        `${phase.color}[${phase.icon}]${ANSICode.reset} Checking ${ANSICode.gray}${filePath}${ANSICode.reset}`
      )
      logs.push(
        `${phase.color}[${phase.icon}]${ANSICode.reset}   Size: ${fileSize} | Checksum: ${generateChecksum()}`
      )
      logs.push(
        `${phase.color}[${phase.icon}]${ANSICode.reset}   Status: ${status.color}${status.icon} ${status.text}${ANSICode.reset}`
      )

      // Show progress bar every 10 files and at the end
      if (filesChecked % 10 === 0 || filesChecked === totalFiles) {
        const progress = generateProgressBar({
          current: filesChecked,
          total: totalFiles,
          width: 40,
        })
        logs.push(
          `${phase.color}[${phase.icon}]${ANSICode.reset} Progress: ${progress} (${filesChecked}/${totalFiles})${ANSICode.reset}`
        )
      }

      logs.push('')
    }

    logs.push(`${phase.color}[${phase.icon}] ${phase.name} phase completed${ANSICode.reset}`)
    logs.push('')
  }

  // Summary
  logs.push(
    `${ANSICode.red}╔══════════════════════════════════════════════════════════════╗${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.red}║${ANSICode.reset}                  ${ANSICode.green}Security Check Summary${ANSICode.reset}                   ${ANSICode.red}║${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.red}╚══════════════════════════════════════════════════════════════╝${ANSICode.reset}`
  )
  logs.push('')
  logs.push(`${ANSICode.gray}[SUMMARY] Total files scanned: ${totalFiles}${ANSICode.reset}`)
  logs.push(
    `${ANSICode.gray}[SUMMARY] Check duration: ${Math.floor(Math.random() * 5 + 2)}.${Math.floor(Math.random() * 99)}s${ANSICode.reset}`
  )
  logs.push(`${ANSICode.gray}[SUMMARY] Security level: 4 (Maximum)${ANSICode.reset}`)
  logs.push(
    `${ANSICode.gray}[SUMMARY] Threat database version: ${new Date().toISOString().split('T')[0]}${ANSICode.reset}`
  )
  logs.push('')
  logs.push(
    `${ANSICode.green}████████████████████████████████████████████████████████████████${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.green}█${ANSICode.reset}                                                        ${ANSICode.green}█${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.green}█${ANSICode.reset}  ${ANSICode.green}SYSTEM SECURE - All checks passed successfully${ANSICode.reset}           ${ANSICode.green}█${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.green}█${ANSICode.reset}                                                        ${ANSICode.green}█${ANSICode.reset}`
  )
  logs.push(
    `${ANSICode.green}████████████████████████████████████████████████████████████████${ANSICode.reset}`
  )
  logs.push('')

  return logs
}

/**
 * Generate a random 32-character hex checksum.
 */
function generateChecksum(): string {
  const chars = '0123456789abcdef'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * 16)]).join('')
}
