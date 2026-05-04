import type { PhaseConfig, PenetrationPhase } from '../types'
import { reconPhase } from './recon'
import { vulnscanPhase } from './vulnscan'
import { exploitPhase } from './exploit'
import { privescPhase } from './privesc'
import { persistPhase } from './persist'
import { exfilPhase } from './exfil'

export const ALL_PHASES: PhaseConfig[] = [
  reconPhase,
  vulnscanPhase,
  exploitPhase,
  privescPhase,
  persistPhase,
  exfilPhase,
]

export function getPhase(id: PenetrationPhase): PhaseConfig | undefined {
  return ALL_PHASES.find((p) => p.id === id)
}
