/**
 * D1 内容预加载脚本
 * 从 scp-api-main 仓库的 content_*.json 文件预加载文章内容到 D1
 * 生成 SQL 文件，用 wrangler d1 execute 执行
 */

import * as fs from 'fs'
import * as path from 'path'
import * as cheerio from 'cheerio'

const SCP_DATA_REPO_PATH = process.env.SCP_DATA_REPO_PATH || '../scp-api-main/docs/data/scp'
const SQL_OUTPUT_DIR = path.join(__dirname, '.preload-sql')
const MAX_SQL_FILE_SIZE = 5 * 1024 * 1024 // 5MB per SQL file

interface ContentEntry {
  table: string
  key: string
  keyColumn: string
  content: string
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

function extractScpNumber(key: string): string | null {
  const match = key.match(/SCP-(\d+)/i)
  return match ? match[1] : null
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''")
}

function cleanHtml(rawHtml: string): string {
  const $ = cheerio.load(rawHtml)

  const $content = $('#page-content')
  let html: string
  if ($content.length > 0) {
    $content.find('script, style, noscript, iframe').remove()
    $content.find('[id*="nitro"], [class*="nitro"], [id*="adsense"], [class*="adsense"]').remove()
    $content.find('.ad-banner, .advertisement, .ad-container, .adsense, .side-box').remove()
    $content.find('.page-rate, .rate-widget, [class*="page-rate"]').remove()
    $content.find('.page-info, .page-tags, .page-options').remove()
    $content.find('.page-footer, .page-meta, .page-versions').remove()
    $content.find('.license-box, .page-source, .page-history').remove()
    $content.find('.page-discuss, .page-edited, [class*="wikiwalk-nav"]').remove()
    $content.find('[class*="footer-nav"], [class*="wikidot"]').remove()
    $content.find('#side-bar, #top-bar, #header, #footer').remove()
    $content.find('#navi-bar, #login-status, #account-topbar').remove()
    $content.find('#action-area-top, #action-area-bottom, .page-watch-options').remove()
    $content.find('#extra-div-1, #extra-div-2, #container-wrap').remove()
    $content.find('[style*="display:none"], [hidden]').remove()
    html = $content.html() || ''
  } else {
    $('body').find('script, style, noscript, iframe').remove()
    $('body').find('[id*="nitro"], [class*="nitro"], [id*="adsense"], [class*="adsense"]').remove()
    $('body').find('.ad-banner, .advertisement, .ad-container, .adsense, .side-box').remove()
    $('body').find('.page-rate, .rate-widget, [class*="page-rate"]').remove()
    $('body').find('.page-info, .page-tags, .page-options').remove()
    $('body').find('.page-footer, .page-meta, .page-versions').remove()
    $('body').find('.license-box, .page-source, .page-history').remove()
    $('body').find('.page-discuss, .page-edited, [class*="wikiwalk-nav"]').remove()
    $('body').find('[class*="footer-nav"], [class*="wikidot"]').remove()
    $('body').find('#side-bar, #top-bar, #header, #footer').remove()
    $('body').find('#navi-bar, #login-status, #account-topbar').remove()
    $('body').find('#action-area-top, #action-area-bottom, .page-watch-options').remove()
    $('body').find('#extra-div-1, #extra-div-2, #container-wrap').remove()
    $('body').find('[style*="display:none"], [hidden]').remove()
    html = $('body').html() || ''
  }

  return html.trim()
}

function collectContentFiles(dir: string, pattern: RegExp): string[] {
  if (!fs.existsSync(dir)) {
    console.warn(`  目录不存在: ${dir}`)
    return []
  }
  const files: string[] = []
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isFile() && pattern.test(entry)) {
      files.push(fullPath)
    }
  }
  return files
}

function collectAllEntries(dataPath: string): ContentEntry[] {
  const entries: ContentEntry[] = []

  // SCP Items
  const itemsDir = path.join(dataPath, 'items')
  const itemsFiles = collectContentFiles(itemsDir, /^content_.*\.json$/)
  for (const file of itemsFiles) {
    const data = loadJson(file)
    for (const [key, value] of Object.entries(data)) {
      if (!value.raw_content) continue
      const scpNumber = extractScpNumber(key)
      if (scpNumber) {
        entries.push({
          table: 'scp_items',
          key: scpNumber,
          keyColumn: 'scp_number',
          content: cleanHtml(value.raw_content),
        })
      }
    }
  }

  // Tales
  const talesDir = path.join(dataPath, 'tales')
  const talesFiles = collectContentFiles(talesDir, /^content_.*\.json$/)
  for (const file of talesFiles) {
    const data = loadJson(file)
    for (const [key, value] of Object.entries(data)) {
      if (!value.raw_content) continue
      entries.push({
        table: 'scp_tales',
        key: key,
        keyColumn: 'link',
        content: cleanHtml(value.raw_content),
      })
    }
  }

  // GOI
  const goiDir = path.join(dataPath, 'goi')
  const goiFiles = collectContentFiles(goiDir, /^content_.*\.json$/)
  for (const file of goiFiles) {
    const data = loadJson(file)
    for (const [key, value] of Object.entries(data)) {
      if (!value.raw_content) continue
      entries.push({
        table: 'scp_goi',
        key: key,
        keyColumn: 'link',
        content: cleanHtml(value.raw_content),
      })
    }
  }

  return entries
}

function generateSqlFiles(entries: ContentEntry[]): string[] {
  if (!fs.existsSync(SQL_OUTPUT_DIR)) {
    fs.mkdirSync(SQL_OUTPUT_DIR, { recursive: true })
  }

  const files: string[] = []
  let currentSql = ''
  let fileIndex = 1

  for (const entry of entries) {
    const escapedContent = escapeSql(entry.content)
    const escapedKey = escapeSql(entry.key)
    const sql = `UPDATE ${entry.table} SET content = '${escapedContent}' WHERE ${entry.keyColumn} = '${escapedKey}';\n`

    if (currentSql.length + sql.length > MAX_SQL_FILE_SIZE && currentSql.length > 0) {
      const filePath = path.join(SQL_OUTPUT_DIR, `preload_${fileIndex}.sql`)
      fs.writeFileSync(filePath, currentSql, 'utf-8')
      files.push(filePath)
      fileIndex++
      currentSql = ''
    }

    currentSql += sql
  }

  if (currentSql.length > 0) {
    const filePath = path.join(SQL_OUTPUT_DIR, `preload_${fileIndex}.sql`)
    fs.writeFileSync(filePath, currentSql, 'utf-8')
    files.push(filePath)
  }

  return files
}

function main() {
  console.log('=== D1 内容预加载脚本 ===')

  const dataPath = path.resolve(SCP_DATA_REPO_PATH)
  console.log(`数据路径: ${dataPath}`)
  if (!fs.existsSync(dataPath)) {
    console.error(`数据路径不存在: ${dataPath}`)
    process.exit(1)
  }

  const allEntries = collectAllEntries(dataPath)
  console.log(`共收集到 ${allEntries.length} 条内容条目`)

  if (allEntries.length === 0) {
    console.log('没有需要处理的内容')
    return
  }

  console.log(`清洗后待写入: ${allEntries.length} 条`)

  const sqlFiles = generateSqlFiles(allEntries)
  console.log(`\n生成了 ${sqlFiles.length} 个 SQL 文件：`)
  for (const file of sqlFiles) {
    console.log(`  ${file}`)
  }

  console.log(`\n=== 使用方法 ===`)
  console.log(`执行以下命令将内容写入 D1：`)
  console.log(``)
  for (const file of sqlFiles) {
    console.log(`npx wrangler d1 execute scp-reader-db --file "${file}"`)
  }
  console.log(``)
  console.log(`注意：scp-reader-db 和 scp-database 都需要执行（如果都用到了 content 列）`)
}

main()
