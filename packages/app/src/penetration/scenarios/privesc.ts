import type { PhaseConfig, VariablePool } from '../types'
import { typeLines, typeWithDelay, success, error, info, warning, header, sleep } from '../output'
import { accessDeniedEffect } from '../effects'
import { randomInt, generateRandomHash } from '../randomizer'

export const privescPhase: PhaseConfig = {
  id: 'privesc',
  name: '权限提升',
  description: '本地提权获取 root 权限',
  prompt: 'privesc> ',
  availableCommands: ['whoami', 'id', 'uname', 'sudo', 'find suid', 'linpeas', 'dirty-pipe'],
  requiredActions: ['enum_system', 'privesc_execute'],
  completedActions: [],

  async onEnter(vars: VariablePool, _write: (t: string) => void, writeln: (t: string) => void) {
    writeln('')
    writeln(header('阶段 4/6: 权限提升'))
    writeln('')
    writeln(info(`当前权限: ${vars.currentAccess}`))
    writeln(info(`目标: 提升至 root 权限`))
    writeln('')
    writeln(warning('使用系统枚举工具收集提权线索'))
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
    if (cmd === 'whoami') {
      await sleep(300)
      writeln('www-data')
    } else if (cmd === 'id') {
      await sleep(300)
      writeln('uid=33(www-data) gid=33(www-data) groups=33(www-data)')
    } else if (cmd === 'uname') {
      await sleep(300)
      writeln(
        'Linux scp-server-017 5.15.0-58-generic #64-Ubuntu SMP Fri Jul 7 20:16:44 UTC 2023 x86_64 GNU/Linux'
      )
      completeAction('enum_system')
    } else if (cmd === 'find') {
      await typeWithDelay('正在搜索 SUID 文件...', write, 2000)
      const suidFiles = [
        '/usr/bin/passwd',
        '/usr/bin/sudo',
        '/usr/bin/su',
        '/usr/bin/newgrp',
        '/usr/bin/gpasswd',
        '/usr/bin/chsh',
        '/usr/bin/chfn',
        '/usr/bin/mount',
        '/usr/bin/umount',
        '/usr/bin/pkexec',
        '/usr/lib/openssh/ssh-keysign',
        '/usr/lib/dbus-1.0/dbus-daemon-launch-helper',
      ]
      for (const f of suidFiles) {
        writeln(
          `-rwsr-xr-x 1 root root ${randomInt(30000, 150000)} ${new Date().getFullYear() - randomInt(0, 3)}-0${randomInt(1, 9)}-0${randomInt(1, 9)} ${f}`
        )
        await sleep(50)
      }
      writeln('')
      writeln(warning('发现 pkexec SUID - 可能存在 CVE-2021-4034 (PwnKit)'))
      completeAction('enum_system')
    } else if (cmd === 'sudo') {
      if (args[0] === '-l') {
        await sleep(500)
        writeln('Matching Defaults entries for www-data on scp-server-017:')
        writeln(
          '    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin'
        )
        writeln('')
        writeln('User www-data may run the following commands on scp-server-017:')
        writeln('    (ALL : ALL) NOPASSWD: /usr/bin/find')
        writeln('    (root) NOPASSWD: /opt/scp/backup.sh')
        writeln('')
        writeln(success('发现 sudo 配置漏洞！find 命令可无密码以 root 执行'))
        completeAction('enum_system')
      } else {
        writeln(error('用法: sudo -l'))
      }
    } else if (cmd === 'linpeas') {
      await typeWithDelay('正在运行 LinPEAS 枚举脚本...', write, 5000)
      const lines = [
        '',
        '\x1b[36m═══════════════════════════════════════════════════════\x1b[0m',
        '\x1b[36m                  LinPEAS v4.2.1                      \x1b[0m',
        '\x1b[36m═══════════════════════════════════════════════════════\x1b[0m',
        '',
        '\x1b[33m[+] Kernel:\x1b[0m Linux 5.15.0-58-generic',
        '\x1b[33m[+] OS:\x1b[0m Ubuntu 22.04 LTS (Jammy Jellyfish)',
        '\x1b[33m[+] Arch:\x1b[0m x86_64',
        '',
        '\x1b[32m[+] CVEs potentially applicable:\x1b[0m',
        `\x1b[31m  [CRITICAL] CVE-2022-0847 - Dirty Pipe\x1b[0m`,
        '    Linux kernel >= 5.8, < 5.16.11 / 5.15.25 / 5.10.102',
        '    Current kernel 5.15.0 is VULNERABLE',
        '',
        `\x1b[33m  [HIGH] CVE-2021-4034 - PwnKit\x1b[0m`,
        '    pkexec SUID binary found',
        '',
        '\x1b[32m[+] SUID binaries:\x1b[0m',
        '  /usr/bin/pkexec',
        '  /usr/bin/sudo',
        '  /usr/bin/su',
        '',
        '\x1b[32m[+] Writable paths:\x1b[0m',
        '  /tmp',
        '  /var/tmp',
        `  /tmp/.scp_${generateRandomHash(6)}`,
        '',
        '\x1b[32m[+] Interesting files:\x1b[0m',
        '  /etc/shadow - readable',
        '  /opt/scp/backup.sh - writable (sudo)',
        '',
        '\x1b[33m[+] Recommendation: Use CVE-2022-0847 (Dirty Pipe) for privilege escalation\x1b[0m',
        '',
      ]
      await typeLines(lines, write, writeln)
      completeAction('enum_system')
    } else if (cmd === 'dirty-pipe' || cmd === 'CVE-2022-0847') {
      await typeWithDelay('正在编译 Dirty Pipe 提权 exploit...', write, 2000)
      writeln('')
      writeln('\x1b[90mgcc -o /tmp/dpipe /tmp/dirty-pipe.c\x1b[0m')
      await sleep(500)
      writeln('\x1b[90mchmod +x /tmp/dpipe\x1b[0m')
      await sleep(300)
      writeln('')
      await typeWithDelay('正在执行 Dirty Pipe exploit...', write, 1500)
      await accessDeniedEffect(writeln)
      await sleep(1000)
      writeln('')
      const lines = [
        '\x1b[90m[*]\x1b[0m Pipe page cache overwrite...',
        '\x1b[90m[*]\x1b[0m Target: /etc/passwd',
        '\x1b[90m[*]\x1b[0m Overwriting UID 0 entry...',
        '\x1b[32m[+]\x1b[0m \x1b[32mPipe buffer flag overwrite successful\x1b[0m',
        '\x1b[32m[+]\x1b[0m \x1b[32mRoot shell obtained\x1b[0m',
        '',
        '\x1b[32m# whoami\x1b[0m',
        '\x1b[32mroot\x1b[0m',
        '',
        '\x1b[32m# id\x1b[0m',
        'uid=0(root) gid=0(root) groups=0(root)',
        '',
      ]
      await typeLines(lines, write, writeln)
      vars.currentAccess = 'root'
      completeAction('privesc_execute')
      writeln(success('权限提升成功！已获得 root 权限'))
    } else {
      writeln(warning(`未知命令: ${cmd}`))
      writeln(
        info('可用命令: whoami, id, uname -a, sudo -l, find / -perm -4000, linpeas, dirty-pipe')
      )
    }
  },
}
