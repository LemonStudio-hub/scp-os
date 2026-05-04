import type { CommandHandler } from '../types/command'
import { PenetrationEngine } from '../penetration/engine'
import { ALL_PHASES } from '../penetration/scenarios'
import { ANSICode } from '../constants/theme'

type SessionStage = 'idle' | 'confirming' | 'active'

let engine: PenetrationEngine | null = null
let stage: SessionStage = 'idle'

export const penetrationHandler: CommandHandler = async (args, write, writeln) => {
  if (stage === 'idle') {
    stage = 'confirming'
    writeln(`${ANSICode.red}═════════════════════════════════════════════${ANSICode.reset}`)
    writeln(`${ANSICode.red}SCP FOUNDATION - AUTHORIZED PENETRATION TEST${ANSICode.reset}`)
    writeln(`${ANSICode.red}═════════════════════════════════════════════${ANSICode.reset}`)
    writeln(
      `${ANSICode.yellow}[!] This session is authorized under Protocol Omega-7${ANSICode.reset}`
    )
    writeln(`${ANSICode.yellow}[!] All activities are monitored and logged${ANSICode.reset}`)
    writeln(
      `${ANSICode.yellow}[!] Unauthorized access will be terminated immediately${ANSICode.reset}`
    )
    writeln('')
    writeln(`Type 'confirm' to proceed or 'abort' to cancel:`)
    return
  }

  if (stage === 'confirming') {
    const input = args[0]?.toLowerCase() || ''
    if (input === 'confirm') {
      engine = new PenetrationEngine()
      for (const phase of ALL_PHASES) {
        engine.registerPhase(phase)
      }
      stage = 'active'
      await engine.start(write, writeln)
      const vars = engine.getVariables()
      writeln('')
      writeln(`${ANSICode.cyan}━━━ 目标简报 ━━━${ANSICode.reset}`)
      writeln(`${ANSICode.green}目标主机:${ANSICode.reset} ${vars.targetHostname}`)
      writeln(`${ANSICode.green}目标IP:${ANSICode.reset}   ${vars.targetIP}`)
      writeln(`${ANSICode.green}会话ID:${ANSICode.reset}   ${vars.sessionId}`)
      writeln('')
      writeln(`${ANSICode.gray}输入 'help' 查看可用命令，'phase' 查看阶段信息${ANSICode.reset}`)
      writeln('')
      return
    }
    if (input === 'abort') {
      stage = 'idle'
      writeln(`${ANSICode.red}渗透测试会话已取消${ANSICode.reset}`)
      writeln('')
      return
    }
    writeln(`${ANSICode.yellow}请输入 'confirm' 继续或 'abort' 取消${ANSICode.reset}`)
    return
  }

  if (stage === 'active' && engine) {
    const cmd = args[0] || ''
    const cmdArgs = args.slice(1)
    await engine.handleCommand(cmd, cmdArgs, write, writeln)
    if (!engine.isActive()) {
      stage = 'idle'
      engine = null
    }
  }
}
