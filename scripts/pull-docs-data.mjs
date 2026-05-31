import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const outDir = path.join(repoRoot, 'packages', 'app', 'public', 'docs-data')
const scpDir = path.join(outDir, 'scp')

const API_BASE = process.env.DOCS_API_BASE || 'https://os1api.daum.pw'
const NUMBERS = [
  '002',
  '003',
  '004',
  '005',
  '006',
  '007',
  '008',
  '009',
  '010',
  '011',
  '012',
  '013',
  '014',
  '015',
  '016',
  '017',
  '018',
  '019',
  '020',
  '035',
  '049',
  '055',
  '079',
  '087',
  '096',
  '106',
  '173',
  '294',
  '500',
  '682',
  '914',
  '999',
  '2000',
  '2316',
  '3000',
  '3008',
  '4000',
  '5000',
  '6000',
]

const CLASS_MAP = {
  SAFE: 'Safe',
  EUCLID: 'Euclid',
  KETER: 'Keter',
  THAUMIEL: 'Thaumiel',
  NEUTRALIZED: 'Neutralized',
  APOLLYON: 'Unknown',
  UNKNOWN: 'Unknown',
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function htmlEscape(value) {
  return decodeEntities(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cleanText(value) {
  const markers = [
    '‡ Licensing',
    'Licensing / Citation',
    'Cite this page as:',
    '_licensebox',
    'page revision:',
    'Edit Rate',
    'Unless otherwise stated',
    '« SCP-',
    '芦 SCP-',
  ]
  let text = decodeEntities(value).replace(/\s+/g, ' ').trim()
  for (const marker of markers) {
    const index = text.indexOf(marker)
    if (index !== -1) text = text.slice(0, index).trim()
  }
  return text
}

function paragraphBlock(items) {
  return items
    .map(cleanText)
    .filter(Boolean)
    .map((item) => `<p>${htmlEscape(item)}</p>`)
    .join('\n')
}

function articleHtml(data, objectClass) {
  const containment = paragraphBlock(data.containment || [])
  const description = paragraphBlock(data.description || [])
  const appendix = paragraphBlock(data.appendix || [])
  const sections = [
    `<h1>${htmlEscape(data.id || '')}</h1>`,
    `<p><strong>Object Class:</strong> ${htmlEscape(objectClass)}</p>`,
  ]

  if (containment) sections.push('<h2>Special Containment Procedures</h2>', containment)
  if (description) sections.push('<h2>Description</h2>', description)
  if (appendix) sections.push('<h2>Appendix</h2>', appendix)
  if (data.url) {
    sections.push(
      `<hr><p><small>Source: <a href="${htmlEscape(data.url)}" target="_blank" rel="noopener noreferrer">${htmlEscape(data.url)}</a></small></p>`
    )
  }

  return sections.join('\n')
}

function wordCount(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

function normalizeClass(value) {
  return CLASS_MAP[String(value || '').toUpperCase()] || 'Unknown'
}

function seriesFor(number) {
  const numeric = Number(number)
  return Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric / 1000) + 1) : 0
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function fetchScp(number) {
  const url = `${API_BASE}/scrape?number=${encodeURIComponent(number)}&branch=en`
  const payload = await fetchJson(url)
  if (!payload?.success || !payload.data) {
    throw new Error(payload?.error || 'Empty response')
  }
  const data = payload.data
  const scpNumber = String(data.id || `SCP-${number}`).replace(/^SCP-/i, '').padStart(3, '0')
  const objectClass = normalizeClass(data.objectClass)
  const content = articleHtml(data, objectClass)

  return {
    detail: {
      scpNumber,
      title: String(data.name || `SCP-${scpNumber}`),
      objectClass,
      series: seriesFor(scpNumber),
      rating: 0,
      url: data.url || `https://scp-wiki.wikidot.com/scp-${scpNumber}`,
      content,
      rawHtml: content,
      wordCount: wordCount(content),
    },
    listItem: {
      scpNumber,
      title: String(data.name || `SCP-${scpNumber}`),
      objectClass,
      series: seriesFor(scpNumber),
      rating: 0,
      url: data.url || `https://scp-wiki.wikidot.com/scp-${scpNumber}`,
      contentPath: `scp/${scpNumber}.json`,
    },
  }
}

async function main() {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(scpDir, { recursive: true })

  const scp = []
  const failures = []

  for (const number of NUMBERS) {
    try {
      const { detail, listItem } = await fetchScp(number)
      await writeFile(path.join(scpDir, `${listItem.scpNumber}.json`), `${JSON.stringify(detail, null, 2)}\n`, 'utf8')
      scp.push(listItem)
      console.log(`ok SCP-${listItem.scpNumber}`)
    } catch (error) {
      failures.push({ number, error: error instanceof Error ? error.message : String(error) })
      console.warn(`fail SCP-${number}: ${failures.at(-1).error}`)
    }
  }

  scp.sort((a, b) => Number(a.scpNumber) - Number(b.scpNumber))

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: API_BASE,
    scp,
    goi: [],
    tales: [],
    hubs: [],
    failures,
  }

  await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`wrote ${scp.length} local SCP docs to ${path.relative(repoRoot, outDir)}`)
  if (failures.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
