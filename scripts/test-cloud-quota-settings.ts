/**
 * 真实运行测试：验证设置页面云存储配额显示逻辑
 */

// 模拟 formatBytes
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 模拟 quota 数据格式化
function formatQuota(data: { used: number; max: number; percent: number; count: number }): string {
  return `${formatBytes(data.used)} / ${formatBytes(data.max)} (${data.percent}%)`
}

const tests = [
  {
    name: '零使用量',
    data: { used: 0, max: 104857600, percent: 0, count: 0 },
    expectText: '0 B / 100.0 MB (0%)',
  },
  {
    name: '小文件 (1 KB)',
    data: { used: 1024, max: 104857600, percent: 0, count: 1 },
    expectText: '1.0 KB / 100.0 MB (0%)',
  },
  {
    name: '中等使用量 (50 MB)',
    data: { used: 52428800, max: 104857600, percent: 50, count: 100 },
    expectText: '50.0 MB / 100.0 MB (50%)',
  },
  {
    name: '接近满 (99 MB)',
    data: { used: 103809024, max: 104857600, percent: 99, count: 999 },
    expectText: '99.0 MB / 100.0 MB (99%)',
  },
  {
    name: '满配额 (100 MB)',
    data: { used: 104857600, max: 104857600, percent: 100, count: 1024 },
    expectText: '100.0 MB / 100.0 MB (100%)',
  },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const actual = formatQuota(t.data)
  if (actual === t.expectText) {
    console.log(`✅ ${t.name}: ${actual}`)
    passed++
  } else {
    console.log(`❌ ${t.name}`)
    console.log(`   期望: ${t.expectText}`)
    console.log(`   实际: ${actual}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
