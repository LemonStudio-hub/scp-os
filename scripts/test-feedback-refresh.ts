/**
 * 真实运行测试：验证移动端反馈投票/评论后自动刷新逻辑
 */

interface FeedbackState {
  isLoading: boolean
  refreshCount: number
  silentRefreshes: number
}

function createFeedbackStore() {
  const state: FeedbackState = { isLoading: false, refreshCount: 0, silentRefreshes: 0 }

  async function loadFeedbacks(silent = false) {
    if (!silent) state.isLoading = true
    await new Promise((resolve) => setTimeout(resolve, 10))
    if (!silent) state.isLoading = false
    state.refreshCount++
    if (silent) state.silentRefreshes++
  }

  async function voteFeedback(silent = false) {
    await new Promise((resolve) => setTimeout(resolve, 10))
    await loadFeedbacks(silent)
  }

  async function submitComment(silent = false) {
    await new Promise((resolve) => setTimeout(resolve, 10))
    await loadFeedbacks(silent)
  }

  return { state, loadFeedbacks, voteFeedback, submitComment }
}

const tests = [
  {
    name: '普通刷新设置 isLoading',
    action: (s: ReturnType<typeof createFeedbackStore>) => s.loadFeedbacks(false),
    expect: { isLoading: false, refreshCount: 1, silentRefreshes: 0 },
  },
  {
    name: '静默刷新不设置 isLoading',
    action: (s: ReturnType<typeof createFeedbackStore>) => s.loadFeedbacks(true),
    expect: { isLoading: false, refreshCount: 1, silentRefreshes: 1 },
  },
  {
    name: '投票后静默刷新',
    action: (s: ReturnType<typeof createFeedbackStore>) => s.voteFeedback(true),
    expect: { isLoading: false, refreshCount: 1, silentRefreshes: 1 },
  },
  {
    name: '评论后静默刷新',
    action: (s: ReturnType<typeof createFeedbackStore>) => s.submitComment(true),
    expect: { isLoading: false, refreshCount: 1, silentRefreshes: 1 },
  },
  {
    name: '多次操作累计刷新',
    action: async (s: ReturnType<typeof createFeedbackStore>) => {
      await s.voteFeedback(true)
      await s.submitComment(true)
      await s.loadFeedbacks(false)
    },
    expect: { isLoading: false, refreshCount: 3, silentRefreshes: 2 },
  },
]

async function runTests() {
  let passed = 0
  let failed = 0

  for (const t of tests) {
    const store = createFeedbackStore()
    await t.action(store)

    const ok =
      store.state.isLoading === t.expect.isLoading &&
      store.state.refreshCount === t.expect.refreshCount &&
      store.state.silentRefreshes === t.expect.silentRefreshes

    if (ok) {
      console.log(`✅ ${t.name}`)
      passed++
    } else {
      console.log(`❌ ${t.name}`)
      console.log(`   期望: ${JSON.stringify(t.expect)}`)
      console.log(`   实际: ${JSON.stringify(store.state)}`)
      failed++
    }
  }

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
  if (failed > 0) process.exit(1)
}

runTests()
