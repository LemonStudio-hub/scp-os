import { getLineDelay } from './randomizer'

export async function typeLines(
  lines: string[],
  _write: (t: string) => void,
  writeln: (t: string) => void,
  options?: {
    lineDelay?: number
    skipEmpty?: boolean
  }
): Promise<void> {
  for (const line of lines) {
    writeln(line)
    if (options?.skipEmpty && line === '') {
      continue
    }
    await sleep(options?.lineDelay ?? getLineDelay())
  }
}

export async function typeWithDelay(
  text: string,
  write: (t: string) => void,
  delayMs: number,
  progressChar?: string
): Promise<void> {
  const char = progressChar ?? '.'
  write(text)
  const interval = 500
  let waited = 0
  while (waited < delayMs) {
    const remaining = delayMs - waited
    const wait = Math.min(interval, remaining)
    await sleep(wait)
    waited += wait
    if (waited < delayMs) {
      write(char)
    }
  }
  write('\n')
}

export function colorize(
  text: string,
  color: 'red' | 'green' | 'yellow' | 'cyan' | 'gray' | 'bold' | 'dim'
): string {
  const codes = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
  }
  return `${codes[color]}${text}\x1b[0m`
}

export function success(text: string): string {
  return `\x1b[32m[+]\x1b[0m ${text}`
}

export function error(text: string): string {
  return `\x1b[31m[!]\x1b[0m ${text}`
}

export function info(text: string): string {
  return `\x1b[36m[*]\x1b[0m ${text}`
}

export function warning(text: string): string {
  return `\x1b[33m[-]\x1b[0m ${text}`
}

export function dim(text: string): string {
  return `\x1b[90m${text}\x1b[0m`
}

export function header(title: string, width: number = 50): string {
  const pad = Math.max(0, width - title.length - 4)
  const leftPad = Math.floor(pad / 2)
  const rightPad = pad - leftPad
  return `\x1b[36m${'═'.repeat(leftPad + 2)} ${title} ${'═'.repeat(rightPad + 2)}\x1b[0m`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
