/**
 * 真实运行测试 #1 & #2：验证性能监控错误检测逻辑
 */

interface MockResourceTiming {
  duration: number
  transferSize: number
  responseStatus?: number
}

function detectResourceErrors(entries: MockResourceTiming[]): { errorCount: number; totalDuration: number; totalSize: number } {
  let totalDuration = 0
  let totalSize = 0
  let errorCount = 0

  for (const entry of entries) {
    const res = entry as MockResourceTiming & { responseStatus?: number }
    totalDuration += res.duration
    totalSize += res.transferSize || 0

    if (res.responseStatus && res.responseStatus >= 400) {
      errorCount++
    }
  }

  return { errorCount, totalDuration, totalSize }
}

const tests = [
  {
    name: '全部 200 OK',
    entries: [
      { duration: 100, transferSize: 1024, responseStatus: 200 },
      { duration: 200, transferSize: 2048, responseStatus: 200 },
    ],
    expect: { errorCount: 0, totalDuration: 300, totalSize: 3072 },
  },
  {
    name: '混合 200 + 404',
    entries: [
      { duration: 100, transferSize: 1024, responseStatus: 200 },
      { duration: 50, transferSize: 0, responseStatus: 404 },
    ],
    expect: { errorCount: 1, totalDuration: 150, totalSize: 1024 },
  },
  {
    name: '全部 5xx',
    entries: [
      { duration: 1000, transferSize: 0, responseStatus: 500 },
      { duration: 2000, transferSize: 0, responseStatus: 503 },
    ],
    expect: { errorCount: 2, totalDuration: 3000, totalSize: 0 },
  },
  {
    name: '无 responseStatus（旧浏览器）',
    entries: [
      { duration: 100, transferSize: 1024 },
      { duration: 200, transferSize: 2048 },
    ],
    expect: { errorCount: 0, totalDuration: 300, totalSize: 3072 },
  },
  {
    name: '边界 399 和 400',
    entries: [
      { duration: 100, transferSize: 1024, responseStatus: 399 },
      { duration: 100, transferSize: 1024, responseStatus: 400 },
    ],
    expect: { errorCount: 1, totalDuration: 200, totalSize: 2048 },
  },
  {
    name: '空数组',
    entries: [],
    expect: { errorCount: 0, totalDuration: 0, totalSize: 0 },
  },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const result = detectResourceErrors(t.entries)
  const ok =
    result.errorCount === t.expect.errorCount &&
    result.totalDuration === t.expect.totalDuration &&
    result.totalSize === t.expect.totalSize

  if (ok) {
    console.log(`✅ ${t.name}: errors=${result.errorCount}`)
    passed++
  } else {
    console.log(`❌ ${t.name}`)
    console.log(`   期望: ${JSON.stringify(t.expect)}`)
    console.log(`   实际: ${JSON.stringify(result)}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
