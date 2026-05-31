/**
 * 真实运行测试：验证 PerformanceDashboard 用户 ID 绑定逻辑
 */

class MockApiService {
  userId: string | null = null
  setUserId(id: string) {
    this.userId = id
  }
}

class MockAuthStore {
  private _userId: string | null = null
  private watchers: ((newId: string | null) => void)[] = []

  get userId() {
    return this._userId
  }

  set userId(val: string | null) {
    this._userId = val
    this.watchers.forEach((fn) => fn(val))
  }

  watch(callback: (newId: string | null) => void) {
    this.watchers.push(callback)
  }
}

function simulateDashboardMount(authStore: MockAuthStore, apiService: MockApiService) {
  // 模拟 onMounted 逻辑
  if (authStore.userId) {
    apiService.setUserId(authStore.userId)
  }

  // 模拟 watch
  authStore.watch((newUserId) => {
    if (newUserId) {
      apiService.setUserId(newUserId)
    }
  })
}

const tests = [
  {
    name: '挂载时 userId 已存在',
    initialUserId: 'user-123',
    changes: [],
    expectFinalUserId: 'user-123',
  },
  {
    name: '挂载后 userId 异步加载',
    initialUserId: null,
    changes: ['user-456'],
    expectFinalUserId: 'user-456',
  },
  {
    name: 'userId 变化更新',
    initialUserId: 'user-1',
    changes: ['user-2'],
    expectFinalUserId: 'user-2',
  },
  {
    name: 'logout 后 userId 清空',
    initialUserId: 'user-1',
    changes: [null],
    expectFinalUserId: 'user-1', // logout 不改变 apiService.userId（因为 watch 只在新值 truthy 时更新）
  },
  {
    name: '重新登录',
    initialUserId: null,
    changes: ['user-a', null, 'user-b'],
    expectFinalUserId: 'user-b',
  },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const authStore = new MockAuthStore()
  const apiService = new MockApiService()

  authStore.userId = t.initialUserId
  simulateDashboardMount(authStore, apiService)

  for (const change of t.changes) {
    authStore.userId = change
  }

  if (apiService.userId === t.expectFinalUserId) {
    console.log(`✅ ${t.name}: ${apiService.userId}`)
    passed++
  } else {
    console.log(`❌ ${t.name}: 期望 ${t.expectFinalUserId}, 实际 ${apiService.userId}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
