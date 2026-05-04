import type { ToolTemplateResult, VulnerabilityInfo } from '../types'
import { randomInt, randomChoice, generateRandomHash, getToolDelay } from '../randomizer'

const R = '\x1b[0m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'
const BOLD = '\x1b[1m'

const DATABASE_NAMES = [
  'information_schema',
  'mysql',
  'performance_schema',
  'sys',
  'scp_foundation',
  'personnel_db',
  'containment_records',
  'research_data',
  'security_logs',
  'access_control',
]

const INJECTION_TYPES = [
  { type: 'Boolean-based blind', title: 'AND 2634=2634' },
  { type: 'Time-based blind', title: 'AND SLEEP(5)' },
  { type: 'UNION query', title: 'UNION ALL SELECT NULL,CONCAT(...)--' },
  { type: 'Error-based', title: 'AND EXTRACTVALUE(1,CONCAT(...))' },
  { type: 'Stacked queries', title: '; SELECT SLEEP(5)--' },
]

const PARAMETERS = ['id', 'user', 'page', 'search', 'item', 'category', 'doc']

export function generateSqlmapOutput(targetURL: string): ToolTemplateResult {
  const lines: string[] = []
  const vulnerabilities: VulnerabilityInfo[] = []

  lines.push('')
  lines.push(`        ${CYAN}${BOLD}___${R}`)
  lines.push(
    `       ${CYAN}__H__${R} ${GREEN} ___${R}  ${YELLOW}_____${R} ${GREEN}___${R}  ${YELLOW}___${R}  ${GREEN}___${R}         ${GRAY}__${R}`
  )
  lines.push(
    `      {_____}${R} ${GREEN}|___${R} ${YELLOW}|___ ${R}${GREEN}|___${R} ${YELLOW}|___${R} ${GREEN}|___${R}  |___'  ${GRAY}|___${R}`
  )
  lines.push(
    `       ${CYAN}/  _  \\${R}  ${GRAY}|___${R}  ${GRAY}|___${R}  ${GRAY}|___${R}  ${GRAY}|___${R}  ${GRAY}|___${R}  ${GRAY}|___${R}`
  )
  lines.push(
    `      ${CYAN}| / \\ |${R}  ${YELLOW}___${R}  ${YELLOW}___${R}  ${YELLOW}___${R}  ${YELLOW}___${R}  ${YELLOW}___${R}  ${YELLOW}___${R}`
  )
  lines.push(
    `      ${CYAN}| \\_/ |${R}  ${GRAY}|___${R} ${GRAY}|___${R} ${GRAY}|___${R} ${GRAY}|___${R} ${GRAY}|___${R} ${GRAY}|___${R}`
  )
  lines.push(
    `      ${CYAN}||___||${R}  ${GREEN}${randomChoice(['v1.7.12', 'v1.7.10', 'v1.8.0'])}${R}  ${GRAY}#stable${R}`
  )
  lines.push(`      ${CYAN}\\_____/${R}`)
  lines.push('')

  lines.push(
    `${GRAY}[*]${R} starting @ ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`
  )
  lines.push('')

  lines.push(`${GRAY}[*]${R} testing connection to the target URL`)
  lines.push(`${GRAY}[*]${R} testing if the target URL content is stable`)
  lines.push(`${GREEN}[+]${R} target URL content is stable`)
  lines.push('')

  lines.push(`${GRAY}[*]${R} testing SQL injection on parameter '${randomChoice(PARAMETERS)}'`)
  lines.push(`${GRAY}[*]${R} testing 'AND boolean-based blind - WHERE or HAVING clause'`)
  lines.push(`${GRAY}[*]${R} testing 'Boolean-based blind - Parameter replace'`)
  lines.push(`${GRAY}[*]${R} testing 'MySQL >= 5.0.12 AND time-based blind'`)
  lines.push('')

  const injection = randomChoice(INJECTION_TYPES)
  const param = randomChoice(PARAMETERS)

  lines.push(
    `${GREEN}${BOLD}[+]${R} ${GREEN}${param} parameter appears to be '${injection.type}' injectable`
  )
  lines.push(`    Payload: ${param}=${YELLOW}${injection.title}${R}`)
  lines.push('')

  lines.push(`${GRAY}[*]${R} testing 'Generic UNION query (NULL) - 1 to 20 columns'`)
  lines.push(`${GREEN}[+]${R} '${param}' is 'UNION query' injectable`)
  lines.push(
    `    ${GRAY}-- [${R}${GREEN}START${R}${GRAY}]${R} ${targetURL}?${param}=1 ${YELLOW}UNION ALL SELECT NULL,NULL,NULL--${R}`
  )
  lines.push('')

  lines.push(`${CYAN}${BOLD}back-end DBMS:${R} ${GREEN}MySQL >= 5.6${R}`)
  lines.push(`${GRAY}[*]${R} fingerprinting the back-end DBMS`)
  lines.push(`${GREEN}[+]${R} back-end DBMS: ${GREEN}MySQL >= 5.6 (MariaDB fork detected)${R}`)
  lines.push('')

  lines.push(`${CYAN}${BOLD}available databases [${DATABASE_NAMES.length}]:${R}`)

  const shuffled = [...DATABASE_NAMES].sort(() => Math.random() - 0.5)
  for (const db of shuffled) {
    lines.push(`  [${randomInt(1, 9)}] ${GREEN}${db}${R}`)
  }

  lines.push('')

  const tableCount = randomInt(3, 8)
  const selectedDB = randomChoice(['scp_foundation', 'personnel_db', 'containment_records'])
  lines.push(`${GRAY}[*]${R} fetching tables for database '${GREEN}${selectedDB}${R}'`)
  lines.push(`${CYAN}${BOLD}Database: ${selectedDB}${R}`)
  lines.push(`${randomInt(3, 12)} tables`)
  lines.push('')

  const tableNames = [
    'users',
    'sessions',
    'access_logs',
    'personnel',
    'documents',
    'containment_cells',
    'scp_items',
    'incident_reports',
    'auth_tokens',
    'clearance_levels',
    'research_projects',
    'audit_trail',
  ]
  const selectedTables = tableNames.sort(() => Math.random() - 0.5).slice(0, tableCount)
  for (const t of selectedTables) {
    lines.push(`  [${randomInt(1, 9)}] ${GREEN}${t}${R}`)
  }

  lines.push('')

  vulnerabilities.push({
    cve: 'SQLI-' + generateRandomHash(8).toUpperCase(),
    severity: 'critical',
    service: 'mysql',
    port: 3306,
    description: `SQL injection in parameter '${param}' (${injection.type})`,
    exploitable: true,
  })

  lines.push(
    `${GRAY}[*]${R} ending @ ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`
  )
  lines.push('')

  return {
    lines,
    delay: getToolDelay('sqlmap'),
    variables: {
      vulnerabilities,
    },
  }
}
