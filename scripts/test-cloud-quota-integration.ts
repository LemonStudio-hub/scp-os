/**
 * 集成测试：模拟 fetchCloudQuota 完整行为
 */

interface QuotaData {
  success: boolean
  data?: { used: number; max: number; percent: number; count: number }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function fetchCloudQuota(mockResponse: () => Promise<{ ok: boolean; json: () => Promise<QuotaData> }>): Promise<{ text: string; count: number }> {
  try {
    const response = await mockResponse()
    if (!response.ok) {
      return { text: '—', count: 0 }
    }
    const result = await response.json()
    if (result.success && result.data) {
      const { used, max, percent, count } = result.data
      return { text: `${formatBytes(used)} / ${formatBytes(max)} (${percent}%)`, count: count || 0 }
    }
  } catch {
    return { text: '—', count: 0 }
  }
  return { text: '—', count: 0 }
}

const tests = [
  {
    name: '正常响应 - 50% 使用量',
    mock: async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { used: 52428800, max: 104857600, percent: 50, count: 42 },
      }),
    }),
    expect: { text: '50.0 MB / 100.0 MB (50%)', count: 42 },
  },
  {
    name: 'HTTP 错误 (401)',
    mock: async () => ({
      ok: false,
      json: async () => ({ success: false }),
    }),
    expect: { text: '—', count: 0 },
  },
  {
    name: '网络异常',
    mock: async () => {
      throw new Error('Network error')
    },
    expect: { text: '—', count: 0 },
  },
  {
    name: '成功但无 data 字段',
    mock: async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }),
    expect: { text: '—', count: 0 },
  },
  {
    name: 'count 为 undefined 时默认 0',
    mock: async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { used: 1024, max: 104857600, percent: 0 },
      }),
    }),
    expect: { text: '1.0 KB / 100.0 MB (0%)', count: 0 },
  },
]

async function runTests() {
  let passed = 0
  let failed = 0

  for (const t of tests) {
    const result = await fetchCloudQuota(t.mock)
    const ok = result.text === t.expect.text && result.count === t.expect.count
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
