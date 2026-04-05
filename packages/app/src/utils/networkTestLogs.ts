/**
 * Network Test Log Generator
 * Simulates realistic network connectivity testing with Linux-style progress bars
 */

import { ANSICode } from '../constants/theme'

// Test targets
const TEST_TARGETS = [
  { name: 'SCP Wiki (CN)', host: 'scp-wiki-cn.wikidot.com', port: 443, type: 'HTTPS' },
  { name: 'SCP Wiki (EN)', host: 'scp-wiki.wikidot.com', port: 443, type: 'HTTPS' },
  { name: 'API Endpoint', host: 'api.scpos.site', port: 443, type: 'HTTPS' },
  { name: 'Cloudflare DNS', host: '1.1.1.1', port: 53, type: 'DNS' },
  { name: 'Google DNS', host: '8.8.8.8', port: 53, type: 'DNS' },
]

/**
 * Generate Linux-style progress bar
 * [████████████░░░░░░░░] 60%
 */
export function generateProgressBar(current: number, total: number, width: number = 30): string {
  const pct = Math.min(100, Math.max(0, Math.floor((current / total) * 100)))
  const filled = Math.floor((pct / 100) * width)
  const empty = width - filled
  
  let color = ANSICode.green
  if (pct < 30) color = ANSICode.red
  else if (pct < 70) color = ANSICode.yellow
  
  return `${color}[${'█'.repeat(filled)}${'░'.repeat(empty)}]${ANSICode.reset} ${String(pct).padStart(3)}%`
}

/**
 * Generate random latency (ms)
 */
function randomLatency(min: number = 5, max: number = 200): number {
  return Math.floor(Math.random() * (max - min) + min)
}

/**
 * Generate random packet loss percentage
 */
function randomPacketLoss(): number {
  const r = Math.random()
  if (r > 0.9) return Math.floor(Math.random() * 5) + 1  // 1-5% loss
  if (r > 0.7) return Math.floor(Math.random() * 2)      // 0-1% loss
  return 0                                                  // 0% loss
}

/**
 * Generate full network test logs
 */
export async function generateNetworkTestLogs(): Promise<string[]> {
  const logs: string[] = []
  
  // Header
  logs.push('')
  logs.push(`${ANSICode.red}╔══════════════════════════════════════════════════════════════╗${ANSICode.reset}`)
  logs.push(`${ANSICode.red}║${ANSICode.reset}              ${ANSICode.green}Network Connectivity Test${ANSICode.reset}                  ${ANSICode.red}║${ANSICode.reset}`)
  logs.push(`${ANSICode.red}╚══════════════════════════════════════════════════════════════╝${ANSICode.reset}`)
  logs.push('')
  
  // Phase 1: DNS Resolution
  logs.push(`${ANSICode.cyan}[PHASE 1]${ANSICode.reset} DNS Resolution Test`)
  logs.push('')
  logs.push(`${ANSICode.gray}  Resolving hosts via system DNS...${ANSICode.reset}`)
  
  for (const target of TEST_TARGETS) {
    logs.push(`${ANSICode.gray}  Resolving ${target.host}...${ANSICode.reset}`)
    const latency = randomLatency(2, 50)
    await sleep(30 + Math.random() * 20)
    logs.push(`${ANSICode.gray}    Answer: ${generateRandomIP()} (TTL: ${Math.floor(Math.random() * 300 + 60)}s)${ANSICode.reset}`)
    logs.push(`${ANSICode.gray}    Time: ${latency}ms${ANSICode.reset}`)
    logs.push(`${ANSICode.green}    [OK]${ANSICode.reset}`)
    logs.push('')
  }
  
  // Phase 2: TCP Connection Test
  logs.push(`${ANSICode.cyan}[PHASE 2]${ANSICode.reset} TCP Connection Test`)
  logs.push('')
  
  let completedTargets = 0
  for (const target of TEST_TARGETS) {
    logs.push(`${ANSICode.gray}  Testing ${target.name} (${target.host}:${target.port})...${ANSICode.reset}`)
    
    // Connection progress
    const steps = ['SYN sent', 'SYN-ACK received', 'ACK sent', 'Connection established']
    for (let i = 0; i < steps.length; i++) {
      await sleep(40 + Math.random() * 30)
      logs.push(`${ANSICode.gray}    ${steps[i]}...${ANSICode.reset}`)
    }
    
    const latency = randomLatency(10, 150)
    logs.push(`${ANSICode.gray}    Connected in ${latency}ms${ANSICode.reset}`)
    logs.push(`${ANSICode.green}    [OK] TCP connection successful${ANSICode.reset}`)
    logs.push('')
    completedTargets++
  }
  
  // Phase 3: HTTP Request Test
  logs.push(`${ANSICode.cyan}[PHASE 3]${ANSICode.reset} HTTP/HTTPS Request Test`)
  logs.push('')
  logs.push(`${ANSICode.gray}  Sending test requests...${ANSICode.reset}`)
  logs.push('')
  
  completedTargets = 0
  for (const target of TEST_TARGETS) {
    if (target.type === 'DNS') continue  // Skip HTTP test for DNS targets
    
    const url = `https://${target.host}/`
    logs.push(`${ANSICode.gray}  GET ${url}${ANSICode.reset}`)
    
    // Request progress with progress bar
    const stages = [
      { text: 'Connecting', delay: 50 },
      { text: 'TLS Handshake', delay: 80 },
      { text: 'Sending Request', delay: 30 },
      { text: 'Waiting for Response', delay: 100 },
      { text: 'Downloading Headers', delay: 40 },
    ]
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      await sleep(stage.delay + Math.random() * 40)
      const progress = generateProgressBar(i + 1, stages.length, 25)
      logs.push(`${ANSICode.gray}    ${stage.text.padEnd(22)} ${progress}${ANSICode.reset}`)
    }
    
    const statusCode = Math.random() > 0.1 ? 200 : 403
    const responseTime = randomLatency(50, 500)
    const statusColor = statusCode === 200 ? ANSICode.green : ANSICode.yellow
    logs.push(`${ANSICode.gray}    ${statusColor}HTTP ${statusCode}${ANSICode.reset} ${ANSICode.gray}(${responseTime}ms)${ANSICode.reset}`)
    logs.push(`${ANSICode.green}    [OK]${ANSICode.reset}`)
    logs.push('')
    completedTargets++
  }
  
  // Phase 4: Packet Loss Test
  logs.push(`${ANSICode.cyan}[PHASE 4]${ANSICode.reset} Packet Loss Test`)
  logs.push('')
  logs.push(`${ANSICode.gray}  Sending 10 test packets to each target...${ANSICode.reset}`)
  logs.push('')
  
  for (const target of TEST_TARGETS) {
    const packetsSent = 10
    const lossPct = randomPacketLoss()
    const packetsLost = Math.floor((lossPct / 100) * packetsSent)
    const packetsReceived = packetsSent - packetsLost
    const latency = randomLatency(5, 100)
    
    logs.push(`${ANSICode.gray}  ${target.name} (${target.host}):${ANSICode.reset}`)
    
    // Simulate packet sending progress
    for (let i = 1; i <= packetsSent; i++) {
      const isLost = Math.random() < (lossPct / 100)
      const packetLatency = isLost ? 'timeout' : `${randomLatency(5, 150)}ms`
      const status = isLost ? `${ANSICode.red}LOST${ANSICode.reset}` : `${ANSICode.green}RECV${ANSICode.reset}`
      
      if (i % 3 === 0 || i === packetsSent) {
        const progress = generateProgressBar(i, packetsSent, 25)
        logs.push(`${ANSICode.gray}    seq=${String(i).padStart(2)} time=${String(packetLatency).padStart(10)} ${status} ${progress}${ANSICode.reset}`)
      } else {
        logs.push(`${ANSICode.gray}    seq=${String(i).padStart(2)} time=${String(packetLatency).padStart(10)} ${status}${ANSICode.reset}`)
      }
      await sleep(20 + Math.random() * 15)
    }
    
    logs.push(`${ANSICode.gray}    ${packetsSent} packets transmitted, ${packetsReceived} received, ${lossPct}% packet loss, time ${latency}ms${ANSICode.reset}`)
    
    const lossColor = lossPct === 0 ? ANSICode.green : lossPct <= 2 ? ANSICode.yellow : ANSICode.red
    logs.push(`${ANSICode.gray}    Packet loss: ${lossColor}${lossPct}%${ANSICode.reset}`)
    logs.push('')
  }
  
  // Phase 5: Bandwidth Estimation
  logs.push(`${ANSICode.cyan}[PHASE 5]${ANSICode.reset} Bandwidth Estimation`)
  logs.push('')
  logs.push(`${ANSICode.gray}  Measuring download speed...${ANSICode.reset}`)
  logs.push('')
  
  const downloadSpeed = (Math.random() * 50 + 10).toFixed(1)
  const uploadSpeed = (Math.random() * 20 + 5).toFixed(1)
  
  // Download progress
  logs.push(`${ANSICode.gray}  Download test:${ANSICode.reset}`)
  for (let i = 1; i <= 5; i++) {
    await sleep(60 + Math.random() * 40)
    const progress = generateProgressBar(i, 5, 25)
    logs.push(`${ANSICode.gray}    Chunk ${i}/5 downloaded ${progress}${ANSICode.reset}`)
  }
  logs.push(`${ANSICode.green}    Download: ${downloadSpeed} Mbps${ANSICode.reset}`)
  logs.push('')
  
  logs.push(`${ANSICode.gray}  Upload test:${ANSICode.reset}`)
  for (let i = 1; i <= 5; i++) {
    await sleep(40 + Math.random() * 30)
    const progress = generateProgressBar(i, 5, 25)
    logs.push(`${ANSICode.gray}    Chunk ${i}/5 uploaded ${progress}${ANSICode.reset}`)
  }
  logs.push(`${ANSICode.green}    Upload: ${uploadSpeed} Mbps${ANSICode.reset}`)
  logs.push('')
  
  // Summary
  logs.push(`${ANSICode.red}╔══════════════════════════════════════════════════════════════╗${ANSICode.reset}`)
  logs.push(`${ANSICode.red}║${ANSICode.reset}                  ${ANSICode.green}Network Test Summary${ANSICode.reset}                     ${ANSICode.red}║${ANSICode.reset}`)
  logs.push(`${ANSICode.red}╚══════════════════════════════════════════════════════════════╝${ANSICode.reset}`)
  logs.push('')
  logs.push(`${ANSICode.gray}  Targets tested:    ${TEST_TARGETS.length}${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}  DNS resolution:    ${ANSICode.green}All resolved${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}  TCP connections:   ${ANSICode.green}All successful${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}  HTTP requests:     ${ANSICode.green}All responded${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}  Download speed:    ${ANSICode.green}${downloadSpeed} Mbps${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}  Upload speed:      ${ANSICode.green}${uploadSpeed} Mbps${ANSICode.reset}`)
  logs.push(`${ANSICode.gray}  Average latency:   ${ANSICode.green}${randomLatency(20, 80)}ms${ANSICode.reset}`)
  logs.push('')
  logs.push(`${ANSICode.green}████████████████████████████████████████████████████████████████${ANSICode.reset}`)
  logs.push(`${ANSICode.green}█${ANSICode.reset}                                                        ${ANSICode.green}█${ANSICode.reset}`)
  logs.push(`${ANSICode.green}█${ANSICode.reset}  ${ANSICode.green}NETWORK HEALTHY - All connectivity tests passed${ANSICode.reset}            ${ANSICode.green}█${ANSICode.reset}`)
  logs.push(`${ANSICode.green}█${ANSICode.reset}                                                        ${ANSICode.green}█${ANSICode.reset}`)
  logs.push(`${ANSICode.green}████████████████████████████████████████████████████████████████${ANSICode.reset}`)
  logs.push('')
  
  return logs
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate random IP address
 */
function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 223 + 1)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}
