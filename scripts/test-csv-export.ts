/**
 * 真实运行测试 #1：验证 CSV 导出逻辑
 * 测试 convertToCsv 的各种边界情况
 */

function convertToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '﻿'
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '')
          if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`
          return val
        })
        .join(','),
    ),
  ]
  return '﻿' + lines.join('\n')
}

// 测试用例
const tests = [
  {
    name: '空数组应返回只有 BOM',
    input: [],
    expectStartsWith: '﻿',
    expectLines: 1,
  },
  {
    name: '基础数据',
    input: [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
    ],
    expectStartsWith: '﻿',
    expectLines: 3, // header + 2 rows
  },
  {
    name: '包含逗号的字段',
    input: [{ id: 1, desc: 'a, b, c' }],
    expectIncludes: '"a, b, c"',
    expectLines: 2,
  },
  {
    name: '包含双引号的字段',
    input: [{ id: 1, desc: 'say "hello"' }],
    expectIncludes: '"say ""hello"""',
    expectLines: 2,
  },
  {
    name: '包含换行符的字段',
    input: [{ id: 1, desc: 'line1\nline2' }],
    expectIncludes: '"line1\nline2"',
    // CSV 中引号内换行是合法的，不能简单用 split('\n') 计行
  },
  {
    name: 'null/undefined 值',
    input: [{ id: 1, name: null, age: undefined }],
    expectIncludes: ',,',
    expectLines: 2,
  },
  {
    name: '包含回车符的字段',
    input: [{ id: 1, desc: 'line1\rline2' }],
    expectIncludes: '"line1\rline2"',
  },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const result = convertToCsv(t.input)
  const lines = result.split('\n')
  let ok = true
  const errors: string[] = []

  if (t.expectStartsWith !== undefined && !result.startsWith(t.expectStartsWith)) {
    ok = false
    errors.push(`应开头为 BOM，实际开头: ${JSON.stringify(result.slice(0, 5))}`)
  }
  if (t.expectLines !== undefined && lines.length !== t.expectLines) {
    ok = false
    errors.push(`应有 ${t.expectLines} 行，实际 ${lines.length} 行`)
  }
  if (t.expectIncludes !== undefined && !result.includes(t.expectIncludes)) {
    ok = false
    errors.push(`应包含 ${JSON.stringify(t.expectIncludes)}，实际: ${JSON.stringify(result)}`)
  }

  if (ok) {
    console.log(`✅ ${t.name}`)
    passed++
  } else {
    console.log(`❌ ${t.name}`)
    errors.forEach((e) => console.log(`   ${e}`))
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
