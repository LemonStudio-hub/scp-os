/**
 * SCP 数据库批量填充脚本
 * 通过 Worker API 批量爬取并插入到 D1 数据库
 */

const WORKER_API = 'https://api.scpos.site'

/**
 * 通过 Worker API 爬取 SCP
 */
async function scrapeViaWorker(scpNumber: string): Promise<{
  success: boolean
  name?: string
  objectClass?: string
  error?: string
}> {
  try {
    const response = await fetch(`${WORKER_API}/scrape?number=${scpNumber}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        name: data.data.name,
        objectClass: data.data.objectClass,
      }
    }

    return { success: false, error: data.error || '爬取失败' }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 计算权限等级
 */
function calculateClearanceLevel(objectClass: string): number {
  switch (objectClass) {
    case 'KETER': return 4
    case 'THAUMIEL': return 5
    case 'EUCLID': return 3
    case 'SAFE': return 2
    default: return 1
  }
}

/**
 * 睡眠函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 主函数
 */
async function main() {
  console.log('=== SCP 数据库批量填充脚本 ===')
  console.log('目标: 至少 500 条记录\n')

  const totalNeeded = 500
  const batchSize = 20 // 每批处理 20 个
  const delay = 1000 // 每批之间延迟 1 秒

  // 生成 SCP 编号列表（101-600）
  const scpNumbers: string[] = []
  for (let i = 101; i <= 600; i++) {
    scpNumbers.push(i.toString().padStart(3, '0'))
  }

  console.log(`准备爬取 ${scpNumbers.length} 个 SCP...`)
  console.log(`每批处理 ${batchSize} 个，批次间隔 ${delay}ms\n`)

  let successCount = 0
  let failCount = 0
  const sqlStatements: string[] = []

  for (let i = 0; i < scpNumbers.length; i += batchSize) {
    const batch = scpNumbers.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(scpNumbers.length / batchSize)

    console.log(`批次 ${batchNum}/${totalBatches}: 处理 SCP-${batch[0]} 到 SCP-${batch[batch.length - 1]}`)

    for (const number of batch) {
      if (successCount >= totalNeeded) {
        console.log(`\n已达到目标 ${totalNeeded} 条记录，停止爬取`)
        break
      }

      const scpId = parseInt(number)
      console.log(`  爬取 SCP-${number}...`)

      const result = await scrapeViaWorker(number)

      if (result.success && result.name) {
        const objectClass = result.objectClass || 'UNKNOWN'
        const clearanceLevel = calculateClearanceLevel(objectClass)
        const tags = ''

        sqlStatements.push(
          `INSERT OR REPLACE INTO scp_index (scp_id, name, object_class, tags, clearance_level) ` +
          `VALUES (${scpId}, '${result.name.replace(/'/g, "''")}', '${objectClass}', '${tags}', ${clearanceLevel});`
        )

        console.log(`    ✓ ${result.name} [${objectClass}] 权限:${clearanceLevel}`)
        successCount++
      } else {
        console.log(`    ✗ 失败: ${result.error || '未知错误'}`)
        failCount++
      }

      // 每个请求之间延迟 100ms
      await sleep(100)
    }

    console.log(`  进度: 成功 ${successCount}, 失败 ${failCount}\n`)

    if (successCount >= totalNeeded) {
      break
    }

    // 批次之间延迟
    await sleep(delay)
  }

  console.log('\n=== 爬取完成 ===')
  console.log(`成功: ${successCount} 条`)
  console.log(`失败: ${failCount} 条`)
  console.log(`总计: ${sqlStatements.length} 条 SQL 语句`)

  // 输出 SQL 文件
  const sqlContent = [
    '-- SCP 数据库批量填充脚本',
    '-- 生成时间: ' + new Date().toISOString(),
    '-- 通过 Worker API 爬取',
    '',
    ...sqlStatements,
    '',
    `-- 总计: ${sqlStatements.length} 条记录`,
  ].join('\n')

  // 保存到文件
  const fs = require('fs')
  const path = require('path')
  const sqlFile = path.join(__dirname, '../migrations/0002_fill_data.sql')
  fs.writeFileSync(sqlFile, sqlContent)

  console.log(`\nSQL 文件已保存到: ${sqlFile}`)
  console.log('\n运行以下命令导入数据库:')
  console.log(`npx wrangler d1 execute scp-database --remote --file migrations/0002_fill_data.sql`)
}

main().catch(error => {
  console.error('错误:', error)
  process.exit(1)
})