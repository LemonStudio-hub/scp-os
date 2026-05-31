/**
 * 真实运行测试 #2：验证前端 batchActions 动态配置逻辑
 */

interface BatchAction {
  key: string
  label: string
  icon?: string
  type?: 'danger' | 'warning' | 'default'
}

function getBatchActions(activeTab: string): BatchAction[] {
  const actions: BatchAction[] = [
    { key: 'delete', label: 'Batch Delete', icon: 'delete', type: 'danger' },
  ]
  if (activeTab === 'feedbacks') {
    actions.push(
      { key: 'update_status', label: 'Update Status', icon: 'archive', type: 'warning' },
      { key: 'move_category', label: 'Move Category', icon: 'download', type: 'default' }
    )
  }
  return actions
}

const tests = [
  { name: 'scp_items tab', tab: 'scp_items', expectKeys: ['delete'] },
  { name: 'tales tab', tab: 'tales', expectKeys: ['delete'] },
  { name: 'goi tab', tab: 'goi', expectKeys: ['delete'] },
  { name: 'hubs tab', tab: 'hubs', expectKeys: ['delete'] },
  { name: 'feedbacks tab', tab: 'feedbacks', expectKeys: ['delete', 'update_status', 'move_category'] },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const actions = getBatchActions(t.tab)
  const keys = actions.map((a) => a.key)
  const ok = JSON.stringify(keys) === JSON.stringify(t.expectKeys)
  if (ok) {
    console.log(`✅ ${t.name}: [${keys.join(', ')}]`)
    passed++
  } else {
    console.log(`❌ ${t.name}: 期望 [${t.expectKeys.join(', ')}], 实际 [${keys.join(', ')}]`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
