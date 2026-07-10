/**
 * Simulated query logs for the Info command.
 * Mimics a realistic SCP Wiki lookup to enhance the terminal experience.
 */

import { ANSICode } from '../constants/theme'

/**
 * Generate staged query log lines for a given SCP number.
 * @param scpNumber SCP number
 * @param branch Wiki branch (cn/en)
 * @returns Array of ANSI-formatted log lines
 */
export function generateInfoQueryLogs(scpNumber: string, branch: string = 'en'): string[] {
  const branchName = branch === 'cn' ? 'Chinese Branch' : 'English Main Site'
  const branchUrl = branch === 'cn' ? 'scp-wiki-cn.wikidot.com' : 'scp-wiki.wikidot.com'

  return [
    // Connection phase — establishes trust with the wiki server
    `${ANSICode.cyan}[INFO] Connecting to ${branchName} Wiki...${ANSICode.reset}`,
    `${ANSICode.gray}[NET] Resolving ${branchUrl}...${ANSICode.reset}`,
    `${ANSICode.green}[NET] DNS resolved: 104.21.46.5${ANSICode.reset}`,
    `${ANSICode.gray}[NET] Establishing TLS 1.3 connection...${ANSICode.reset}`,
    `${ANSICode.green}[NET] TLS handshake complete${ANSICode.reset}`,
    `${ANSICode.green}[NET] Connected to ${branchUrl} (443)${ANSICode.reset}`,
    '',

    // Auth phase — simulates clearance verification
    `${ANSICode.yellow}[AUTH] Verifying access credentials...${ANSICode.reset}`,
    `${ANSICode.gray}[AUTH] Token: scp_query_****${ANSICode.reset}`,
    `${ANSICode.green}[AUTH] Access granted (Level 4 clearance)${ANSICode.reset}`,
    '',

    // Query phase — looks up the SCP record in the index
    `${ANSICode.yellow}[QUERY] Searching for SCP-${scpNumber}...${ANSICode.reset}`,
    `${ANSICode.gray}[DB] SELECT * FROM scp_index WHERE scp_id = ${scpNumber}${ANSICode.reset}`,
    `${ANSICode.gray}[DB] Executing full-text search...${ANSICode.reset}`,
    `${ANSICode.green}[DB] Record found in scp_search index${ANSICode.reset}`,
    '',

    // Fetch phase — retrieves the full article content
    `${ANSICode.yellow}[FETCH] Retrieving article content...${ANSICode.reset}`,
    `${ANSICode.gray}[HTTP] GET /scp-${scpNumber} HTTP/1.1${ANSICode.reset}`,
    `${ANSICode.gray}[HTTP] Host: ${branchUrl}${ANSICode.reset}`,
    `${ANSICode.gray}[HTTP] User-Agent: SCP-Foundation-Terminal/3.0.2${ANSICode.reset}`,
    `${ANSICode.green}[HTTP] 200 OK (14.2 KB)${ANSICode.reset}`,
    '',

    // Parse phase — extracts structured sections from the HTML
    `${ANSICode.yellow}[PARSE] Extracting article structure...${ANSICode.reset}`,
    `${ANSICode.gray}[PARSE] Identifying section headers...${ANSICode.reset}`,
    `${ANSICode.gray}[PARSE] Locating Object Class field...${ANSICode.reset}`,
    `${ANSICode.green}[PARSE] Found: 特殊收容措施${ANSICode.reset}`,
    `${ANSICode.green}[PARSE] Found: 描述${ANSICode.reset}`,
    `${ANSICode.gray}[PARSE] Checking for appendix sections...${ANSICode.reset}`,
    `${ANSICode.green}[PARSE] Article structure validated${ANSICode.reset}`,
    '',

    // Sanitize phase — removes unsafe HTML and navigation artifacts
    `${ANSICode.yellow}[CLEAN] Sanitizing content...${ANSICode.reset}`,
    `${ANSICode.gray}[CLEAN] Removing script tags...${ANSICode.reset}`,
    `${ANSICode.gray}[CLEAN] Stripping navigation elements...${ANSICode.reset}`,
    `${ANSICode.gray}[CLEAN] Filtering ads and sidebars...${ANSICode.reset}`,
    `${ANSICode.green}[CLEAN] Content sanitized (XSS protected)${ANSICode.reset}`,
    '',

    // Cache phase — stores the result locally for faster repeat access
    `${ANSICode.yellow}[CACHE] Updating local cache...${ANSICode.reset}`,
    `${ANSICode.gray}[CACHE] Key: scp-${branch}-${scpNumber}${ANSICode.reset}`,
    `${ANSICode.gray}[CACHE] TTL: 1800 seconds${ANSICode.reset}`,
    `${ANSICode.green}[CACHE] Cache entry created${ANSICode.reset}`,
    '',

    // Done
    `${ANSICode.green}[DONE] SCP-${scpNumber} data ready for display${ANSICode.reset}`,
    `${ANSICode.gray}[STATS] Total time: ${Math.floor(Math.random() * 800 + 200)}ms | Size: ${Math.floor(Math.random() * 10 + 3)} KB${ANSICode.reset}`,
    '',
  ]
}
