/**
 * 真实运行测试 #2：验证 adminExport 的 format 参数校验逻辑
 */

// 模拟 adminExport 的 format 校验分支
function validateFormat(format: string | undefined): { ok: boolean; error?: string; code?: number } {
  const f = format || 'json'
  if (f !== 'json' && f !== 'csv') {
    return { ok: false, error: 'Invalid format. Use json or csv', code: 400 }
  }
  return { ok: true }
}

const tests = [
  { name: '默认 format（undefined）', input: undefined, expectOk: true },
  { name: 'format=json', input: 'json', expectOk: true },
  { name: 'format=csv', input: 'csv', expectOk: true },
  { name: 'format=xml', input: 'xml', expectOk: false },
  { name: 'format=csv;drop table', input: 'csv;drop table', expectOk: false },
  { name: 'format=CSV（大写）', input: 'CSV', expectOk: false }, // 严格大小写校验
  { name: 'format=Json（混合大小写）', input: 'Json', expectOk: false },
  { name: 'format=空字符串', input: '', expectOk: true }, // 空字符串应回退到 json
]

let passed = 0
let failed = 0

for (const t of tests) {
  const result = validateFormat(t.input)
  if (result.ok === t.expectOk) {
    console.log(`✅ ${t.name}`)
    passed++
  } else {
    console.log(`❌ ${t.name}: 期望 ok=${t.expectOk}, 实际 ok=${result.ok}`)
    if (result.error) console.log(`   错误: ${result.error}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
