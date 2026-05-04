export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

export function generateRandomMAC(): string {
  const hex = () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`
}

export function generateRandomHash(length: number = 32): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function generateRandomIP(): string {
  return `${randomInt(1, 254)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
}

export function getToolDelay(tool: string): number {
  const delays: Record<string, [number, number]> = {
    nmap: [3000, 8000],
    nikto: [4000, 10000],
    sqlmap: [3000, 7000],
    msfconsole: [2000, 5000],
    mimikatz: [1000, 3000],
    whois: [1000, 3000],
    dig: [500, 1500],
    curl: [500, 2000],
    netcat: [500, 1500],
    default: [1000, 3000],
  }
  const [min, max] = delays[tool] || delays.default
  return randomInt(min, max)
}

export function getLineDelay(): number {
  return randomInt(20, 80)
}

export function shouldInsertFalsePositive(): boolean {
  return Math.random() < 0.1
}

export function shouldTriggerGlitch(): boolean {
  return Math.random() < 0.3
}

export function generateFakePort(): { port: number; service: string; state: string } {
  const fakePorts = [
    { port: 25, service: 'smtp', state: 'filtered' },
    { port: 110, service: 'pop3', state: 'filtered' },
    { port: 143, service: 'imap', state: 'filtered' },
    { port: 993, service: 'imaps', state: 'filtered' },
    { port: 3306, service: 'mysql', state: 'filtered' },
    { port: 5432, service: 'postgresql', state: 'filtered' },
    { port: 6379, service: 'redis', state: 'filtered' },
    { port: 27017, service: 'mongodb', state: 'filtered' },
  ]
  return randomChoice(fakePorts)
}
