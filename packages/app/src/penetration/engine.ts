import type { PenetrationPhase, VariablePool, SessionState, PhaseConfig } from './types'

export class PenetrationEngine {
  private state: SessionState
  private phases: Map<PenetrationPhase, PhaseConfig>
  private phaseOrder: PenetrationPhase[] = [
    'recon',
    'vulnscan',
    'exploit',
    'privesc',
    'persist',
    'exfil',
  ]

  constructor() {
    this.state = {
      active: false,
      currentPhase: 'recon',
      variables: this.createDefaultVariables(),
      completedPhases: [],
      startTime: 0,
    }
    this.phases = new Map()
  }

  private createDefaultVariables(): VariablePool {
    const subnet = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`
    return {
      targetIP: `${subnet}.100`,
      targetHostname: 'scp-server-017.foundation.local',
      openPorts: [],
      vulnerabilities: [],
      credentials: [],
      currentAccess: 'none',
      tempDir: `/tmp/.scp_${Date.now().toString(36)}`,
      sessionId: `OP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    }
  }

  registerPhase(config: PhaseConfig): void {
    this.phases.set(config.id, config)
  }

  async start(write: (t: string) => void, writeln: (t: string) => void): Promise<void> {
    this.state.active = true
    this.state.startTime = Date.now()
    this.state.currentPhase = 'recon'
    this.state.completedPhases = []
    this.state.variables = this.createDefaultVariables()

    const phase = this.phases.get('recon')
    if (phase?.onEnter) {
      await phase.onEnter(this.state.variables, write, writeln)
    }
  }

  async handleCommand(
    cmd: string,
    args: string[],
    write: (t: string) => void,
    writeln: (t: string) => void
  ): Promise<void> {
    if (!this.state.active) return

    if (cmd === 'exit' || cmd === 'abort') {
      await this.terminate(writeln)
      return
    }

    if (cmd === 'phase') {
      this.showPhaseInfo(writeln)
      return
    }

    if (cmd === 'help') {
      this.showHelp(writeln)
      return
    }

    const phase = this.phases.get(this.state.currentPhase)
    if (!phase) return

    const completeAction = (action: string) => {
      if (!phase.completedActions.includes(action)) {
        phase.completedActions.push(action)
      }
      this.checkPhaseCompletion(write, writeln)
    }

    await phase.handleCommand(cmd, args, this.state.variables, write, writeln, completeAction)
  }

  private showPhaseInfo(writeln: (t: string) => void): void {
    const phase = this.phases.get(this.state.currentPhase)
    if (!phase) return

    const phaseIndex = this.phaseOrder.indexOf(this.state.currentPhase)
    const totalPhases = this.phaseOrder.length
    const progress = Math.round(
      ((phaseIndex + phase.completedActions.length / Math.max(phase.requiredActions.length, 1)) /
        totalPhases) *
        100
    )

    writeln(`\x1b[36m━━━ 阶段信息 ━━━\x1b[0m`)
    writeln(`\x1b[33m当前阶段:\x1b[0m ${phase.name}`)
    writeln(`\x1b[33m描述:\x1b[0m ${phase.description}`)
    writeln(`\x1b[33m总进度:\x1b[0m ${progress}%`)
    writeln(
      `\x1b[33m已完成操作:\x1b[0m ${phase.completedActions.length}/${phase.requiredActions.length}`
    )
    if (phase.completedActions.length < phase.requiredActions.length) {
      const remaining = phase.requiredActions.filter((a) => !phase.completedActions.includes(a))
      writeln(`\x1b[33m待完成:\x1b[0m ${remaining.join(', ')}`)
    }
    writeln('')
  }

  private showHelp(writeln: (t: string) => void): void {
    const phase = this.phases.get(this.state.currentPhase)
    if (!phase) return

    writeln(`\x1b[36m━━━ 可用命令 ━━━\x1b[0m`)
    writeln(`\x1b[33m通用:\x1b[0m  help | phase | exit | abort`)
    writeln(`\x1b[33m当前阶段:\x1b[0m ${phase.availableCommands.join(' | ')}`)
    writeln('')
  }

  private async checkPhaseCompletion(
    write: (t: string) => void,
    writeln: (t: string) => void
  ): Promise<void> {
    const phase = this.phases.get(this.state.currentPhase)
    if (!phase) return

    const allCompleted = phase.requiredActions.every((a) => phase.completedActions.includes(a))
    if (!allCompleted) return

    this.state.completedPhases.push(this.state.currentPhase)

    const currentIndex = this.phaseOrder.indexOf(this.state.currentPhase)
    if (currentIndex >= this.phaseOrder.length - 1) {
      await this.completeMission(write, writeln)
      return
    }

    const nextPhaseId = this.phaseOrder[currentIndex + 1]
    this.state.currentPhase = nextPhaseId

    const nextPhase = this.phases.get(nextPhaseId)
    if (nextPhase) {
      nextPhase.completedActions = []
      writeln('')
      writeln(`\x1b[32m━━━ 阶段转换 ━━━\x1b[0m`)
      writeln(`\x1b[32m${phase.name} → ${nextPhase.name}\x1b[0m`)
      writeln('')
      if (nextPhase.onEnter) {
        await nextPhase.onEnter(this.state.variables, write, writeln)
      }
    }
  }

  private async completeMission(
    _write: (t: string) => void,
    writeln: (t: string) => void
  ): Promise<void> {
    const duration = Math.round((Date.now() - this.state.startTime) / 1000)
    const mins = Math.floor(duration / 60)
    const secs = duration % 60

    writeln('')
    writeln(`\x1b[32m╔══════════════════════════════════════════╗\x1b[0m`)
    writeln(`\x1b[32m║     任务完成 - 渗透测试报告              ║\x1b[0m`)
    writeln(`\x1b[32m╚══════════════════════════════════════════╝\x1b[0m`)
    writeln(`\x1b[33m会话ID:\x1b[0m ${this.state.variables.sessionId}`)
    writeln(
      `\x1b[33m目标:\x1b[0m ${this.state.variables.targetIP} (${this.state.variables.targetHostname})`
    )
    writeln(`\x1b[33m耗时:\x1b[0m ${mins}m ${secs}s`)
    writeln(`\x1b[33m获得权限:\x1b[0m ${this.state.variables.currentAccess}`)
    writeln(`\x1b[33m提取凭证:\x1b[0m ${this.state.variables.credentials.length} 条`)
    writeln(`\x1b[33m完成阶段:\x1b[0m ${this.state.completedPhases.length}/6`)
    writeln('')
    this.state.active = false
  }

  private async terminate(writeln: (t: string) => void): Promise<void> {
    writeln('')
    writeln(`\x1b[31m[!] 渗透会话已终止\x1b[0m`)
    writeln(`\x1b[31m[!] 会话 ${this.state.variables.sessionId} 已中止，所有连接已断开\x1b[0m`)
    writeln('')
    this.state.active = false
  }

  isActive(): boolean {
    return this.state.active
  }

  getVariables(): VariablePool {
    return this.state.variables
  }

  getCurrentPhase(): PenetrationPhase {
    return this.state.currentPhase
  }

  reset(): void {
    this.state = {
      active: false,
      currentPhase: 'recon',
      variables: this.createDefaultVariables(),
      completedPhases: [],
      startTime: 0,
    }
    this.phases.forEach((p) => {
      p.completedActions = []
    })
  }
}
