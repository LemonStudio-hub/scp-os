/**
 * Info 命令查询日志
 * 模拟真实的 SCP Wiki 查询过程，增强用户体验
 */

import { ANSICode } from '../constants/theme'

/**
 * 生成查询日志
 * @param scpNumber SCP 编号
 * @param branch 分部 (cn/en)
 * @returns 日志行数组
 */
export function generateInfoQueryLogs(scpNumber: string, branch: string = 'en'): string[] {
  const branchName = branch === 'cn' ? 'Chinese Branch' : 'English Main Site'
  const branchUrl = branch === 'cn' ? 'scp-wiki-cn.wikidot.com' : 'scp-wiki.wikidot.com'

  return [
    // 连接阶段
    `${ANSICode.cyan}[INFO] Connecting to ${branchName} Wiki...${ANSICode.reset}`,
    `${ANSICode.gray}[NET] Resolving ${branchUrl}...${ANSICode.reset}`,
    `${ANSICode.green}[NET] DNS resolved: 104.21.46.5${ANSICode.reset}`,
    `${ANSICode.gray}[NET] Establishing TLS 1.3 connection...${ANSICode.reset}`,
    `${ANSICode.green}[NET] TLS handshake complete${ANSICode.reset}`,
    `${ANSICode.green}[NET] Connected to ${branchUrl} (443)${ANSICode.reset}`,
    '',

    // 认证阶段
    `${ANSICode.yellow}[AUTH] Verifying access credentials...${ANSICode.reset}`,
    `${ANSICode.gray}[AUTH] Token: scp_query_****${ANSICode.reset}`,
    `${ANSICode.green}[AUTH] Access granted (Level 4 clearance)${ANSICode.reset}`,
    '',

    // 查询阶段
    `${ANSICode.yellow}[QUERY] Searching for SCP-${scpNumber}...${ANSICode.reset}`,
    `${ANSICode.gray}[DB] SELECT * FROM scp_index WHERE scp_id = ${scpNumber}${ANSICode.reset}`,
    `${ANSICode.gray}[DB] Executing full-text search...${ANSICode.reset}`,
    `${ANSICode.green}[DB] Record found in scp_search index${ANSICode.reset}`,
    '',

    // 获取内容
    `${ANSICode.yellow}[FETCH] Retrieving article content...${ANSICode.reset}`,
    `${ANSICode.gray}[HTTP] GET /scp-${scpNumber} HTTP/1.1${ANSICode.reset}`,
    `${ANSICode.gray}[HTTP] Host: ${branchUrl}${ANSICode.reset}`,
    `${ANSICode.gray}[HTTP] User-Agent: SCP-Foundation-Terminal/3.0.2${ANSICode.reset}`,
    `${ANSICode.green}[HTTP] 200 OK (14.2 KB)${ANSICode.reset}`,
    '',

    // 解析阶段
    `${ANSICode.yellow}[PARSE] Extracting article structure...${ANSICode.reset}`,
    `${ANSICode.gray}[PARSE] Identifying section headers...${ANSICode.reset}`,
    `${ANSICode.gray}[PARSE] Locating Object Class field...${ANSICode.reset}`,
    `${ANSICode.green}[PARSE] Found: 特殊收容措施${ANSICode.reset}`,
    `${ANSICode.green}[PARSE] Found: 描述${ANSICode.reset}`,
    `${ANSICode.gray}[PARSE] Checking for appendix sections...${ANSICode.reset}`,
    `${ANSICode.green}[PARSE] Article structure validated${ANSICode.reset}`,
    '',

    // 清理阶段
    `${ANSICode.yellow}[CLEAN] Sanitizing content...${ANSICode.reset}`,
    `${ANSICode.gray}[CLEAN] Removing script tags...${ANSICode.reset}`,
    `${ANSICode.gray}[CLEAN] Stripping navigation elements...${ANSICode.reset}`,
    `${ANSICode.gray}[CLEAN] Filtering ads and sidebars...${ANSICode.reset}`,
    `${ANSICode.green}[CLEAN] Content sanitized (XSS protected)${ANSICode.reset}`,
    '',

    // 缓存阶段
    `${ANSICode.yellow}[CACHE] Updating local cache...${ANSICode.reset}`,
    `${ANSICode.gray}[CACHE] Key: scp-${branch}-${scpNumber}${ANSICode.reset}`,
    `${ANSICode.gray}[CACHE] TTL: 1800 seconds${ANSICode.reset}`,
    `${ANSICode.green}[CACHE] Cache entry created${ANSICode.reset}`,
    '',

    // 完成
    `${ANSICode.green}[DONE] SCP-${scpNumber} data ready for display${ANSICode.reset}`,
    `${ANSICode.gray}[STATS] Total time: ${Math.floor(Math.random() * 800 + 200)}ms | Size: ${Math.floor(Math.random() * 10 + 3)} KB${ANSICode.reset}`,
    '',
  ]
}
