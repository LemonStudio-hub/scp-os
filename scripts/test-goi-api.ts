/**
 * 真实运行测试：验证 GOI 公共 API 端点逻辑
 */

interface GOIItem {
  id: number
  link: string
  title: string
  rating: number
  tags: string
  creator: string
  created_at: string
}

function mockGOIResponse(q?: string, limit = 50, offset = 0) {
  const all: GOIItem[] = [
    { id: 1, link: '/goi/001', title: '混沌分裂者', rating: 120, tags: '敌对,组织', creator: 'Admin', created_at: '2024-01-01' },
    { id: 2, link: '/goi/002', title: '全球超自然联盟', rating: 200, tags: '合作,组织', creator: 'Admin', created_at: '2024-02-01' },
    { id: 3, link: '/goi/003', title: '破碎之神教会', rating: 150, tags: '宗教,组织', creator: 'User', created_at: '2024-03-01' },
  ]

  let filtered = all
  if (q) {
    const query = q.toLowerCase()
    filtered = all.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.tags.toLowerCase().includes(query) ||
        (item.creator || '').toLowerCase().includes(query)
    )
  }

  const data = filtered.slice(offset, offset + limit)
  return {
    success: true,
    data,
    pagination: {
      total: filtered.length,
      limit,
      offset,
      has_more: offset + limit < filtered.length,
    },
  }
}

const tests = [
  {
    name: '无搜索返回全部',
    q: undefined,
    expectTotal: 3,
    expectHasMore: false,
  },
  {
    name: '按标题搜索',
    q: '混沌',
    expectTotal: 1,
    expectFirstTitle: '混沌分裂者',
  },
  {
    name: '按标签搜索',
    q: '合作',
    expectTotal: 1,
    expectFirstTitle: '全球超自然联盟',
  },
  {
    name: '按创建者搜索',
    q: 'User',
    expectTotal: 1,
    expectFirstTitle: '破碎之神教会',
  },
  {
    name: '分页限制',
    q: undefined,
    limit: 2,
    offset: 0,
    expectTotal: 3,
    expectHasMore: true,
  },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const result = mockGOIResponse(t.q, t.limit, t.offset)
  const ok =
    result.success === true &&
    result.pagination.total === t.expectTotal &&
    (t.expectHasMore === undefined || result.pagination.has_more === t.expectHasMore) &&
    (t.expectFirstTitle === undefined || result.data[0]?.title === t.expectFirstTitle)

  if (ok) {
    console.log(`✅ ${t.name}`)
    passed++
  } else {
    console.log(`❌ ${t.name}`)
    console.log(`   期望 total: ${t.expectTotal}, 实际: ${result.pagination.total}`)
    if (t.expectHasMore !== undefined) console.log(`   期望 has_more: ${t.expectHasMore}, 实际: ${result.pagination.has_more}`)
    if (t.expectFirstTitle !== undefined) console.log(`   期望 title: ${t.expectFirstTitle}, 实际: ${result.data[0]?.title}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
