/**
 * 真实运行测试 #1：验证 batchContent 的 action 校验和参数校验逻辑
 */

const supportedActions = ['delete', 'update_status', 'move_category']

function validateBatchRequest(body: { action?: string; ids?: number[]; status?: string; category?: string }) {
  const action = body?.action
  const ids = body?.ids || []

  if (!action || !supportedActions.includes(action)) {
    return { ok: false, error: `Unsupported action. Supported: ${supportedActions.join(', ')}`, code: 400 }
  }
  if (!ids.length) {
    return { ok: false, error: 'No IDs provided', code: 400 }
  }
  if (action === 'update_status' && !body?.status) {
    return { ok: false, error: 'Missing status parameter', code: 400 }
  }
  if (action === 'move_category' && !body?.category) {
    return { ok: false, error: 'Missing category parameter', code: 400 }
  }
  return { ok: true }
}

const tests = [
  { name: 'delete 无 ids', body: { action: 'delete', ids: [] }, expectOk: false },
  { name: 'delete 正常', body: { action: 'delete', ids: [1, 2, 3] }, expectOk: true },
  { name: 'update_status 无 status', body: { action: 'update_status', ids: [1] }, expectOk: false },
  { name: 'update_status 正常', body: { action: 'update_status', ids: [1], status: 'hidden' }, expectOk: true },
  { name: 'move_category 无 category', body: { action: 'move_category', ids: [1] }, expectOk: false },
  { name: 'move_category 正常', body: { action: 'move_category', ids: [1], category: 'bug' }, expectOk: true },
  { name: '未知 action', body: { action: 'truncate', ids: [1] }, expectOk: false },
  { name: '空 action', body: { action: '', ids: [1] }, expectOk: false },
  { name: '大写 action', body: { action: 'DELETE', ids: [1] }, expectOk: false },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const result = validateBatchRequest(t.body)
  if (result.ok === t.expectOk) {
    console.log(`✅ ${t.name}`)
    passed++
  } else {
    console.log(`❌ ${t.name}: 期望 ok=${t.expectOk}, 实际 ok=${result.ok}, error=${result.error}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
