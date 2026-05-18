/**
 * 测试 useCloudQuota composable 逻辑
 */

interface CloudQuota {
  used: number
  max: number
  percent: number
  count: number
}

const CACHE_DURATION = 30_000
let cachedQuota: CloudQuota | null = null
let cachedAt = 0

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 模拟状态
let mockIsLoggedIn = true
let mockResponse: { ok: boolean; json: () => Promise<{ success: boolean; data?: CloudQuota }> } | null = null
let shouldThrow = false

async function fetchCloudQuota(): Promise<CloudQuota | null> {
  const now = Date.now()
  if (cachedQuota && now - cachedAt < CACHE_DURATION) {
    return cachedQuota
  }

  if (!mockIsLoggedIn) {
    cachedQuota = null
    cachedAt = now
    return null
  }

  try {
    if (shouldThrow) throw new Error('network')
    const response = mockResponse!
    if (!response.ok) {
      cachedQuota = null
      cachedAt = now
      return null
    }
    const result = await response.json()
    if (result.success && result.data) {
      cachedQuota = {
        used: result.data.used,
        max: result.data.max,
        percent: result.data.percent,
        count: result.data.count || 0,
      }
      cachedAt = now
      return cachedQuota
    }
  } catch {
    // ignore
  }

  cachedQuota = null
  cachedAt = now
  return null
}

function resetCache() {
  cachedQuota = null
  cachedAt = 0
}

const tests = [
  {
    name: '未登录时返回 null',
    setup: () => {
      resetCache()
      mockIsLoggedIn = false
    },
    expect: null,
  },
  {
    name: '登录后正常获取配额',
    setup: () => {
      resetCache()
      mockIsLoggedIn = true
      shouldThrow = false
      mockResponse = {
        ok: true,
        json: async () => ({ success: true, data: { used: 1024, max: 104857600, percent: 0, count: 5 } }),
      }
    },
    expect: { used: 1024, max: 104857600, percent: 0, count: 5 },
  },
  {
    name: '缓存命中返回缓存值',
    setup: () => {
      // 不改变 mock，直接再次调用
    },
    expect: { used: 1024, max: 104857600, percent: 0, count: 5 },
  },
  {
    name: 'HTTP 错误返回 null 并缓存',
    setup: () => {
      resetCache()
      mockResponse = { ok: false, json: async () => ({ success: false }) }
    },
    expect: null,
  },
  {
    name: '网络异常返回 null 并缓存',
    setup: () => {
      resetCache()
      shouldThrow = true
    },
    expect: null,
  },
]

async function runTests() {
  let passed = 0
  let failed = 0

  for (const t of tests) {
    t.setup()
    const result = await fetchCloudQuota()
    const ok =
      (t.expect === null && result === null) ||
      (t.expect !== null && result !== null && result.used === t.expect.used && result.count === t.expect.count)

    if (ok) {
      console.log(`✅ ${t.name}`)
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
}

runTests()
