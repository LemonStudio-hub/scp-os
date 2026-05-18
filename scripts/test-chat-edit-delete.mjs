/**
 * Round 1 Real-World Test: Chat Message Edit/Delete
 * Connects to local worker WS endpoint and exercises all paths.
 */

const WS_URL = 'ws://127.0.0.1:8789/chat/ws'

function createWS(userId, username, roomId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}?user_id=${userId}&username=${username}&room_id=${roomId}`)
    const messages = []
    ws.onmessage = (ev) => {
      try {
        messages.push(JSON.parse(ev.data))
      } catch {}
    }
    ws.onopen = () => resolve({ ws, messages })
    ws.onerror = (e) => reject(e)
  })
}

function waitFor(client, type, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const msg = client.messages.find((m) => m.type === type)
      if (msg) {
        resolve(msg)
      } else if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for ${type}`))
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  })
}

function waitForNew(client, type, startIndex, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const msg = client.messages.slice(startIndex).find((m) => m.type === type)
      if (msg) {
        resolve(msg)
      } else if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for ${type}`))
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  })
}

function send(ws, type, data) {
  ws.send(JSON.stringify({ type, data }))
}

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✅ ${label}`)
  passed++
}

function fail(label, reason) {
  console.log(`  ❌ ${label}: ${reason}`)
  failed++
}

async function runTests() {
  console.log('\n=== Chat Edit/Delete Real-World Test ===\n')

  let user1, user2
  try {
    user1 = await createWS('test_user_1', 'Alice', 1)
    user2 = await createWS('test_user_2', 'Bob', 1)
    console.log('Both users connected to room 1')
  } catch (e) {
    console.error('Failed to connect:', e.message)
    process.exit(1)
  }

  // Give time for history to arrive
  await new Promise((r) => setTimeout(r, 500))

  // --- Test 1: Send message ---
  console.log('\n[Test 1] Send a chat message')
  let idx1 = user1.messages.length
  send(user1.ws, 'chat_message', { content: 'Hello world', temp_id: 'temp-1' })
  let msgId = null
  try {
    const msg = await waitForNew(user1, 'chat_message', idx1)
    msgId = msg.data?.id
    if (msg.data?.content === 'Hello world' && msgId) {
      ok('Message sent and received with id')
    } else {
      fail('Send message', 'Missing content or id')
    }
  } catch (e) {
    fail('Send message', e.message)
  }

  // --- Test 2: Edit own message + broadcast to other user ---
  console.log('\n[Test 2] Edit own message')
  if (!msgId) {
    fail('Edit own message', 'No message id from test 1')
  } else {
    let idxU1 = user1.messages.length
    let idxU2 = user2.messages.length
    send(user1.ws, 'edit_message', { message_id: msgId, content: 'Hello edited world' })
    try {
      const editedU1 = await waitForNew(user1, 'message_edited', idxU1)
      const editedU2 = await waitForNew(user2, 'message_edited', idxU2)
      if (editedU1.data?.id === msgId && editedU1.data?.content === 'Hello edited world') {
        ok('Own message edited successfully')
      } else {
        fail('Edit own message', `Unexpected: ${JSON.stringify(editedU1.data)}`)
      }
      if (editedU2.data?.content === 'Hello edited world') {
        ok('Edit broadcast received by other user')
      } else {
        fail('Edit broadcast', `Wrong content: ${editedU2.data?.content}`)
      }
    } catch (e) {
      fail('Edit own message', e.message)
    }
  }

  // --- Test 3: Delete own message + broadcast to other user ---
  console.log('\n[Test 3] Delete own message')
  if (!msgId) {
    fail('Delete own message', 'No message id')
  } else {
    let idxU1 = user1.messages.length
    let idxU2 = user2.messages.length
    send(user1.ws, 'delete_message', { message_id: msgId })
    try {
      const deletedU1 = await waitForNew(user1, 'message_deleted', idxU1)
      const deletedU2 = await waitForNew(user2, 'message_deleted', idxU2)
      if (deletedU1.data?.id === msgId) {
        ok('Own message deleted successfully')
      } else {
        fail('Delete own message', `Unexpected id: ${deletedU1.data?.id}`)
      }
      if (deletedU2.data?.id === msgId) {
        ok('Delete broadcast received by other user')
      } else {
        fail('Delete broadcast', `Wrong id: ${deletedU2.data?.id}`)
      }
    } catch (e) {
      fail('Delete own message', e.message)
    }
  }

  // --- Test 6: Edit empty content rejected ---
  console.log('\n[Test 6] Edit with empty content rejected')
  let idx6 = user1.messages.length
  send(user1.ws, 'edit_message', { message_id: 999999, content: '   ' })
  try {
    const err = await waitForNew(user1, 'error', idx6)
    if (err.data?.code === 'VALIDATION_ERROR' || err.data?.code === 'NOT_FOUND') {
      ok('Empty edit rejected')
    } else {
      fail('Empty edit', `Unexpected code: ${err.data?.code}`)
    }
  } catch (e) {
    fail('Empty edit', e.message)
  }

  // --- Test 7: Edit another user\'s message rejected ---
  console.log('\n[Test 7] Edit another user\'s message rejected')
  let idx7a = user2.messages.length
  send(user2.ws, 'chat_message', { content: 'Bob message', temp_id: 'temp-bob' })
  let bobMsgId = null
  try {
    const bobMsg = await waitForNew(user2, 'chat_message', idx7a)
    bobMsgId = bobMsg.data?.id
  } catch (e) {
    fail('Forbidden edit setup', e.message)
  }

  if (bobMsgId) {
    let idx7b = user1.messages.length
    send(user1.ws, 'edit_message', { message_id: bobMsgId, content: 'Hacked' })
    try {
      const err = await waitForNew(user1, 'error', idx7b)
      if (err.data?.code === 'FORBIDDEN') {
        ok('Forbidden edit correctly rejected')
      } else {
        fail('Forbidden edit', `Unexpected code: ${err.data?.code} msg: ${err.data?.message}`)
      }
    } catch (e) {
      fail('Forbidden edit', e.message)
    }
  }

  // --- Test 8: Delete another user\'s message rejected ---
  console.log('\n[Test 8] Delete another user\'s message rejected')
  if (!bobMsgId) {
    fail('Forbidden delete', 'No Bob message id')
  } else {
    let idx8 = user1.messages.length
    send(user1.ws, 'delete_message', { message_id: bobMsgId })
    try {
      const err = await waitForNew(user1, 'error', idx8)
      if (err.data?.code === 'FORBIDDEN') {
        ok('Forbidden delete correctly rejected')
      } else {
        fail('Forbidden delete', `Unexpected code: ${err.data?.code}`)
      }
    } catch (e) {
      fail('Forbidden delete', e.message)
    }
  }

  // --- Test 9: Edit non-existent message ---
  console.log('\n[Test 9] Edit non-existent message')
  let idx9 = user1.messages.length
  send(user1.ws, 'edit_message', { message_id: 999999, content: 'Ghost' })
  try {
    const err = await waitForNew(user1, 'error', idx9)
    if (err.data?.code === 'NOT_FOUND') {
      ok('Non-existent edit rejected with NOT_FOUND')
    } else {
      fail('Non-existent edit', `Unexpected code: ${err.data?.code}`)
    }
  } catch (e) {
    fail('Non-existent edit', e.message)
  }

  // --- Test 10: Delete non-existent message ---
  console.log('\n[Test 10] Delete non-existent message')
  let idx10 = user1.messages.length
  send(user1.ws, 'delete_message', { message_id: 999999 })
  try {
    const err = await waitForNew(user1, 'error', idx10)
    if (err.data?.code === 'NOT_FOUND') {
      ok('Non-existent delete rejected with NOT_FOUND')
    } else {
      fail('Non-existent delete', `Unexpected code: ${err.data?.code}`)
    }
  } catch (e) {
    fail('Non-existent delete', e.message)
  }

  // Cleanup
  user1.ws.close()
  user2.ws.close()

  console.log('\n=== Results ===')
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests()
