import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localAppManager } from './local-app-manager'
import { useWindowManagerStore } from '../../gui/stores/windowManager'

vi.mock('../../utils/indexedDB', () => ({
  default: {
    saveGUIWindowState: vi.fn().mockResolvedValue(undefined),
    deleteGUIWindowState: vi.fn().mockResolvedValue(undefined),
    loadGUIWindowStates: vi.fn().mockResolvedValue([]),
  },
}))

function packageFiles(permissions: string[] = []) {
  return [
    {
      path: 'scp-app.json',
      content: JSON.stringify({
        schemaVersion: 1,
        id: 'local.api-test',
        name: 'API Test',
        version: '1.0.0',
        runtime: 'iframe-app',
        entry: 'index.html',
        permissions,
      }),
    },
    {
      path: 'index.html',
      content: '<!doctype html><html><body>API Test</body></html>',
    },
  ]
}

function sendApiMessage(type: string, payload: Record<string, unknown> = {}, windowId?: string) {
  const postMessage = vi.fn()
  localAppManager.handleIframeMessage(
    'local.api-test',
    {
      data: {
        channel: 'scp-os',
        id: 'request-1',
        type,
        payload,
      },
      source: { postMessage },
      origin: 'http://localhost',
    } as unknown as MessageEvent,
    windowId
  )
  return postMessage.mock.calls[0]?.[0]
}

describe('LocalAppManager runtime API', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.style.cursor = ''
    document.body.style.cursor = ''
    await localAppManager.uninstall('local.api-test')
  })

  it('rejects API calls when the manifest did not declare the required permission', async () => {
    await localAppManager.installPackage(packageFiles([]), 'directory')

    const response = sendApiMessage('ui:setCursor', { cursor: 'crosshair' })

    expect(response.ok).toBe(false)
    expect(response.error).toMatchObject({
      code: 'PERMISSION_DENIED',
      permission: 'ui.cursor',
      api: 'ui:setCursor',
    })
    expect(document.body.style.cursor).toBe('')
  })

  it('allows declared permissions to control the current window and cursor', async () => {
    await localAppManager.installPackage(packageFiles(['window.control', 'ui.cursor']), 'directory')

    const windowStore = useWindowManagerStore()
    windowStore.openWindow({
      id: 'local-api-window',
      tool: 'local-app:local.api-test',
      title: 'API Test',
      width: 700,
      height: 500,
    })

    const titleResponse = sendApiMessage(
      'window:setTitle',
      { title: 'Changed by API' },
      'local-api-window'
    )
    const cursorResponse = sendApiMessage(
      'ui:setCursor',
      { cursor: 'crosshair' },
      'local-api-window'
    )

    expect(titleResponse.ok).toBe(true)
    expect(titleResponse.result).toBe(true)
    expect(cursorResponse.ok).toBe(true)
    expect(cursorResponse.result).toBe(true)
    expect(windowStore.getWindow('local-api-window')?.config.title).toBe('Changed by API')
    expect(document.body.style.cursor).toBe('crosshair')

    localAppManager.releaseIframeSession('local.api-test', 'local-api-window')
    expect(document.body.style.cursor).toBe('')
  })

  it('returns current theme data when theme.read is declared', async () => {
    await localAppManager.installPackage(packageFiles(['theme.read']), 'directory')

    const response = sendApiMessage('theme:getCurrent')

    expect(response.ok).toBe(true)
    expect(response.result.id).toBeTruthy()
    expect(response.result.availableThemes.length).toBeGreaterThan(0)
  })
})
