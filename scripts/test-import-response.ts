/**
 * 真实运行测试 #2：验证 importContent 响应格式组装逻辑
 */

function buildImportResponse(results: { success: boolean; error?: string }[], total: number) {
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length
  return {
    success: failCount === 0,
    imported: successCount,
    failed: failCount,
    total,
    details: results.map((r, i) => ({ index: i, ...r })).filter((r) => !r.success),
  }
}

const tests = [
  {
    name: '全部成功',
    results: [{ success: true }, { success: true }],
    total: 2,
    expect: { success: true, imported: 2, failed: 0, total: 2, details: [] },
  },
  {
    name: '全部失败',
    results: [
      { success: false, error: 'Missing required field: scp_number' },
      { success: false, error: 'Missing required field: title' },
    ],
    total: 2,
    expect: { success: false, imported: 0, failed: 2, total: 2, detailsLength: 2 },
  },
  {
    name: '部分成功',
    results: [
      { success: true },
      { success: false, error: 'Duplicate' },
      { success: true },
    ],
    total: 3,
    expect: { success: false, imported: 2, failed: 1, total: 3, detailsLength: 1 },
  },
  {
    name: '空数据',
    results: [],
    total: 0,
    expect: { success: true, imported: 0, failed: 0, total: 0, details: [] },
  },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const res = buildImportResponse(t.results, t.total)
  const ok =
    res.success === t.expect.success &&
    res.imported === t.expect.imported &&
    res.failed === t.expect.failed &&
    res.total === t.expect.total &&
    (t.expect.details !== undefined ? JSON.stringify(res.details) === JSON.stringify(t.expect.details) : res.details.length === t.expect.detailsLength)

  if (ok) {
    console.log(`✅ ${t.name}: imported=${res.imported}, failed=${res.failed}`)
    passed++
  } else {
    console.log(`❌ ${t.name}`)
    console.log(`   期望: ${JSON.stringify(t.expect)}`)
    console.log(`   实际: ${JSON.stringify(res)}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
