/**
 * KV 内容预加载脚本
 * 从 scp-api-main 仓库的 content_*.json 文件预加载文章内容到 Cloudflare KV
 */

import * as fs from 'fs'
import * as path from 'path'
import * as cheerio from 'cheerio'

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
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ''
const KV_BATCH_SIZE = 10000
const DAILY_KEY_LIMIT = 900
const MAX_VALUE_SIZE = 25 * 1024 * 1024
const PROGRESS_FILE = path.join(__dirname, '.kv-preload-progress.json')

interface Progress {
  completedKeys: string[]
  date: string
  dailyCount: number
}

interface KvPair {
  key: string
  value: string
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

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    } catch {
      return { completedKeys: [], date: '', dailyCount: 0 }
    }
  }
  return { completedKeys: [], date: '', dailyCount: 0 }
}

function saveProgress(progress: Progress): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8')
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function readKvNamespaceId(): string {
  const wranglerPath = path.join(__dirname, '..', 'wrangler.toml')
  if (!fs.existsSync(wranglerPath)) {
    console.error(`wrangler.toml 不存在: ${wranglerPath}`)
    process.exit(1)
  }
  const content = fs.readFileSync(wranglerPath, 'utf-8')
  const kvSectionRegex = /\[\[kv_namespaces\]\][\s\S]*?binding\s*=\s*"SCP_CACHE"[\s\S]*?id\s*=\s*"([a-f0-9]+)"/
  const match = content.match(kvSectionRegex)
  if (match) {
    return match[1]
  }
  const fallbackRegex = /\[\[kv_namespaces\]\][\s\S]*?id\s*=\s*"([a-f0-9]+)"[\s\S]*?binding\s*=\s*"SCP_CACHE"/
  const fallbackMatch = content.match(fallbackRegex)
  if (fallbackMatch) {
    return fallbackMatch[1]
  }
  console.error('无法从 wrangler.toml 中读取 SCP_CACHE 的 namespace ID')
  process.exit(1)
}

function extractScpNumber(key: string): string | null {
  const match = key.match(/SCP-(\d+)/i)
  if (match) {
    return match[1]
  }
  return null
}

function cleanHtml(rawHtml: string): string {
  const $ = cheerio.load(rawHtml)

  const $content = $('#page-content')
  let html: string
  if ($content.length > 0) {
    $content.find('script').remove()
    $content.find('style').remove()
    $content.find('noscript').remove()
    $content.find('iframe').remove()
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
    $('body').find('script').remove()
    $('body').find('style').remove()
    $('body').find('noscript').remove()
    $('body').find('iframe').remove()
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

function collectAllEntries(dataPath: string): KvPair[] {
  const entries: KvPair[] = []

  const itemsDir = path.join(dataPath, 'items')
  const itemsFiles = collectContentFiles(itemsDir, /^content_.*\.json$/)
  for (const file of itemsFiles) {
    const data = loadJson(file)
    for (const [key, value] of Object.entries(data)) {
      if (!value.raw_content) continue
      const scpNumber = extractScpNumber(key)
      if (scpNumber) {
        entries.push({ key: `docs-content:${scpNumber}`, value: value.raw_content })
      }
    }
  }

  const talesDir = path.join(dataPath, 'tales')
  const talesFiles = collectContentFiles(talesDir, /^content_.*\.json$/)
  for (const file of talesFiles) {
    const data = loadJson(file)
    for (const [key, value] of Object.entries(data)) {
      if (!value.raw_content) continue
      entries.push({ key: `docs-tale:${key}`, value: value.raw_content })
    }
  }

  const goiDir = path.join(dataPath, 'goi')
  const goiFiles = collectContentFiles(goiDir, /^content_.*\.json$/)
  for (const file of goiFiles) {
    const data = loadJson(file)
    for (const [key, value] of Object.entries(data)) {
      if (!value.raw_content) continue
      entries.push({ key: `docs-goi:${key}`, value: value.raw_content })
    }
  }

  return entries
}

async function writeKvBatch(
  namespaceId: string,
  pairs: KvPair[]
): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/bulk`

  const body = pairs.map(p => ({ key: p.key, value: p.value }))

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Cloudflare API 错误 (${response.status}): ${text}`)
  }

  const result = await response.json() as any
  if (!result.success) {
    throw new Error(`Cloudflare API 返回失败: ${JSON.stringify(result.errors)}`)
  }
}

async function main() {
  console.log('=== KV 内容预加载脚本 ===')

  if (!CLOUDFLARE_API_TOKEN) {
    console.error('缺少环境变量 CLOUDFLARE_API_TOKEN')
    process.exit(1)
  }
  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error('缺少环境变量 CLOUDFLARE_ACCOUNT_ID')
    process.exit(1)
  }

  const dataPath = path.resolve(SCP_DATA_REPO_PATH)
  console.log(`数据路径: ${dataPath}`)
  if (!fs.existsSync(dataPath)) {
    console.error(`数据路径不存在: ${dataPath}`)
    process.exit(1)
  }

  const namespaceId = readKvNamespaceId()
  console.log(`KV Namespace ID: ${namespaceId}`)

  const allEntries = collectAllEntries(dataPath)
  console.log(`共收集到 ${allEntries.length} 条内容条目`)

  const progress = loadProgress()
  const today = getToday()
  if (progress.date !== today) {
    progress.date = today
    progress.dailyCount = 0
  }

  const completedSet = new Set(progress.completedKeys)
  const remaining = allEntries.filter(e => !completedSet.has(e.key))
  console.log(`已完成: ${completedSet.size}，剩余: ${remaining.length}`)

  const dailyRemaining = DAILY_KEY_LIMIT - progress.dailyCount
  if (dailyRemaining <= 0) {
    console.log(`今日已写入 ${progress.dailyCount} 个 key，达到每日限额 ${DAILY_KEY_LIMIT}，请明天再运行`)
    return
  }

  const toProcess = remaining.slice(0, dailyRemaining)
  console.log(`本次将处理 ${toProcess.length} 条（今日限额剩余 ${dailyRemaining}）`)

  const cleaned: KvPair[] = []
  const skipped: string[] = []

  for (const entry of toProcess) {
    const cleanedValue = cleanHtml(entry.value)
    const byteSize = Buffer.byteLength(cleanedValue, 'utf-8')
    if (byteSize > MAX_VALUE_SIZE) {
      console.warn(`  跳过 ${entry.key}: 大小 ${(byteSize / 1024 / 1024).toFixed(2)} MB 超过 25 MB 限制`)
      skipped.push(entry.key)
      progress.completedKeys.push(entry.key)
      progress.dailyCount++
      continue
    }
    cleaned.push({ key: entry.key, value: cleanedValue })
  }

  if (skipped.length > 0) {
    console.log(`跳过 ${skipped.length} 条超大内容`)
    saveProgress(progress)
  }

  console.log(`清洗后待写入: ${cleaned.length} 条`)

  let processedCount = 0
  for (let i = 0; i < cleaned.length; i += KV_BATCH_SIZE) {
    const batch = cleaned.slice(i, i + KV_BATCH_SIZE)
    const batchIndex = Math.floor(i / KV_BATCH_SIZE) + 1
    const totalBatches = Math.ceil(cleaned.length / KV_BATCH_SIZE)

    console.log(`写入批次 ${batchIndex}/${totalBatches}（${batch.length} 条）...`)

    try {
      await writeKvBatch(namespaceId, batch)
      console.log(`  批次 ${batchIndex} 写入成功`)

      for (const pair of batch) {
        progress.completedKeys.push(pair.key)
        progress.dailyCount++
        processedCount++
      }
      saveProgress(progress)
    } catch (error) {
      console.error(`  批次 ${batchIndex} 写入失败:`, error)
      saveProgress(progress)
      console.log(`已保存进度，可重新运行继续`)
      process.exit(1)
    }
  }

  console.log(`\n=== 预加载完成 ===`)
  console.log(`本次写入: ${processedCount} 条`)
  console.log(`跳过（超大）: ${skipped.length} 条`)
  console.log(`累计完成: ${progress.completedKeys.length} 条`)
  console.log(`今日写入: ${progress.dailyCount} 条`)
}

main().catch(error => {
  console.error('预加载失败:', error)
  process.exit(1)
})
