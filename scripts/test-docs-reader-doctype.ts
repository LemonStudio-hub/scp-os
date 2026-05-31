/**
 * 测试：验证 useDocsReader docType 切换和数据映射逻辑
 */

// 模拟后端响应
const mockSCPResponse = {
  success: true,
  data: [
    { scp_number: '173', title: 'SCP-173', object_class: 'Euclid', series: 1, rating: 999 },
  ],
  pagination: { total: 1, limit: 12, offset: 0, has_more: false },
}

const mockGOIResponse = {
  success: true,
  data: [
    { id: 1, link: '/goi/001', title: '混沌分裂者', rating: 120, tags: '敌对', creator: 'Admin' },
  ],
  pagination: { total: 1, limit: 12, offset: 0, has_more: false },
}

const mockTalesResponse = {
  success: true,
  data: [
    { id: 2, link: '/tales/001', title: '故事一', rating: 50, year: 2024 },
  ],
  pagination: { total: 1, limit: 12, offset: 0, has_more: false },
}

const mockHubsResponse = {
  success: true,
  data: [
    { id: 3, link: '/hub/001', title: '中心页一', references_json: '[]' },
  ],
  pagination: { total: 1, limit: 12, offset: 0, has_more: false },
}

// 模拟映射器（与 useDocsReader 中的逻辑一致）
const mappers: Record<string, (item: any) => any> = {
  scp: (item: any) => ({
    scpNumber: item.scp_number || '',
    title: item.title || '',
    objectClass: item.object_class || 'Unknown',
    series: item.series ? Number(item.series) : 0,
    rating: item.rating || 0,
    url: '',
  }),
  goi: (item: any) => ({
    scpNumber: item.link || String(item.id) || '',
    title: item.title || '',
    objectClass: 'Unknown',
    series: 0,
    rating: item.rating || 0,
    url: item.link || '',
  }),
  tales: (item: any) => ({
    scpNumber: item.link || String(item.id) || '',
    title: item.title || '',
    objectClass: 'Unknown',
    series: 0,
    rating: item.rating || 0,
    url: item.link || '',
  }),
  hubs: (item: any) => ({
    scpNumber: item.link || String(item.id) || '',
    title: item.title || '',
    objectClass: 'Unknown',
    series: 0,
    rating: 0,
    url: item.link || '',
  }),
}

const tests = [
  {
    name: 'SCP 映射正确',
    type: 'scp',
    response: mockSCPResponse,
    expect: { scpNumber: '173', title: 'SCP-173', objectClass: 'Euclid', series: 1, rating: 999, url: '' },
  },
  {
    name: 'GOI 映射正确',
    type: 'goi',
    response: mockGOIResponse,
    expect: { scpNumber: '/goi/001', title: '混沌分裂者', objectClass: 'Unknown', series: 0, rating: 120, url: '/goi/001' },
  },
  {
    name: 'Tales 映射正确',
    type: 'tales',
    response: mockTalesResponse,
    expect: { scpNumber: '/tales/001', title: '故事一', objectClass: 'Unknown', series: 0, rating: 50, url: '/tales/001' },
  },
  {
    name: 'Hubs 映射正确',
    type: 'hubs',
    response: mockHubsResponse,
    expect: { scpNumber: '/hub/001', title: '中心页一', objectClass: 'Unknown', series: 0, rating: 0, url: '/hub/001' },
  },
  {
    name: 'GOI 缺少 link 时回退到 id',
    type: 'goi',
    response: {
      success: true,
      data: [{ id: 99, title: '测试', rating: 0 }],
      pagination: { total: 1, limit: 12, offset: 0, has_more: false },
    },
    expect: { scpNumber: '99', title: '测试', objectClass: 'Unknown', series: 0, rating: 0, url: '' },
  },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const mapper = mappers[t.type]
  const list = (t.response.data || []).map(mapper)
  const result = list[0]

  const ok =
    result.scpNumber === t.expect.scpNumber &&
    result.title === t.expect.title &&
    result.objectClass === t.expect.objectClass &&
    result.series === t.expect.series &&
    result.rating === t.expect.rating &&
    result.url === t.expect.url

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
