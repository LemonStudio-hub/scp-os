/**
 * SCP 数据库填充脚本
 * 从 SCP Wiki 爬取数据并填充到 D1 数据库
 * 遵守速率限制：每次请求间隔 1 秒
 */

const CONFIG = {
  baseUrl: 'https://scp-wiki-cn.wikidot.com',
  delay: 1000, // 1 秒延迟，遵守 robots 协议
  batchSize: 10, // 每批处理 10 个
}

/**
 * 睡眠函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 获取页面内容
 */
async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SCP-Foundation-Terminal/3.0.2 (+https://github.com/LemonStudio-hub/scp-os)',
      'Accept': 'text/html',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.text()
}

/**
 * 从系列页面提取 SCP 编号
 */
function extractSCPNumbers(html: string): string[] {
  const numbers: string[] = []
  const pattern = /href="\/scp-(\d+)"/g
  let match

  const seen = new Set<string>()

  while ((match = pattern.exec(html)) !== null) {
    const number = match[1]
    const num = parseInt(number)

    // 验证编号范围 (1-99999)
    if (num >= 1 && num <= 99999 && !seen.has(number)) {
      seen.add(number)
      numbers.push(number)
    }
  }

  return [...new Set(numbers)].sort((a, b) => parseInt(a) - parseInt(b))
}

/**
 * 解析 SCP 页面
 */
function parseSCPPage(html: string, scpNumber: string): {
  name: string
  objectClass: string
  tags: string[]
} {
  // 提取标题
  const titleMatch = html.match(/<title>(.*?)<\/title>/)
  const name = titleMatch ? titleMatch[1].replace(/ - SCP Foundation/, '').trim() : `SCP-${scpNumber}`

  // 提取项目等级
  const classMatch = html.match(/项目等级[:：]\s*([^\n<]+)/)
  let objectClass = 'UNKNOWN'
  if (classMatch) {
    const classText = classMatch[1].trim().toUpperCase()
    if (classText.includes('KETER') || classText.includes('刻耳柏洛斯')) {
      objectClass = 'KETER'
    } else if (classText.includes('EUCLID') || classText.includes('欧几里得')) {
      objectClass = 'EUCLID'
    } else if (classText.includes('SAFE') || classText.includes('安全')) {
      objectClass = 'SAFE'
    } else if (classText.includes('THAUMIEL') || classText.includes('塔露拉')) {
      objectClass = 'THAUMIEL'
    }
  }

  // 提取标签
  const tagsMatch = html.match(/<div class="page-tags">[\s\S]*?<\/div>/)
  const tags: string[] = []
  if (tagsMatch) {
    const tagMatches = tagsMatch[0].matchAll(/<a[^>]*>([^<]+)<\/a>/g)
    for (const match of tagMatches) {
      const tag = match[1].trim()
      if (tag && !tag.startsWith('+')) {
        tags.push(tag)
      }
    }
  }

  return {
    name,
    objectClass,
    tags: tags.slice(0, 10), // 最多保留 10 个标签
  }
}

/**
 * 计算权限等级
 */
function calculateClearanceLevel(objectClass: string, tags: string[]): number {
  // KETER 级别较高
  if (objectClass === 'KETER') {
    return 4
  }
  // THAUMIEL 级别最高
  if (objectClass === 'THAUMIEL') {
    return 5
  }
  // EUCLID 级别中等
  if (objectClass === 'EUCLID') {
    return 3
  }
  // SAFE 级别较低
  if (objectClass === 'SAFE') {
    return 2
  }
  // 根据标签调整
  const dangerTags = ['危险', '致命', '杀戮', '腐蚀', '传染']
  for (const tag of tags) {
    if (dangerTags.some(d => tag.includes(d))) {
      return 3
    }
  }
  return 1
}

/**
 * 主函数
 */
async function main() {
  console.log('=== SCP 数据库填充脚本 ===')
  console.log('遵守速率限制：每次请求间隔 1 秒\n')

  try {
    // 1. 从系列页面获取所有 SCP 编号
    console.log('步骤 1: 获取 SCP 编号列表...')
    const seriesPages = ['scp-series', 'scp-series-2', 'scp-series-cn']
    const allNumbers: string[] = []

    for (const series of seriesPages) {
      console.log(`  正在爬取 ${series}...`)
      try {
        const html = await fetchPage(`${CONFIG.baseUrl}/${series}`)
        const numbers = extractSCPNumbers(html)
        allNumbers.push(...numbers)
        console.log(`  从 ${series} 提取到 ${numbers.length} 个编号`)
        await sleep(CONFIG.delay)
      } catch (error) {
        console.error(`  爬取 ${series} 失败:`, error)
      }
    }

    // 去重并排序
    const uniqueNumbers = [...new Set(allNumbers)]
      .sort((a, b) => parseInt(a) - parseInt(b))

    console.log(`\n总共发现 ${uniqueNumbers.length} 个 SCP 编号`)
    console.log('前 20 个:', uniqueNumbers.slice(0, 20).join(', '))

    // 2. 生成 SQL 插入语句
    console.log('\n步骤 2: 生成插入语句...')
    const sqlStatements: string[] = []

    for (let i = 0; i < Math.min(uniqueNumbers.length, 20); i++) { // 限制前 20 个进行演示
      const number = uniqueNumbers[i]
      const scpId = parseInt(number)

      console.log(`  处理 SCP-${number} (${i + 1}/${Math.min(uniqueNumbers.length, 100)})...`)

      try {
        const html = await fetchPage(`${CONFIG.baseUrl}/scp-${number}`)
        const { name, objectClass, tags } = parseSCPPage(html, number)
        const clearanceLevel = calculateClearanceLevel(objectClass, tags)

        const tagsStr = tags.join(' ')

        sqlStatements.push(
          `INSERT OR REPLACE INTO scp_index (scp_id, name, object_class, tags, clearance_level) ` +
          `VALUES (${scpId}, '${name.replace(/'/g, "''")}', '${objectClass}', '${tagsStr}', ${clearanceLevel});`
        )

        console.log(`    ✓ ${name} [${objectClass}] 权限:${clearanceLevel}`)

        await sleep(CONFIG.delay)
      } catch (error) {
        console.error(`    ✗ 处理 SCP-${number} 失败:`, error)
        // 插入默认数据
        sqlStatements.push(
          `INSERT OR REPLACE INTO scp_index (scp_id, name, object_class, tags, clearance_level) ` +
          `VALUES (${scpId}, 'SCP-${number}', 'UNKNOWN', '', 1);`
        )
      }
    }

    // 3. 输出 SQL 文件
    console.log('\n步骤 3: 生成 SQL 文件...')
    const sqlContent = [
      '-- SCP 数据库填充脚本',
      '-- 生成时间: ' + new Date().toISOString(),
      '-- 遵守速率限制，每次请求间隔 1 秒',
      '',
      ...sqlStatements,
      '',
      `-- 总计: ${sqlStatements.length} 条记录`,
    ].join('\n')

    console.log('\n=== SQL 插入语句 ===')
    console.log(sqlContent)
    console.log('\n=== 复制上面的 SQL 语句，然后运行以下命令：===')
    console.log('cd /root/projects/scpos/worker && npx wrangler d1 execute scp-database --remote --command "<SQL>"')
    console.log('\n或者将 SQL 保存到文件：')
    console.log('npx wrangler d1 execute scp-database --remote --file <filename>.sql')

  } catch (error) {
    console.error('\n错误:', error)
    process.exit(1)
  }
}

main()