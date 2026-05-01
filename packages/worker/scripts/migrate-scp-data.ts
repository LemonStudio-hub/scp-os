/**
 * SCP 数据迁移脚本
 * 从 scp-api-main 仓库的 JSON 数据文件迁移到 D1 数据库
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

function loadEnvFile() {
  const envPaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '.env'),
  ]
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIndex = trimmed.indexOf('=')
          if (eqIndex > 0) {
            const key = trimmed.slice(0, eqIndex).trim()
            const value = trimmed.slice(eqIndex + 1).trim()
            if (!process.env[key]) {
              process.env[key] = value
            }
          }
        }
      }
      break
    }
  }
}
loadEnvFile()

const SCP_DATA_REPO_PATH = process.env.SCP_DATA_REPO_PATH || '../scp-api-main/docs/data/scp'
const BATCH_SIZE = 500
const DB_NAME = 'scp-reader-db'

const OBJECT_CLASSES = ['safe', 'euclid', 'keter', 'neutralized', 'thaumiel', 'apollyon']

function escapeSql(str: string): string {
  return str.replace(/'/g, "''")
}

function extractObjectClass(tags: string[]): string {
  for (const tag of tags) {
    const lower = tag.toLowerCase()
    if (OBJECT_CLASSES.includes(lower)) {
      return lower.toUpperCase()
    }
  }
  return 'UNKNOWN'
}

function calculateClearanceLevel(objectClass: string): number {
  switch (objectClass) {
    case 'APOLLYON': return 5
    case 'THAUMIEL': return 5
    case 'KETER': return 4
    case 'EUCLID': return 3
    case 'SAFE': return 2
    case 'NEUTRALIZED': return 1
    default: return 1
  }
}

function calculateSeries(scpNumber: number): string {
  if (scpNumber >= 1 && scpNumber <= 999) return '1'
  if (scpNumber >= 1000 && scpNumber <= 1999) return '2'
  if (scpNumber >= 2000 && scpNumber <= 2999) return '3'
  if (scpNumber >= 3000 && scpNumber <= 3999) return '4'
  if (scpNumber >= 4000 && scpNumber <= 4999) return '5'
  if (scpNumber >= 5000 && scpNumber <= 5999) return '6'
  if (scpNumber >= 6000 && scpNumber <= 6999) return '7'
  if (scpNumber >= 7000 && scpNumber <= 7999) return '8'
  if (scpNumber >= 8000 && scpNumber <= 8999) return '9'
  return String(Math.floor(scpNumber / 1000) + 1)
}

function extractScpNumber(key: string): number | null {
  const match = key.match(/SCP-(\d+)/i)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

function extractYear(createdAt: string): number | null {
  if (!createdAt) return null
  const match = createdAt.match(/(\d{4})/)
  return match ? parseInt(match[1], 10) : null
}

function loadJson(filePath: string): Record<string, any> {
  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) {
    console.warn(`  文件不存在: ${resolved}`)
    return {}
  }
  const raw = fs.readFileSync(resolved, 'utf-8')
  return JSON.parse(raw)
}

function generateItemsSql(entries: [string, any][]): string[] {
  const statements: string[] = []
  for (const [key, data] of entries) {
    const num = extractScpNumber(key)
    if (num === null) continue

    const objectClass = extractObjectClass(data.tags || [])
    const series = calculateSeries(num)
    const clearanceLevel = calculateClearanceLevel(objectClass)
    const title = escapeSql(data.title || key)
    const tags = escapeSql((data.tags || []).join(','))
    const creator = escapeSql(data.creator || '')
    const createdAt = data.created_at || ''
    const rating = data.rating || 0
    const contentFile = escapeSql(data.content_file || '')
    const hasContent = data.content_file ? 1 : 0

    statements.push(
      `INSERT OR REPLACE INTO scp_items (scp_number, title, object_class, series, rating, tags, creator, created_at, clearance_level, has_content, content_file) ` +
      `VALUES ('${num}', '${title}', '${objectClass}', '${series}', ${rating}, '${tags}', '${creator}', '${createdAt}', ${clearanceLevel}, ${hasContent}, '${contentFile}');`
    )
  }
  return statements
}

function generateTalesSql(entries: [string, any][]): string[] {
  const statements: string[] = []
  for (const [key, data] of entries) {
    const link = escapeSql(key)
    const title = escapeSql(data.title || key)
    const year = extractYear(data.created_at || '')
    const rating = data.rating || 0
    const tags = escapeSql((data.tags || []).join(','))
    const creator = escapeSql(data.creator || '')
    const createdAt = data.created_at || ''
    const contentFile = escapeSql(data.content_file || '')

    statements.push(
      `INSERT OR REPLACE INTO scp_tales (link, title, year, rating, tags, creator, created_at, content_file) ` +
      `VALUES ('${link}', '${title}', ${year !== null ? year : 'NULL'}, ${rating}, '${tags}', '${creator}', '${createdAt}', '${contentFile}');`
    )
  }
  return statements
}

function generateGoiSql(entries: [string, any][]): string[] {
  const statements: string[] = []
  for (const [key, data] of entries) {
    const link = escapeSql(key)
    const title = escapeSql(data.title || key)
    const rating = data.rating || 0
    const tags = escapeSql((data.tags || []).join(','))
    const creator = escapeSql(data.creator || '')
    const createdAt = data.created_at || ''

    statements.push(
      `INSERT OR REPLACE INTO scp_goi (link, title, rating, tags, creator, created_at) ` +
      `VALUES ('${link}', '${title}', ${rating}, '${tags}', '${creator}', '${createdAt}');`
    )
  }
  return statements
}

function generateHubsSql(entries: [string, any][]): string[] {
  const statements: string[] = []
  for (const [key, data] of entries) {
    const link = escapeSql(key)
    const title = escapeSql(data.title || key)
    const tags = escapeSql((data.tags || []).join(','))
    const references = escapeSql(JSON.stringify(data.references || []))

    statements.push(
      `INSERT OR REPLACE INTO scp_hubs (link, title, references_json, tags) ` +
      `VALUES ('${link}', '${title}', '${references}', '${tags}');`
    )
  }
  return statements
}

function executeBatch(sqlStatements: string[], batchIndex: number, tableName: string): void {
  const tmpDir = path.join(__dirname, '.tmp-sql')
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  const sqlFile = path.join(tmpDir, `migrate_${tableName}_batch_${batchIndex}.sql`)
  const header = [
    `-- SCP 数据迁移脚本 - ${tableName} 批次 ${batchIndex}`,
    `-- 生成时间: ${new Date().toISOString()}`,
    '',
    '',
  ].join('\n')

  fs.writeFileSync(sqlFile, header + sqlStatements.join('\n') + '\n')

  console.log(`  执行批次 ${batchIndex}: ${sqlStatements.length} 条记录 -> ${sqlFile}`)

  try {
    execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file="${sqlFile}"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    })
    console.log(`  批次 ${batchIndex} 执行成功`)
  } catch (error) {
    console.error(`  批次 ${batchIndex} 执行失败:`, error)
    throw error
  }
}

function processBatchedInserts(
  sqlStatements: string[],
  tableName: string
): void {
  const totalBatches = Math.ceil(sqlStatements.length / BATCH_SIZE)
  console.log(`\n  共 ${sqlStatements.length} 条记录，分 ${totalBatches} 批执行（每批 ${BATCH_SIZE} 条）`)

  for (let i = 0; i < sqlStatements.length; i += BATCH_SIZE) {
    const batch = sqlStatements.slice(i, i + BATCH_SIZE)
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1
    executeBatch(batch, batchIndex, tableName)
  }
}

async function main() {
  console.log('=== SCP 数据迁移脚本 ===')
  console.log(`数据路径: ${path.resolve(SCP_DATA_REPO_PATH)}\n`)

  const dataPath = path.resolve(SCP_DATA_REPO_PATH)
  if (!fs.existsSync(dataPath)) {
    console.error(`数据路径不存在: ${dataPath}`)
    process.exit(1)
  }

  // 1. 迁移 scp_items
  console.log('[1/4] 迁移 scp_items...')
  const itemsData = loadJson(path.join(dataPath, 'items', 'index.json'))
  const itemsEntries = Object.entries(itemsData)
  console.log(`  读取到 ${itemsEntries.length} 条 items 记录`)
  if (itemsEntries.length > 0) {
    const itemsSql = generateItemsSql(itemsEntries)
    processBatchedInserts(itemsSql, 'scp_items')
  }

  // 2. 迁移 scp_tales
  console.log('\n[2/4] 迁移 scp_tales...')
  const talesData = loadJson(path.join(dataPath, 'tales', 'index.json'))
  const talesEntries = Object.entries(talesData)
  console.log(`  读取到 ${talesEntries.length} 条 tales 记录`)
  if (talesEntries.length > 0) {
    const talesSql = generateTalesSql(talesEntries)
    processBatchedInserts(talesSql, 'scp_tales')
  }

  // 3. 迁移 scp_goi
  console.log('\n[3/4] 迁移 scp_goi...')
  const goiData = loadJson(path.join(dataPath, 'goi', 'index.json'))
  const goiEntries = Object.entries(goiData)
  console.log(`  读取到 ${goiEntries.length} 条 goi 记录`)
  if (goiEntries.length > 0) {
    const goiSql = generateGoiSql(goiEntries)
    processBatchedInserts(goiSql, 'scp_goi')
  }

  // 4. 迁移 scp_hubs
  console.log('\n[4/4] 迁移 scp_hubs...')
  const hubsData = loadJson(path.join(dataPath, 'hubs', 'index.json'))
  const hubsEntries = Object.entries(hubsData)
  console.log(`  读取到 ${hubsEntries.length} 条 hubs 记录`)
  if (hubsEntries.length > 0) {
    const hubsSql = generateHubsSql(hubsEntries)
    processBatchedInserts(hubsSql, 'scp_hubs')
  }

  // 清理临时文件
  const tmpDir = path.join(__dirname, '.tmp-sql')
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true })
    console.log('\n已清理临时 SQL 文件')
  }

  console.log('\n=== 迁移完成 ===')
}

main().catch(error => {
  console.error('迁移失败:', error)
  process.exit(1)
})
