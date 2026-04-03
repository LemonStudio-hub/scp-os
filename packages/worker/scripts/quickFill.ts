/**
 * 快速填充数据库脚本
 * 使用并发请求加快速度
 */

const WORKER_API = 'https://api.scpos.site'

async function scrapeViaWorker(scpNumber: string): Promise<{
  success: boolean
  name?: string
  objectClass?: string
}> {
  try {
    const response = await fetch(`${WORKER_API}/scrape?number=${scpNumber}`, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) return { success: false }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        name: data.data.name,
        objectClass: data.data.objectClass,
      }
    }

    return { success: false }
  } catch {
    return { success: false }
  }
}

function calculateClearanceLevel(objectClass: string): number {
  switch (objectClass) {
    case 'KETER': return 4
    case 'THAUMIEL': return 5
    case 'EUCLID': return 3
    case 'SAFE': return 2
    default: return 1
  }
}

async function main() {
  console.log('=== 快速填充数据库 ===')
  console.log('目标: 500 条记录\n')

  const totalNeeded = 500
  const concurrency = 10 // 并发10个请求

  // 生成 SCP 编号列表（1-600）
  const scpNumbers: string[] = []
  for (let i = 1; i <= 600; i++) {
    scpNumbers.push(i.toString().padStart(3, '0'))
  }

  let successCount = 0
  let failCount = 0
  const sqlStatements: string[] = []

  console.log(`开始处理 ${scpNumbers.length} 个 SCP...`)
  console.log(`并发数: ${concurrency}\n`)

  for (let i = 0; i < scpNumbers.length; i += concurrency) {
    if (successCount >= totalNeeded) {
      console.log(`\n已达到目标 ${totalNeeded} 条记录，停止爬取`)
      break
    }

    const batch = scpNumbers.slice(i, i + concurrency)
    const promises = batch.map(num => scrapeViaWorker(num))

    console.log(`处理批次 ${Math.floor(i / concurrency) + 1}/${Math.ceil(scpNumbers.length / concurrency)}: SCP-${batch[0]} 到 SCP-${batch[batch.length - 1]}`)

    const results = await Promise.all(promises)

    for (let j = 0; j < results.length; j++) {
      if (successCount >= totalNeeded) break

      const result = results[j]
      const number = batch[j]
      const scpId = parseInt(number)

      if (result.success && result.name) {
        const objectClass = result.objectClass || 'UNKNOWN'
        const clearanceLevel = calculateClearanceLevel(objectClass)

        sqlStatements.push(
          `INSERT OR REPLACE INTO scp_index (scp_id, name, object_class, tags, clearance_level) ` +
          `VALUES (${scpId}, '${result.name.replace(/'/g, "''")}', '${objectClass}', '', ${clearanceLevel});`
        )

        console.log(`  ✓ SCP-${number}: ${result.name} [${objectClass}]`)
        successCount++
      } else {
        console.log(`  ✗ SCP-${number}: 失败`)
        failCount++
      }
    }

    console.log(`  进度: 成功 ${successCount}/${totalNeeded}\n`)

    // 每批之间延迟 500ms
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n=== 爬取完成 ===')
  console.log(`成功: ${successCount} 条`)
  console.log(`失败: ${failCount} 条`)

  // 保存 SQL 文件
  const sqlContent = [
    '-- SCP 数据库填充脚本',
    '-- 生成时间: ' + new Date().toISOString(),
    '',
    ...sqlStatements,
    '',
    `-- 总计: ${sqlStatements.length} 条记录`,
  ].join('\n')

  const fs = require('fs')
  const path = require('path')
  const sqlFile = path.join(__dirname, '../migrations/0003_quick_fill.sql')
  fs.writeFileSync(sqlFile, sqlContent)

  console.log(`\nSQL 文件已保存到: ${sqlFile}`)
  console.log(`运行以下命令导入数据库:`)
  console.log(`npx wrangler d1 execute scp-database --remote --file ${sqlFile}`)
}

main().catch(error => {
  console.error('错误:', error)
  process.exit(1)
})