import type { ToolTemplateResult, CredentialInfo } from '../types'
import { randomInt, generateRandomHash, getToolDelay } from '../randomizer'

const R = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'

export function generateMimikatzOutput(): ToolTemplateResult {
  const lines: string[] = []
  const credentials: CredentialInfo[] = []

  lines.push('')
  lines.push(`  ${CYAN}.#####.${R}   ${GREEN}mimikatz 2.2.0 (x64) #18362${R}`)
  lines.push(` ${CYAN}.## ^ ##.${R}  ${GREEN}"A La Vie, A L'Amour"${R}`)
  lines.push(` ${CYAN}## / \\ ##${R}  ${GRAY}/* * */${R}`)
  lines.push(` ${CYAN}## \\ / ##${R}   ${YELLOW}Benjamin DELPY (gentilkiwi)${R}`)
  lines.push(` ${CYAN}'## v ##'${R}   ${YELLOW}https://blog.gentilkiwi.com/mimikatz${R}`)
  lines.push(`  ${CYAN}'#####'${R}    ${GRAY}Vincent LE TOUX (vincentletoux)${R}`)
  lines.push(`            ${GRAY}/* * */${R}`)
  lines.push('')

  lines.push(`${CYAN}mimikatz #${R} privilege::debug`)
  lines.push(`${GREEN}Privilege '20' OK${R}`)
  lines.push('')

  lines.push(`${CYAN}mimikatz #${R} sekurlsa::logonpasswords`)
  lines.push('')

  const users = [
    { username: 'Administrator', domain: 'FOUNDATION', rid: 500 },
    { username: 'svc_backup', domain: 'FOUNDATION', rid: 1104 },
    { username: 'jdoe', domain: 'FOUNDATION', rid: 1108 },
  ]

  for (const user of users) {
    const ntlm = generateRandomHash(32)
    const sha1 = generateRandomHash(40)

    lines.push(
      `${CYAN}Authentication Id :${R} 0 ; ${randomInt(100000, 999999)} (00000000:0${randomInt(10000, 99999).toString(16)})`
    )
    lines.push(
      `${CYAN}Session           :${R} ${user.rid === 500 ? 'Interactive from' : 'Network from'} ${randomInt(1, 9)}`
    )
    lines.push(`${CYAN}User Name         :${R} ${GREEN}${user.username}${R}`)
    lines.push(`${CYAN}Domain            :${R} ${GREEN}${user.domain}${R}`)
    lines.push(
      `${CYAN}Logon Time        :${R} ${new Date(Date.now() - randomInt(60000, 3600000)).toISOString().replace('T', ' ').substring(0, 19)}`
    )
    lines.push(
      `${CYAN}SID               :${R} S-1-5-21-${randomInt(1000000000, 9999999999)}-${randomInt(1000000000, 9999999999)}-${randomInt(1000000000, 9999999999)}-${user.rid}`
    )
    lines.push(`        ${CYAN}msv :${R}`)
    lines.push(`        ${GRAY}[00000003] Primary${R}`)
    lines.push(`        ${GRAY}* Username :${R} ${GREEN}${user.username}${R}`)
    lines.push(`        ${GRAY}* Domain   :${R} ${GREEN}${user.domain}${R}`)
    lines.push(`        ${GRAY}* NTLM     :${R} ${YELLOW}${ntlm}${R}`)
    lines.push(`        ${GRAY}* SHA1     :${R} ${YELLOW}${sha1}${R}`)
    lines.push(`        ${CYAN}tspkg :${R}`)
    lines.push(`        ${GRAY}* Username :${R} ${GREEN}${user.username}${R}`)
    lines.push(`        ${GRAY}* Domain   :${R} ${GREEN}${user.domain}${R}`)
    lines.push(`        ${GRAY}* Password :${R} ${RED}(null)${R}`)
    lines.push(`        ${CYAN}wdigest :${R}`)
    lines.push(`        ${GRAY}* Username :${R} ${GREEN}${user.username}${R}`)
    lines.push(`        ${GRAY}* Domain   :${R} ${GREEN}${user.domain}${R}`)
    lines.push(`        ${GRAY}* Password :${R} ${RED}(null)${R}`)
    lines.push(`        ${CYAN}kerberos :${R}`)
    lines.push(`        ${GRAY}* Username :${R} ${GREEN}${user.username}${R}`)
    lines.push(`        ${GRAY}* Domain   :${R} ${GREEN}${user.domain}.LOCAL${R}`)
    lines.push(`        ${GRAY}* Password :${R} ${RED}(null)${R}`)
    lines.push('')

    credentials.push({
      username: user.username,
      hash: ntlm,
      domain: user.domain,
      type: 'ntlm',
    })
  }

  lines.push(`${CYAN}mimikatz #${R}`)
  lines.push('')

  return {
    lines,
    delay: getToolDelay('mimikatz'),
    variables: {
      credentials,
    },
  }
}
