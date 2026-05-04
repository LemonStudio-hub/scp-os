import { sleep } from './output'
import { randomInt, randomChoice } from './randomizer'

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▄▀■□▪▫'

export async function glitchEffect(
  _write: (t: string) => void,
  writeln: (t: string) => void,
  duration?: number
): Promise<void> {
  const totalDuration = duration ?? randomInt(500, 2000)
  const lineCount = randomInt(3, 8)
  const startTime = Date.now()

  for (let i = 0; i < lineCount; i++) {
    if (Date.now() - startTime >= totalDuration) break
    const width = randomInt(40, 80)
    writeln(generateGlitchLine(width))
    await sleep(randomInt(30, 80))
  }

  writeln('')
  writeln('\x1b[32m[SYSTEM] Signal restored\x1b[0m')
}

export async function connectionLostEffect(
  _write: (t: string) => void,
  writeln: (t: string) => void
): Promise<void> {
  writeln('\x1b[90mTransferring data packet #2847...\x1b[0m')
  await sleep(randomInt(200, 500))
  writeln('\x1b[90mTransferring data packet #2848...\x1b[0m')
  await sleep(randomInt(200, 500))
  writeln('\x1b[90mTransferring data packet #2849...\x1b[0m')
  await sleep(randomInt(300, 600))
  writeln('')
  writeln('\x1b[5m\x1b[31mCONNECTION LOST\x1b[0m')
  await sleep(randomInt(1000, 2000))
  writeln('')
  writeln('\x1b[32mCONNECTION RESTORED\x1b[0m')
}

export async function accessDeniedEffect(writeln: (t: string) => void): Promise<void> {
  const banner = '  ACCESS DENIED  '
  const border = '═'.repeat(banner.length)
  writeln(`\x1b[5m\x1b[31m╔${border}╗\x1b[0m`)
  writeln(`\x1b[5m\x1b[31m║${banner}║\x1b[0m`)
  writeln(`\x1b[5m\x1b[31m╚${border}╝\x1b[0m`)
  await sleep(1000)
  writeln('')
  writeln('\x1b[32m[+] Bypassing security...\x1b[0m')
}

function generateGlitchLine(width: number): string {
  let line = ''
  for (let i = 0; i < width; i++) {
    if (Math.random() < 0.3) {
      const colors = ['\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[35m', '\x1b[36m']
      line +=
        randomChoice(colors) +
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] +
        '\x1b[0m'
    } else {
      line += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    }
  }
  return line
}
