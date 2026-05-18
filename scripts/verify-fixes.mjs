/**
 * 真实验证脚本 - 对每个高优先级修复跑 3 次
 * API: https://os1api.daum.pw
 */

const API_BASE = 'https://os1api.daum.pw'
const JWT_SECRET = 'scp-os-production-jwt-2026-secure-key'
const TEST_USER_ID = `test-user-${Date.now()}`

// ─── JWT 生成 ───────────────────────────────────────────────────────

function base64UrlEncode(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createHmacSignature(data, secret) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return new Uint8Array(signature)
}

async function generateToken(userId) {
  const encoder = new TextEncoder()
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 7 * 24 * 60 * 60

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { userId, iat: now, exp: now + expiresIn }

  const headerEncoded = base64UrlEncode(encoder.encode(JSON.stringify(header)))
  const payloadEncoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)))

  const data = `${headerEncoded}.${payloadEncoded}`
  const sig = await createHmacSignature(data, JWT_SECRET)
  const sigEncoded = base64UrlEncode(sig)

  return `${data}.${sigEncoded}`
}

// ─── 工具函数 ───────────────────────────────────────────────────────

async function authFetch(path, options = {}) {
  const token = await generateToken(TEST_USER_ID)
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
  return res
}

async function jsonFetch(path, options = {}) {
  const res = await authFetch(path, options)
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text) }
  } catch {
    return { status: res.status, data: text }
  }
}

function log(label, pass, detail = '') {
  const icon = pass ? '✅' : '❌'
  console.log(`  ${icon} ${label}${detail ? ` — ${detail}` : ''}`)
  return pass
}

// ─── 测试套件 ───────────────────────────────────────────────────────

const results = {
  notifications: { pass: 0, fail: 0 },
  chatHttp: { pass: 0, fail: 0 },
  chatWs: { pass: 0, fail: 0 },
  files: { pass: 0, fail: 0 },
}

async function testNotifications(run) {
  console.log(`\n✈️  Test Notifications (Run ${run}/3)`)
  const { status, data } = await jsonFetch('/notifications?unread=true&limit=10')

  if (status === 401) {
    console.log('  ⚠️  Got 401 — JWT_SECRET mismatch, skipping authenticated tests')
    return false
  }

  const ok = status === 200 && data.success === true
  if (ok) {
    const hasTotal = typeof data.total === 'number'
    const hasUnreadCount = typeof data.unreadCount === 'number'
    const hasData = Array.isArray(data.data)
    log('Status 200 + success', ok)
    log('Has data array', hasData, `count=${data.count}`)
    log('Has total field', hasTotal, `total=${data.total}`)
    log('Has unreadCount field', hasUnreadCount, `unreadCount=${data.unreadCount}`)
    if (ok && hasTotal && hasUnreadCount) results.notifications.pass++
    else results.notifications.fail++
  } else {
    log('Status 200 + success', ok, `status=${status}`)
    results.notifications.fail++
  }
  return ok
}

async function testChatHttp(run) {
  console.log(`\n✈️  Test Chat HTTP Persistence (Run ${run}/3)`)
  const content = `Test message ${Date.now()}-${run}`

  // Send via HTTP
  const sendRes = await jsonFetch('/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, room_id: 1 }),
  })

  if (sendRes.status === 401) {
    console.log('  ⚠️  Got 401 — JWT_SECRET mismatch, skipping authenticated tests')
    return false
  }

  const sentOk = sendRes.status === 200 && sendRes.data.success === true
  log('Send message', sentOk, `id=${sendRes.data?.data?.id}`)

  // Fetch messages
  const listRes = await jsonFetch('/chat/messages?room_id=1&limit=20')
  const listOk = listRes.status === 200 && Array.isArray(listRes.data.data)
  const found = listOk && listRes.data.data.some((m) => m.content === content)
  log('List messages', listOk, `count=${listRes.data?.count}`)
  log('Message persisted', found)

  if (sentOk && found) results.chatHttp.pass++
  else results.chatHttp.fail++
  return sentOk && found
}

async function testChatWs(run) {
  console.log(`\n✈️  Test Chat WebSocket + History (Run ${run}/3)`)
  return new Promise(async (resolve) => {
    const token = await generateToken(TEST_USER_ID)
    const url = `${API_BASE.replace('https', 'wss')}/chat/ws?user_id=${encodeURIComponent(TEST_USER_ID)}&username=TestUser&room_id=1`

    let resolved = false
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        log('WebSocket connect + history', false, 'Timeout')
        results.chatWs.fail++
        resolve(false)
      }
    }, 8000)

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        // Wait a bit for history message
        setTimeout(() => {
          if (!resolved) {
            ws.close()
            resolved = true
            log('WebSocket connect + history', false, 'No history received')
            results.chatWs.fail++
            resolve(false)
          }
        }, 3000)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'history') {
            clearTimeout(timeout)
            if (!resolved) {
              resolved = true
              const hasMessages = Array.isArray(msg.data?.messages)
              const hasUsers = Array.isArray(msg.data?.users)
              log('WebSocket connected', true)
              log('Received history event', true)
              log('History has messages', hasMessages, `len=${msg.data?.messages?.length}`)
              log('History has users', hasUsers, `count=${msg.data?.count}`)
              ws.close()
              if (hasMessages && hasUsers) results.chatWs.pass++
              else results.chatWs.fail++
              resolve(hasMessages && hasUsers)
            }
          }
        } catch {
          // ignore non-JSON
        }
      }

      ws.onerror = (err) => {
        clearTimeout(timeout)
        if (!resolved) {
          resolved = true
          log('WebSocket connect + history', false, 'WebSocket error')
          results.chatWs.fail++
          resolve(false)
        }
      }

      ws.onclose = () => {
        clearTimeout(timeout)
        if (!resolved) {
          resolved = true
          log('WebSocket connect + history', false, 'Closed before history')
          results.chatWs.fail++
          resolve(false)
        }
      }
    } catch (err) {
      clearTimeout(timeout)
      if (!resolved) {
        resolved = true
        log('WebSocket connect + history', false, err.message)
        results.chatWs.fail++
        resolve(false)
      }
    }
  })
}

async function testFiles(run) {
  console.log(`\n✈️  Test File Cloud Sync (Run ${run}/3)`)
  const fileName = `test-${Date.now()}-${run}.txt`
  const fileContent = `Hello SCP-OS ${run}`

  // Upload
  const form = new FormData()
  form.append('file', new Blob([fileContent], { type: 'text/plain' }), fileName)
  form.append('path', fileName)

  const uploadRes = await jsonFetch('/files/upload', {
    method: 'POST',
    body: form,
  })

  if (uploadRes.status === 401) {
    console.log('  ⚠️  Got 401 — JWT_SECRET mismatch, skipping authenticated tests')
    return false
  }

  const uploadOk = uploadRes.status === 200 && uploadRes.data.success === true
  log('Upload file', uploadOk, `key=${uploadRes.data?.data?.key}`)

  // List
  const listRes = await jsonFetch('/files')
  const listOk = listRes.status === 200 && Array.isArray(listRes.data.data)
  const found = listOk && listRes.data.data.some((f) => f.key === fileName)
  log('List files', listOk, `count=${listRes.data?.count}`)
  log('File in list', found)

  // Download
  let downloadOk = false
  if (found) {
    const downloadRes = await authFetch(`/files/${encodeURIComponent(fileName)}`)
    const downloadText = await downloadRes.text()
    downloadOk = downloadRes.status === 200 && downloadText === fileContent
    log('Download file', downloadOk, `match=${downloadOk}`)
  }

  // Cleanup
  if (uploadOk) {
    await authFetch(`/files/${encodeURIComponent(fileName)}`, { method: 'DELETE' })
  }

  if (uploadOk && found && downloadOk) results.files.pass++
  else results.files.fail++
  return uploadOk && found && downloadOk
}

// ─── 主流程 ─────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60))
  console.log('SCP-OS 高优先级修复真实验证')
  console.log(`API: ${API_BASE}`)
  console.log(`User: ${TEST_USER_ID}`)
  console.log('═'.repeat(60))

  // Health check
  console.log('\n🔍 Health Check')
  const health = await fetch(`${API_BASE}/`)
  const healthJson = await health.json()
  log('Root endpoint', health.status === 200, healthJson.status)

  let authFailed = false

  for (let i = 1; i <= 3; i++) {
    const ok = await testNotifications(i)
    if (ok === false && !authFailed) {
      // Check if it's auth failure
      const probe = await jsonFetch('/notifications?unread=true')
      if (probe.status === 401) authFailed = true
    }
  }

  for (let i = 1; i <= 3; i++) {
    if (authFailed) {
      console.log(`\n✈️  Test Chat HTTP Persistence (Run ${i}/3) — SKIPPED (401)`)
      results.chatHttp.fail++
      continue
    }
    await testChatHttp(i)
  }

  for (let i = 1; i <= 3; i++) {
    if (authFailed) {
      console.log(`\n✈️  Test Chat WebSocket + History (Run ${i}/3) — SKIPPED (401)`)
      results.chatWs.fail++
      continue
    }
    await testChatWs(i)
  }

  for (let i = 1; i <= 3; i++) {
    if (authFailed) {
      console.log(`\n✈️  Test File Cloud Sync (Run ${i}/3) — SKIPPED (401)`)
      results.files.fail++
      continue
    }
    await testFiles(i)
  }

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('验证结果汇总')
  console.log('═'.repeat(60))
  for (const [name, r] of Object.entries(results)) {
    const total = r.pass + r.fail
    const rate = total > 0 ? Math.round((r.pass / total) * 100) : 0
    const icon = r.fail === 0 ? '✅' : '❌'
    console.log(`${icon} ${name}: ${r.pass}/${total} passed (${rate}%)`)
  }
  if (authFailed) {
    console.log('\n⚠️  所有认证测试被跳过：生产环境 JWT_SECRET 与默认值不同。')
    console.log('   请提供生产环境 JWT_SECRET 或改为验证本地 dev 环境。')
  }
}

main().catch(console.error)
