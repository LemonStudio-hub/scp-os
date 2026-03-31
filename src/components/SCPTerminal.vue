<template>
  <div id="terminal-container" ref="terminalContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import Hammer from 'hammerjs'

const terminalContainer = ref<HTMLDivElement>()
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let hammer: HammerManager | null = null

const availableCommands = [
  'help', 'status', 'clear', 'cls', 'containment', 'scp-list', 'info',
  'protocol', 'emergency', 'logout', 'version', 'about', 'search'
]

const commandHistory: string[] = []
let historyIndex = -1
let currentInput = ''

onMounted(async () => {
  initTerminal()
  initGestures()
  await displayBootLog()
  displayWelcomeMessage()
  setupCommandHandler()
})

onBeforeUnmount(() => {
  if (terminal) {
    terminal.dispose()
  }
  if (hammer) {
    hammer.destroy()
  }
})

const initTerminal = () => {
  terminal = new Terminal({
    theme: {
      background: '#0a0a0a',
      foreground: '#e0e0e0',
      cursor: '#00ff00',
      cursorAccent: '#00ff00',
      black: '#000000',
      red: '#ff4444',
      green: '#00ff00',
      yellow: '#ffa500',
      blue: '#4169e1',
      magenta: '#ff00ff',
      cyan: '#00ffff',
      white: '#ffffff',
      brightBlack: '#555555',
      brightRed: '#ff6666',
      brightGreen: '#66ff66',
      brightYellow: '#ffff66',
      brightBlue: '#6666ff',
      brightMagenta: '#ff66ff',
      brightCyan: '#66ffff',
      brightWhite: '#ffffff'
    },
    fontFamily: 'Courier New, Consolas, monospace',
    fontSize: 14,
    lineHeight: 1.6,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 1000,
    tabStopWidth: 4,
    allowProposedApi: true
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)

  if (terminalContainer.value) {
    terminal.open(terminalContainer.value)
    fitAddon.fit()
    terminal.focus()
  }

  window.addEventListener('resize', () => {
    if (fitAddon) {
      fitAddon.fit()
    }
  })
}

const initGestures = () => {
  if (!terminalContainer.value) return

  hammer = new Hammer(terminalContainer.value)
  
  // Three finger swipe up for clear screen
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_UP, pointers: 3 })
  hammer.on('swipeup', () => {
    if (terminal) {
      terminal.clear()
      terminal.writeln('\x1b[1;32m✓ 屏幕已清空（手势操作）\x1b[0m')
    }
  })

  // Two finger swipe left for history up
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_LEFT, pointers: 2 })
  hammer.on('swipeleft', () => {
    navigateHistory(-1)
  })

  // Two finger swipe right for history down
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_RIGHT, pointers: 2 })
  hammer.on('swiperight', () => {
    navigateHistory(1)
  })

  // Tap to focus
  hammer.on('tap', () => {
    if (terminal) {
      terminal.focus()
    }
  })
}

const displayWelcomeMessage = () => {
  if (!terminal) return

  const lines = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m          SCP 基金会 - 安全控制收容基金会\x1b[0m',
    '\x1b[1;32m       控制收容保护 | Secure Contain Protect\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[1;36m欢迎使用 SCP 基金会终端系统\x1b[0m',
    '\x1b[0;37m系统版本: 3.0.1 | 最后更新: 2026-03-31\x1b[0m',
    '\x1b[0;37m当前位置: Site-19 主服务器\x1b[0m',
    '',
    '\x1b[1;33m输入 "help" 查看可用命令\x1b[0m',
    '\x1b[1;36m手势控制: 三指上滑清屏 | 双指左右滑动查看历史\x1b[0m',
    ''
  ]

  lines.forEach(line => terminal!.writeln(line))
  writePrompt()
}

const writePrompt = () => {
  if (terminal) {
    terminal.write('\x1b[1;31mSCP-ROOT>\x1b[0m ')
  }
}

const setupCommandHandler = () => {
  if (!terminal) return

  // Handle data input (character input)
  terminal!.onData((data) => {
    if (data === '\r') { // Enter
      terminal!.write('\r\n')
      executeCommand()
    } else if (data === '\x1b[A') { // Arrow Up
      navigateHistory(-1)
    } else if (data === '\x1b[B') { // Arrow Down
      navigateHistory(1)
    } else if (data === '\t') { // Tab
      autocomplete()
    } else if (data === '\x7f') { // Backspace
      if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1)
        terminal!.write('\b \b')
      }
    } else if (data === '\x03') { // Ctrl+C
      terminal!.write('^C\r\n')
      currentInput = ''
      writePrompt()
    } else if (data >= ' ' && data <= '~') { // Printable characters
      currentInput += data
      terminal!.write(data)
    }
  })
}

const displayBootLog = async () => {
  if (!terminal) return

  const bootLogs = [
    '\x1b[1;32m[    0.000000] Linux version 6.17.0-PRoot-SCP (scpos@site19) (gcc version 14.2.1)\x1b[0m',
    '\x1b[0;37m[    0.000001] Command line: BOOT_IMAGE=/boot/vmlinuz-6.17.0-PRoot-SCP root=UUID=scp-secure-19 ro quiet\x1b[0m',
    '\x1b[0;33m[    0.000002] x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'\x1b[0m',
    '\x1b[0;33m[    0.000003] x86/fpu: Supporting XSAVE feature 0x002: \'SSE registers\'\x1b[0m',
    '\x1b[0;37m[    0.000004] BIOS-provided physical RAM map:\x1b[0m',
    '\x1b[0;37m[    0.000005] BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable\x1b[0m',
    '\x1b[0;37m[    0.000006] BIOS-e820: [mem 0x00000000000e0000-0x00000000000fffff] reserved\x1b[0m',
    '\x1b[1;32m[    0.000010] Secure Boot: enabled (SCP Foundation Secure Boot)\x1b[0m',
    '\x1b[0;37m[    0.000015] NX (Execute Disable) protection: active\x1b[0m',
    '\x1b[0;37m[    0.000020] SMBIOS 3.4.0 present.\x1b[0m',
    '\x1b[1;32m[    0.000025] DMI: SCP Foundation/Site-19 Mainframe, BIOS 3.0.1 03/31/26 14:30:00\x1b[0m',
    '\x1b[0;33m[    0.000100] ACPI: DSDT 0000000000000000 (v02 SCPF Site19 00001000 SCPF 00000001)\x1b[0m',
    '\x1b[0;37m[    0.000150] ACPI: Using IOAPIC for interrupt routing\x1b[0m',
    '\x1b[1;32m[    0.000200] PCI: Using configuration type 1\x1b[0m',
    '\x1b[0;37m[    0.000250] ACPI: Core revision 20220331\x1b[0m',
    '\x1b[1;33m[    0.000300] SCP-Security: Initializing containment protocols...\x1b[0m',
    '\x1b[1;32m[    0.000350] SCP-Security: Containment protocols loaded successfully\x1b[0m',
    '\x1b[0;37m[    0.000400] clocksource: tsc: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 7645041785499908\x1b[0m',
    '\x1b[0;37m[    0.000450] clocksource: hpet: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 13320449974259208\x1b[0m',
    '\x1b[1;32m[    0.000500] tsc: Detected 4200.000 MHz processor\x1b[0m',
    '\x1b[0;37m[    0.000550] tsc: Detected 2100.000 MHz base frequency\x1b[0m',
    '\x1b[0;37m[    0.000600] Calibrating delay loop (skipped), value calculated using timer frequency.. 8400.00 BogoMIPS (lpj=42000000)\x1b[0m',
    '\x1b[1;32m[    0.000650] pid_max: default: 32768 minimum: 301\x1b[0m',
    '\x1b[0;37m[    0.000700] Mount-cache hash table entries: 8192 (order: 4, 65536 bytes, linear)\x1b[0m',
    '\x1b[0;37m[    0.000750] Mountpoint-cache hash table entries: 8192 (order: 4, 65536 bytes, linear)\x1b[0m',
    '\x1b[1;32m[    0.000800] CPU: 0 PID: 1 Comm: swapper/0 Not tainted 6.17.0-PRoot-SCP #1\x1b[0m',
    '\x1b[0;37m[    0.000850] Hardware name: SCP Foundation Site-19 Mainframe/Site19\x1b[0m',
    '\x1b[0;37m[    0.000900] ACPI: \_OSI (Linux) query successful\x1b[0m',
    '\x1b[1;33m[    0.001000] SCP-Kernel: Loading anomaly detection modules...\x1b[0m',
    '\x1b[1;32m[    0.001100] SCP-Kernel: Anomaly detection modules loaded (4891 anomalies detected)\x1b[0m',
    '\x1b[0;37m[    0.001200] CPU: L1 I cache: 32 KiB\x1b[0m',
    '\x1b[0;37m[    0.001250] CPU: L1 D cache: 32 KiB\x1b[0m',
    '\x1b[0;37m[    0.001300] CPU: L2 cache: 256 KiB\x1b[0m',
    '\x1b[0;37m[    0.001350] CPU: L3 cache: 8192 KiB\x1b[0m',
    '\x1b[0;37m[    0.001400] Freeing SMP alternatives memory: 36K\x1b[0m',
    '\x1b[1;32m[    0.001500] ftrace: allocating 68623 entries in 269 pages\x1b[0m',
    '\x1b[0;37m[    0.001600] random: crng init done\x1b[0m',
    '\x1b[0;37m[    0.001700] random: 7 urandom warning(s) missed due to ratelimiting\x1b[0m',
    '\x1b[1;33m[    0.001800] SCP-Security: Establishing encrypted connection to Foundation Network...\x1b[0m',
    '\x1b[1;32m[    0.002000] SCP-Security: AES-256-GCM encryption established\x1b[0m',
    '\x1b[0;37m[    0.002100] ACPI: Core revision 20220331\x1b[0m',
    '\x1b[1;32m[    0.002200] ACPI: 1 ACPI AML tables successfully loaded and 0 ACPI AML tables failed\x1b[0m',
    '\x1b[0;37m[    0.002300] APIC: Switch to symmetric I/O mode setup\x1b[0m',
    '\x1b[0;37m[    0.002400] IOAPIC[0]: apic_id 0, version 32, address 0xfec00000, GSI 0-23\x1b[0m',
    '\x1b[0;37m[    0.002500] IOAPIC[1]: apic_id 1, version 32, address 0xfec01000, GSI 24-47\x1b[0m',
    '\x1b[1;32m[    0.002600] clocksource: acpi_pm: mask: 0xffffff max_cycles: 0xffffff, max_idle_ns: 2085701024 ns\x1b[0m',
    '\x1b[0;37m[    0.002700] pci 0000:00:00.0: [8086:1234] type 00 class 0x060000\x1b[0m',
    '\x1b[0;37m[    0.002800] pci 0000:00:01.0: [8086:5678] type 00 class 0x060100\x1b[0m',
    '\x1b[0;37m[    0.002900] pci 0000:00:02.0: [8086:9ABC] type 00 class 0x020000\x1b[0m',
    '\x1b[1;33m[    0.003000] SCP-Network: Connecting to Site-19 containment database...\x1b[0m',
    '\x1b[1;32m[    0.003200] SCP-Network: Connection established (latency: 2ms)\x1b[0m',
    '\x1b[0;37m[    0.003300] ACPI: PCI Interrupt Link [LNKA] (IRQs 3 4 5 6 7 10 11 12 14 15) *5\x1b[0m',
    '\x1b[0;37m[    0.003400] ACPI: PCI Interrupt Link [LNKB] (IRQs 3 4 5 6 7 10 11 12 14 15) *7\x1b[0m',
    '\x1b[0;37m[    0.003500] ACPI: PCI Interrupt Link [LNKC] (IRQs 3 4 5 6 7 10 11 12 14 15) *10\x1b[0m',
    '\x1b[1;32m[    0.003600] ACPI: PCI Interrupt Link [LNKD] (IRQs 3 4 5 6 7 10 11 12 14 15) *11\x1b[0m',
    '\x1b[0;37m[    0.003700] vgaarb: device added: PCI:0000:00:02.0,decodes=io+mem,owns=io+mem,locks=none\x1b[0m',
    '\x1b[0;37m[    0.003800] vgaarb: loaded\x1b[0m',
    '\x1b[0;37m[    0.003900] SCSI subsystem initialized\x1b[0m',
    '\x1b[1;32m[    0.004000] libata version 3.00 loaded.\x1b[0m',
    '\x1b[0;37m[    0.004100] ACPI: bus type SATA registered\x1b[0m',
    '\x1b[1;33m[    0.004200] SCP-Storage: Mounting secure storage volumes...\x1b[0m',
    '\x1b[1;32m[    0.004400] SCP-Storage: Volume /scp-secure mounted (AES-256 encrypted)\x1b[0m',
    '\x1b[0;37m[    0.004500] ahci 0000:00:1f.2: version 3.0\x1b[0m',
    '\x1b[0;37m[    0.004600] ata1: SATA max UDMA/133 abar m2048@0xfeb00000 port 0xfeb00100 irq 28\x1b[0m',
    '\x1b[0;37m[    0.004700] ata2: SATA max UDMA/133 abar m2048@0xfeb00000 port 0xfeb00180 irq 28\x1b[0m',
    '\x1b[1;32m[    0.004800] scsi host0: ahci\x1b[0m',
    '\x1b[1;32m[    0.004900] scsi host1: ahci\x1b[0m',
    '\x1b[0;37m[    0.005000] ata1: SATA link up 6.0 Gbps (SStatus 133 SControl 300)\x1b[0m',
    '\x1b[0;37m[    0.005100] ata1.00: ATA-9: SCP-SSD-256G, 3.0.1, max UDMA/133\x1b[0m',
    '\x1b[1;32m[    0.005200] ata1.00: configured for UDMA/133\x1b[0m',
    '\x1b[0;37m[    0.005300] scsi 0:0:0:0: Direct-Access     SCP-SSD-256G  3.0  PQ: 0 ANSI: 6\x1b[0m',
    '\x1b[1;32m[    0.005400] sd 0:0:0:0: [sda] 500118192 512-byte logical blocks: (256 GB/238 GiB)\x1b[0m',
    '\x1b[1;32m[    0.005500] sd 0:0:0:0: [sda] Write Protect is off\x1b[0m',
    '\x1b[0;37m[    0.005600] sd 0:0:0:0: [sda] Mode Sense: 4b 00 00 00\x1b[0m',
    '\x1b[1;32m[    0.005700] sd 0:0:0:0: [sda] Write cache: enabled, read cache: enabled, doesn\'t support DPO or FUA\x1b[0m',
    '\x1b[1;33m[    0.005800] sda: sda1 sda2 sda3 sda4\x1b[0m',
    '\x1b[1;32m[    0.005900] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)\x1b[0m',
    '\x1b[1;32m[    0.006000] EXT4-fs (sda1): recovery complete\x1b[0m',
    '\x1b[0;37m[    0.006100] systemd[1]: Detected architecture x86-64.\x1b[0m',
    '\x1b[1;33m[    0.006200] systemd[1]: Initializing SCP Foundation system...\x1b[0m',
    '\x1b[1;32m[    0.006300] systemd[1]: System initialized.\x1b[0m',
    '\x1b[0;37m[    0.006400] SELinux:  Class netif not defined in policy.\x1b[0m',
    '\x1b[0;37m[    0.006500] SELinux:  permission netif, on class netif\x1b[0m',
    '\x1b[1;32m[    0.006600] systemd[1]: Starting Network Service...\x1b[0m',
    '\x1b[1;32m[    0.006700] systemd[1]: Started Network Service.\x1b[0m',
    '\x1b[1;33m[    0.006800] SCP-Network: Establishing secure tunnel to Foundation HQ...\x1b[0m',
    '\x1b[1;32m[    0.007000] SCP-Network: Secure tunnel established (VPN: Foundation-256)\x1b[0m',
    '\x1b[0;37m[    0.007100] systemd[1]: Reached target Network.\x1b[0m',
    '\x1b[0;37m[    0.007200] systemd[1]: Reached target Remote File Systems.\x1b[0m',
    '\x1b[1;32m[    0.007300] systemd[1]: Reached target System Initialization.\x1b[0m',
    '\x1b[1;32m[    0.007400] systemd[1]: Started Daily Cleanup of Temporary Directories.\x1b[0m',
    '\x1b[1;32m[    0.007500] systemd[1]: Starting Daily verification of passwords and groups...\x1b[0m',
    '\x1b[1;33m[    0.007600] SCP-Security: Verifying personnel credentials...\x1b[0m',
    '\x1b[1;32m[    0.007800] SCP-Security: Personnel credentials verified (Level 4 access granted)\x1b[0m',
    '\x1b[1;32m[    0.007900] systemd[1]: Reached target Multi-User System.\x1b[0m',
    '\x1b[1;32m[    0.008000] systemd[1]: Reached target Graphical Interface.\x1b[0m',
    '\x1b[1;33m[    0.008100] SCP-System: Starting terminal interface...\x1b[0m',
    '\x1b[1;32m[    0.008200] SCP-System: Terminal interface ready.\x1b[0m',
    '',
    '\x1b[1;32m[    0.008300] ████████████████████████████████████████████████████████████████\x1b[0m',
    '\x1b[1;32m[    0.008400] █     SCP Foundation - Site-19 Terminal System v3.0.1     █\x1b[0m',
    '\x1b[1;32m[    0.008500] ████████████████████████████████████████████████████████████████\x1b[0m',
    '\x1b[1;32m[    0.008600] █                                                          █\x1b[0m',
    '\x1b[1;32m[    0.008700] █  System Status: ONLINE                                    █\x1b[0m',
    '\x1b[1;32m[    0.008800] █  Containment Status: 4891 ACTIVE | 23 FAILED               █\x1b[0m',
    '\x1b[1;32m[    0.008900] █  Security Level: 4 (Maximum)                              █\x1b[0m',
    '\x1b[1;32m[    0.009000] █  Network: ENCRYPTED (AES-256-GCM)                          █\x1b[0m',
    '\x1b[1;32m[    0.009100] █  Location: Site-19, Foundation Network                     █\x1b[0m',
    '\x1b[1;32m[    0.009200] █                                                          █\x1b[0m',
    '\x1b[1;32m[    0.009300] ████████████████████████████████████████████████████████████████\x1b[0m',
    '\x1b[1;32m[    0.009400] █  Secure • Contain • Protect                               █\x1b[0m',
    '\x1b[1;32m[    0.009500] ████████████████████████████████████████████████████████████████\x1b[0m',
    '',
    '\x1b[1;32m[    0.009600] System boot completed successfully in 9.6 seconds\x1b[0m',
    '\x1b[1;32m[    0.009700] All systems operational. Ready for commands.\x1b[0m',
    ''
  ]

  // Display boot logs with delay for realistic effect
  for (let i = 0; i < bootLogs.length; i++) {
    terminal!.writeln(bootLogs[i])
    // Vary the delay for more realistic boot experience
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10))
  }

  // Scroll to bottom after boot log
  await new Promise(resolve => setTimeout(resolve, 300))
}

const navigateHistory = (direction: number) => {
  if (commandHistory.length === 0) return

  if (direction === -1) { // Up
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++
      if (historyIndex === 0) {
        currentInput = commandHistory[commandHistory.length - 1]
      } else {
        currentInput = commandHistory[commandHistory.length - 1 - historyIndex]
      }
      replaceCurrentLine()
    }
  } else { // Down
    if (historyIndex > -1) {
      historyIndex--
      if (historyIndex === -1) {
        currentInput = ''
      } else {
        currentInput = commandHistory[commandHistory.length - 1 - historyIndex]
      }
      replaceCurrentLine()
    }
  }
}

const replaceCurrentLine = () => {
  if (!terminal) return
  terminal!.write('\r\x1b[K')
  writePrompt()
  terminal!.write(currentInput)
}

const autocomplete = () => {
  if (currentInput.trim() === '') return

  const matches = availableCommands.filter(cmd =>
    cmd.startsWith(currentInput.toLowerCase())
  )

  if (matches.length === 1) {
    const autoComplete = matches[0].slice(currentInput.length)
    currentInput = matches[0]
    terminal!.write(autoComplete)
  } else if (matches.length > 1) {
    terminal!.writeln('\r\n')
    terminal!.writeln(`\x1b[1;36m可能的命令: ${matches.join(', ')}\x1b[0m`)
    writePrompt()
    terminal!.write(currentInput)
  }
}

const executeCommand = () => {
  const command = currentInput.trim()
  if (!command) {
    writePrompt()
    return
  }

  commandHistory.push(command)
  historyIndex = -1
  currentInput = ''

  processCommand(command.toLowerCase())
  writePrompt()
}

const processCommand = (command: string) => {
  const [cmd, ...args] = command.split(' ')

  switch (cmd) {
    case 'help':
      showHelp()
      break
    case 'status':
      showStatus()
      break
    case 'clear':
    case 'cls':
      clearScreen()
      break
    case 'containment':
      showContainment()
      break
    case 'scp-list':
      showSCPList()
      break
    case 'info':
      showInfo(args[0])
      break
    case 'protocol':
      showProtocol()
      break
    case 'emergency':
      showEmergency()
      break
    case 'version':
      showVersion()
      break
    case 'about':
      showAbout()
      break
    case 'logout':
      handleLogout()
      break
    case 'search':
      searchSCP(args.join(' '))
      break
    default:
      terminal!.writeln(`\x1b[1;31m未知命令: ${cmd}. 输入 "help" 查看可用命令.\x1b[0m`)
  }
}

const showHelp = () => {
  const helpText = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                        可用命令列表\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[0;37m  help          - 显示此帮助信息\x1b[0m',
    '\x1b[0;37m  status        - 显示系统状态和收容信息\x1b[0m',
    '\x1b[0;37m  clear / cls   - 清空终端屏幕\x1b[0m',
    '\x1b[0;37m  containment   - 显示收容协议详情\x1b[0m',
    '\x1b[0;37m  scp-list      - 列出已知 SCP 对象\x1b[0m',
    '\x1b[0;37m  info [编号]   - 显示指定 SCP 对象的信息\x1b[0m',
    '\x1b[0;37m  protocol      - 显示安全协议详情\x1b[0m',
    '\x1b[0;37m  emergency     - 显示紧急联系人信息\x1b[0m',
    '\x1b[0;37m  search [关键词]- 搜索 SCP 数据库\x1b[0m',
    '\x1b[0;37m  version       - 显示系统版本信息\x1b[0m',
    '\x1b[0;37m  about         - 关于本系统\x1b[0m',
    '\x1b[0;37m  logout        - 安全注销\x1b[0m',
    '',
    '\x1b[1;36m手势控制:\x1b[0m',
    '\x1b[0;37m  三指上滑      - 清屏\x1b[0m',
    '\x1b[0;37m  双指左滑      - 历史记录上一条\x1b[0m',
    '\x1b[0;37m  双指右滑      - 历史记录下一条\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  helpText.forEach(line => terminal?.writeln(line))
}

const showStatus = () => {
  const statusInfo = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                        系统状态报告\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    `\x1b[0;37m  系统状态:        \x1b[1;32m⚡ 运行正常\x1b[0m`,
    '\x1b[0;37m  活跃收容:        4,891 个对象\x1b[0m',
    '\x1b[0;37m  收容失效:        23 起事件\x1b[0m',
    '\x1b[0;37m  待处理:          156 个异常\x1b[0m',
    '\x1b[0;37m  威胁等级:        \x1b[1;33m中等\x1b[0m',
    '',
    '\x1b[0;37m  区域状态:\x1b[0m',
    '\x1b[0;37m    Site-19        \x1b[1;32m✓ 正常运行\x1b[0m',
    '\x1b[0;37m    Site-17        \x1b[1;32m✓ 正常运行\x1b[0m',
    '\x1b[0;37m    Area-12        \x1b[1;33m⚠ 收容协议升级中\x1b[0m',
    '\x1b[0;37m    Site-13        \x1b[1;31m🚫 封闭中\x1b[0m',
    '',
    '\x1b[0;37m  网络连接:        \x1b[1;32m加密连接 [AES-256]\x1b[0m',
    '\x1b[0;37m  数据库状态:      \x1b[1;32m同步完成\x1b[0m',
    '\x1b[0;37m  最后更新:        2026-03-31 14:32:15 UTC\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  statusInfo.forEach(line => terminal?.writeln(line))
}

const clearScreen = () => {
  terminal?.clear()
}

const showContainment = () => {
  const containmentInfo = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                      收容协议数据库\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[0;37m  协议等级分类:\x1b[0m',
    '',
    '\x1b[1;32m  [Safe] 安全级:\x1b[0m',
    '\x1b[0;37m    - 标准收容程序足够\x1b[0m',
    '\x1b[0;37m    - 无需特殊资源\x1b[0m',
    '\x1b[0;37m    - 定期检查即可\x1b[0m',
    '',
    '\x1b[1;33m  [Euclid] 欧几里得级:\x1b[0m',
    '\x1b[0;37m    - 需要持续监控\x1b[0m',
    '\x1b[0;37m    - 收容措施复杂\x1b[0m',
    '\x1b[0;37m    - 可能需要特殊资源\x1b[0m',
    '',
    '\x1b[1;31m  [Keter] 刻耳柏洛斯级:\x1b[0m',
    '\x1b[0;37m    - 极难收容\x1b[0m',
    '\x1b[0;37m    - 高度危险\x1b[0m',
    '\x1b[0;37m    - 需要大量资源\x1b[0m',
    '\x1b[0;37m    - 24小时监控\x1b[0m',
    '',
    '\x1b[1;35m  [Thaumiel] 塔耳塔洛斯级:\x1b[0m',
    '\x1b[0;37m    - 用于收容其他 SCP\x1b[0m',
    '\x1b[0;37m    - 基金会秘密武器\x1b[0m',
    '\x1b[0;37m    - 极高保密级别\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  containmentInfo.forEach(line => terminal?.writeln(line))
}

const showSCPList = () => {
  const scpList = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                        已知 SCP 对象\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[0;37m  热门收录对象 (显示前10个):\x1b[0m',
    '',
    '\x1b[0;37m  SCP-173   - 雕像 - \x1b[1;31m刻耳柏洛斯级\x1b[0m',
    '\x1b[0;37m  SCP-096   - 羞涩的人 - \x1b[1;33m欧几里得级\x1b[0m',
    '\x1b[0;37m  SCP-682   - 不灭孽蜥 - \x1b[1;31m刻耳柏洛斯级\x1b[0m',
    '\x1b[0;37m  SCP-999   - 痒痒怪 - \x1b[1;32m安全级\x1b[0m',
    '\x1b[0;37m  SCP-049   - 疫医 - \x1b[1;33m欧几里得级\x1b[0m',
    '\x1b[0;37m  SCP-914   - 万能加工机 - \x1b[1;32m安全级\x1b[0m',
    '\x1b[0;37m  SCP-3008  - 无限宜家 - \x1b[1;33m欧几里得级\x1b[0m',
    '\x1b[0;37m  SCP-087   - 楼梯间 - \x1b[1;33m欧几里得级\x1b[0m',
    '\x1b[0;37m  SCP-106   - 老人 - \x1b[1;31m刻耳柏洛斯级\x1b[0m',
    '\x1b[0;37m  SCP-1471  - 恶魔 - \x1b[1;33m欧几里得级\x1b[0m',
    '',
    '\x1b[1;36m  提示: 使用 "info [编号]" 查看详细信息\x1b[0m',
    '\x1b[1;36m  使用 "search [关键词]" 搜索特定对象\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  scpList.forEach(line => terminal?.writeln(line))
}

const showInfo = (scpNumber?: string) => {
  if (!scpNumber) {
    terminal?.writeln('\x1b[1;33m请指定 SCP 编号，例如: info 173\x1b[0m')
    return
  }

  const info = getSCPInfo(scpNumber)
  if (info) {
    info.forEach(line => terminal?.writeln(line))
  } else {
    terminal?.writeln(`\x1b[1;31m未找到 SCP-${scpNumber} 的信息\x1b[0m`)
  }
}

const getSCPInfo = (number: string): string[] | null => {
  const scpDatabase: Record<string, string[]> = {
    '173': [
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '\x1b[1;32m                      SCP-173 - 雕像\x1b[0m',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '',
      '\x1b[0;37m  项目等级: \x1b[1;31m刻耳柏洛斯级\x1b[0m',
      '\x1b[0;37m  收容站点: Site-19\x1b[0m',
      '',
      '\x1b[0;37m  特殊收容措施:\x1b[0m',
      '\x1b[0;37m    - 必须始终有两人以上进行监控\x1b[0m',
      '\x1b[0;37m    - 任何情况下不得有视线中断\x1b[0m',
      '\x1b[0;37m    - 清洁时必须保持视线接触\x1b[0m',
      '',
      '\x1b[0;37m  描述:\x1b[0m',
      '\x1b[0;37m    SCP-173 是一尊由混凝土和钢筋构成的雕像，\x1b[0m',
      '\x1b[0;37m    高度约 2.0 米，表面喷有 Krylon 品牌油漆。\x1b[0m',
      '\x1b[0;37m    当不与人类保持视线接触时会极度快速移动。\x1b[0m',
      '',
      '\x1b[1;31m  ⚠ 警告: 此对象极其危险，任何收容失效都可能导致人员伤亡\x1b[0m',
      '',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
    ],
    '096': [
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '\x1b[1;32m                    SCP-096 - 羞涩的人\x1b[0m',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '',
      '\x1b[0;37m  项目等级: \x1b[1;33m欧几里得级\x1b[0m',
      '\x1b[0;37m  收容站点: Site-19\x1b[0m',
      '',
      '\x1b[0;37m  特殊收容措施:\x1b[0m',
      '\x1b[0;37m    - 禁止任何形式的视觉记录\x1b[0m',
      '\x1b[0;37m    - 收容容器材质为 5 厘米厚的铅钢合金\x1b[0m',
      '\x1b[0;37m    - 任何接触其面部的行为都绝对禁止\x1b[0m',
      '',
      '\x1b[0;37m  描述:\x1b[0m',
      '\x1b[0;37m    SCP-096 是一身高约 2.38 米的人形生物。\x1b[0m',
      '\x1b[0;37m    其手臂比例异常，每只长约 1.5 米。\x1b[0m',
      '\x1b[0;37m    当有人看到其面部时会进入极度愤怒状态。\x1b[0m',
      '',
      '\x1b[1;31m  ⚠ 警告: 看到其面部的所有人都会被其追杀致死\x1b[0m',
      '',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
    ],
    '682': [
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '\x1b[1;32m                    SCP-682 - 不灭孽蜥\x1b[0m',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '',
      '\x1b[0;37m  项目等级: \x1b[1;31m刻耳柏洛斯级\x1b[0m',
      '\x1b[0;37m  收容站点: Site-19\x1b[0m',
      '',
      '\x1b[0;37m  特殊收容措施:\x1b[0m',
      '\x1b[0;37m    - 必须浸泡在盐酸中\x1b[0m',
      '\x1b[0;37m    - 每 24 小时更换一次酸液\x1b[0m',
      '\x1b[0;37m    - 任何实验都需要 4 级以上权限批准\x1b[0m',
      '',
      '\x1b[0;37m  描述:\x1b[0m',
      '\x1b[0;37m    SCP-682 是一个巨大的、类似爬行动物的生物。\x1b[0m',
      '\x1b[0;37m    具有极高的智能和适应能力。\x1b[0m',
      '\x1b[0;37m    能够适应任何形式的攻击和伤害。\x1b[0m',
      '',
      '\x1b[1;31m  ⚠ 警告: 此对象无法被永久摧毁，收容难度极高\x1b[0m',
      '',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
    ],
    '999': [
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '\x1b[1;32m                    SCP-999 - 痒痒怪\x1b[0m',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
      '',
      '\x1b[0;37m  项目等级: \x1b[1;32m安全级\x1b[0m',
      '\x1b[0;37m  收容站点: Site-17\x1b[0m',
      '',
      '\x1b[0;37m  特殊收容措施:\x1b[0m',
      '\x1b[0;37m    - 需要定期提供玩具和娱乐\x1b[0m',
      '\x1b[0;37m    - 保持清洁的生活环境\x1b[0m',
      '\x1b[0;37m    - 允许与员工进行受控互动\x1b[0m',
      '',
      '\x1b[0;37m  描述:\x1b[0m',
      '\x1b[0;37m    SCP-999 是一个大型、不定形的橙色生物。\x1b[0m',
      '\x1b[0;37m    性格极其友好，喜欢与人互动。\x1b[0m',
      '\x1b[0;37m    能够缓解压力和消极情绪。\x1b[0m',
      '',
      '\x1b[1;32m  ✓ 注意: 这是基金会已知最安全的 SCP 对象之一\x1b[0m',
      '',
      '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
    ]
  }

  return scpDatabase[number] || null
}

const showProtocol = () => {
  const protocols = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                      安全协议数据库\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[0;37m  主要安全协议:\x1b[0m',
    '',
    '\x1b[1;35m  [Omega-7] 任务部队协议:\x1b[0m',
    '\x1b[0;37m    - 用于处理极度危险的 SCP 对象\x1b[0m',
    '\x1b[0;37m    - 成员由收容异常个体组成\x1b[0m',
    '\x1b[0;37m    - 只在紧急情况下激活\x1b[0m',
    '',
    '\x1b[1;31m  [Alpha-1] 红右手协议:\x1b[0m',
    '\x1b[0;37m    - 基金会最高级别安保协议\x1b[0m',
    '\x1b[0;37m    - 用于保护 O5 议会\x1b[0m',
    '\x1b[0;37m    - 成员忠诚度无可置疑\x1b[0m',
    '',
    '\x1b[1;33m  [Nu-7] 落锤协议:\x1b[0m',
    '\x1b[0;37m    - 军事化应对协议\x1b[0m',
    '\x1b[0;37m    - 用于处理收容失效事件\x1b[0m',
    '\x1b[0;37m    - 配备重型武器和装备\x1b[0m',
    '',
    '\x1b[1;36m  [Zeta-9] 鼹鼠协议:\x1b[0m',
    '\x1b[0;37m    - 地下探索协议\x1b[0m',
    '\x1b[0;37m    - 用于探索异常空间\x1b[0m',
    '\x1b[0;37m    - 配备专业勘探设备\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  protocols.forEach(line => terminal?.writeln(line))
}

const showEmergency = () => {
  const emergencyInfo = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                      紧急联系人信息\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[1;31m  🚨 收容失效紧急热线:\x1b[0m',
    '\x1b[0;37m    - 内线: 911\x1b[0m',
    '\x1b[0;37m    - 外线: +1-SCP-EMERGENCY\x1b[0m',
    '',
    '\x1b[0;37m  📞 各部门联系电话:\x1b[0m',
    '\x1b[0;37m    - 研究部:      ext. 1001\x1b[0m',
    '\x1b[0;37m    - 收容部:      ext. 1002\x1b[0m',
    '\x1b[0;37m    - 安全部:      ext. 1003\x1b[0m',
    '\x1b[0;37m    - 医疗部:      ext. 1004\x1b[0m',
    '\x1b[0;37m    - 任务部队:    ext. 1005\x1b[0m',
    '',
    '\x1b[0;37m  🏥 站点医疗中心:\x1b[0m',
    '\x1b[0;37m    - 急救:        ext. 2001\x1b[0m',
    '\x1b[0;37m    - 心理咨询:    ext. 2002\x1b[0m',
    '\x1b[0;37m    - 记忆消除:    ext. 2003\x1b[0m',
    '',
    '\x1b[1;33m  ⚠ 注意: 所有紧急联系都需要经过身份验证\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  emergencyInfo.forEach(line => terminal?.writeln(line))
}

const showVersion = () => {
  const versionInfo = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                        系统版本信息\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[0;37m  SCP 基金会终端系统\x1b[0m',
    '\x1b[0;37m  版本: 3.0.1\x1b[0m',
    '\x1b[0;37m  构建日期: 2026-03-31\x1b[0m',
    '',
    '\x1b[0;37m  技术信息:\x1b[0m',
    '\x1b[0;37m    - 前端框架: Vue 3\x1b[0m',
    '\x1b[0;37m    - 终端库: xterm.js\x1b[0m',
    '\x1b[0;37m    - 手势库: Hammer.js\x1b[0m',
    '\x1b[0;37m    - 构建工具: Vite\x1b[0m',
    '\x1b[0;37m    - 开发语言: TypeScript\x1b[0m',
    '\x1b[0;37m    - 加密级别: AES-256\x1b[0m',
    '',
    '\x1b[0;37m  维护信息:\x1b[0m',
    '\x1b[0;37m    - 维护部门: 技术部\x1b[0m',
    '\x1b[0;37m    - 负责人: Dr. [数据删除]\x1b[0m',
    '\x1b[0;37m    - 最后检查: 2026-03-31\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  versionInfo.forEach(line => terminal?.writeln(line))
}

const showAbout = () => {
  const aboutInfo = [
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '\x1b[1;32m                          关于系统\x1b[0m',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m',
    '',
    '\x1b[0;37m  SCP 基金会终端系统是一个用于访问和控制\x1b[0m',
    '\x1b[0;37m  基金会资源的现代化界面。\x1b[0m',
    '',
    '\x1b[0;37m  主要功能:\x1b[0m',
    '\x1b[0;37m    - 访问 SCP 数据库\x1b[0m',
    '\x1b[0;37m    - 查看收容协议\x1b[0m',
    '\x1b[0;37m    - 监控系统状态\x1b[0m',
    '\x1b[0;37m    - 紧急情况响应\x1b[0m',
    '\x1b[0;37m    - 触摸屏手势支持\x1b[0m',
    '',
    '\x1b[0;37m  设计理念:\x1b[0m',
    '\x1b[0;37m    - 安全第一\x1b[0m',
    '\x1b[0;37m    - 高效操作\x1b[0m',
    '\x1b[0;37m    - 用户友好\x1b[0m',
    '\x1b[0;37m    - 现代化界面\x1b[0m',
    '\x1b[0;37m    - 全屏沉浸式体验\x1b[0m',
    '',
    '\x1b[1;31m  本系统仅供授权人员使用。\x1b[0m',
    '\x1b[1;31m  未经授权的访问将被追究法律责任。\x1b[0m',
    '',
    '\x1b[1;32m  Secure. Contain. Protect.\x1b[0m',
    '',
    '\x1b[1;31m═══════════════════════════════════════════════════════════════\x1b[0m'
  ]
  aboutInfo.forEach(line => terminal?.writeln(line))
}

const searchSCP = (keyword: string) => {
  if (!keyword) {
    terminal?.writeln('\x1b[1;33m请输入搜索关键词，例如: search 雕像\x1b[0m')
    return
  }

  const results = performSearch(keyword)
  if (results.length > 0) {
    terminal?.writeln(`\x1b[1;32m找到 ${results.length} 个结果:\x1b[0m`)
    results.forEach(result => terminal?.writeln(`\x1b[0;37m  - ${result}\x1b[0m`))
  } else {
    terminal?.writeln('\x1b[1;31m未找到匹配的结果\x1b[0m')
  }
}

const performSearch = (keyword: string): string[] => {
  const database = [
    'SCP-173 - 雕像 (雕像)',
    'SCP-096 - 羞涩的人 (人形)',
    'SCP-682 - 不灭孽蜥 (爬行动物)',
    'SCP-999 - 痒痒怪 (橙色生物)',
    'SCP-049 - 疫医 (人形)',
    'SCP-914 - 万能加工机 (机器)',
    'SCP-3008 - 无限宜家 (建筑)',
    'SCP-087 - 楼梯间 (空间)',
    'SCP-106 - 老人 (人形)',
    'SCP-1471 - 恶魔 (数字实体)'
  ]

  return database.filter(item =>
    item.toLowerCase().includes(keyword.toLowerCase())
  )
}

const handleLogout = () => {
  terminal?.writeln('\x1b[1;33m正在安全注销...\x1b[0m')
  terminal?.writeln('\x1b[1;32m会话已终止。\x1b[0m')
  terminal?.writeln('\x1b[0;37m感谢您使用 SCP 基金会终端系统。\x1b[0m')
  terminal?.writeln('')
  terminal?.writeln('\x1b[1;32mSecure. Contain. Protect.\x1b[0m')
  terminal?.writeln('')
}
</script>

<style scoped>
#terminal-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  background: #0a0a0a;
}

#terminal-container ::v-deep(.xterm) {
  height: 100%;
  padding: 8px;
}

#terminal-container ::v-deep(.xterm-viewport) {
  overflow-y: auto;
}

#terminal-container ::v-deep(.xterm-screen) {
  background-color: #0a0a0a !important;
}
</style>