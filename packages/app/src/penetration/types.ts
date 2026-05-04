export type PenetrationPhase = 'recon' | 'vulnscan' | 'exploit' | 'privesc' | 'persist' | 'exfil'

export interface VariablePool {
  targetIP: string
  targetHostname: string
  openPorts: PortInfo[]
  vulnerabilities: VulnerabilityInfo[]
  credentials: CredentialInfo[]
  currentAccess: 'none' | 'user' | 'root'
  tempDir: string
  sessionId: string
  [key: string]: unknown
}

export interface PortInfo {
  port: number
  protocol: 'tcp' | 'udp'
  service: string
  version: string
  state: 'open' | 'filtered' | 'closed'
}

export interface VulnerabilityInfo {
  cve: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  service: string
  port: number
  description: string
  exploitable: boolean
}

export interface CredentialInfo {
  username: string
  password?: string
  hash?: string
  domain?: string
  type: 'plaintext' | 'ntlm' | 'kerberos' | 'ssh-key'
}

export interface PhaseConfig {
  id: PenetrationPhase
  name: string
  description: string
  prompt: string
  availableCommands: string[]
  requiredActions: string[]
  completedActions: string[]
  onEnter?: (
    vars: VariablePool,
    write: (t: string) => void,
    writeln: (t: string) => void
  ) => Promise<void>
  handleCommand: (
    cmd: string,
    args: string[],
    vars: VariablePool,
    write: (t: string) => void,
    writeln: (t: string) => void,
    completeAction: (action: string) => void
  ) => Promise<void>
}

export interface SessionState {
  active: boolean
  currentPhase: PenetrationPhase
  variables: VariablePool
  completedPhases: PenetrationPhase[]
  startTime: number
}

export interface ToolTemplateResult {
  lines: string[]
  delay: number
  variables?: Partial<VariablePool>
  completeActions?: string[]
  triggerGlitch?: boolean
}
