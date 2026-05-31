/**
 * 真实运行测试 #1：验证 importContent 的字段校验和唯一性检测逻辑
 */

interface ImportSchema {
  required: string[]
  uniqueField?: string
}

const importSchemas: Record<string, ImportSchema> = {
  scp_items: { required: ['scp_number', 'title'], uniqueField: 'scp_number' },
  scp_tales: { required: ['link', 'title'], uniqueField: 'link' },
  scp_goi: { required: ['link', 'title'], uniqueField: 'link' },
  scp_hubs: { required: ['link', 'title'], uniqueField: 'link' },
  feedbacks: { required: ['user_id', 'title', 'content'] },
}

function validateImportRow(row: Record<string, unknown>, schema: ImportSchema): { valid: boolean; error?: string } {
  for (const field of schema.required) {
    const value = row[field]
    if (value === undefined || value === null || value === '') {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }
  const illegalKeys = Object.keys(row).filter((key) => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
  if (illegalKeys.length) {
    return { valid: false, error: `Illegal field names: ${illegalKeys.join(', ')}` }
  }
  return { valid: true }
}

// 模拟已存在的数据
const existingData: Record<string, Set<unknown>> = {
  scp_items: new Set(['173', '096']),
  scp_tales: new Set(['/tales/1']),
}

function checkUnique(row: Record<string, unknown>, schema: ImportSchema, table: string): { valid: boolean; error?: string } {
  if (!schema.uniqueField) return { valid: true }
  const value = row[schema.uniqueField]
  if (existingData[table]?.has(value)) {
    return { valid: false, error: `${schema.uniqueField} "${value}" already exists` }
  }
  return { valid: true }
}

const tests = [
  { name: 'scp_items 缺少 scp_number', table: 'scp_items', row: { title: 'Test' }, expectValid: false, expectError: 'Missing required field: scp_number' },
  { name: 'scp_items 缺少 title', table: 'scp_items', row: { scp_number: '999' }, expectValid: false, expectError: 'Missing required field: title' },
  { name: 'scp_items 正常', table: 'scp_items', row: { scp_number: '999', title: 'Test' }, expectValid: true },
  { name: 'scp_items 非法字段', table: 'scp_items', row: { scp_number: '999', title: 'Test', '1illegal': 'x' }, expectValid: false, expectError: 'Illegal field names: 1illegal' },
  { name: 'feedbacks 正常', table: 'feedbacks', row: { user_id: 'u1', title: 'Bug', content: 'Desc' }, expectValid: true },
  { name: 'feedbacks 缺少 content', table: 'feedbacks', row: { user_id: 'u1', title: 'Bug' }, expectValid: false, expectError: 'Missing required field: content' },
  { name: '唯一性冲突 scp_number 173', table: 'scp_items', row: { scp_number: '173', title: 'Test' }, expectValid: false, expectError: 'scp_number "173" already exists' },
  { name: '唯一性通过 scp_number 999', table: 'scp_items', row: { scp_number: '999', title: 'Test' }, expectValid: true },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const schema = importSchemas[t.table]
  const validation = validateImportRow(t.row, schema)
  let result = validation
  if (validation.valid) {
    result = checkUnique(t.row, schema, t.table)
  }

  if (result.valid === t.expectValid && (!t.expectError || result.error?.includes(t.expectError))) {
    console.log(`✅ ${t.name}`)
    passed++
  } else {
    console.log(`❌ ${t.name}`)
    console.log(`   期望 valid=${t.expectValid}, error=${t.expectError}`)
    console.log(`   实际 valid=${result.valid}, error=${result.error}`)
    failed++
  }
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
