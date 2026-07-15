import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PCWindow from '../PCWindow.vue'
import PCWindowSource from '../PCWindow.vue?raw'
import SCPWindow from '../SCPWindow.vue'
import SCPWindowSource from '../SCPWindow.vue?raw'
import WindowCaptionControlsSource from '../WindowCaptionControls.vue?raw'
import WindowCloseButtonSource from '../WindowCloseButton.vue?raw'
import { useWindowManagerStore } from '../../stores/windowManager'
import type { WindowInstance } from '../../types'

vi.mock('../../../utils/indexedDB', () => ({
  default: {
    saveGUIWindowState: vi.fn().mockResolvedValue(undefined),
    deleteGUIWindowState: vi.fn().mockResolvedValue(undefined),
    loadGUIWindowStates: vi.fn().mockResolvedValue([]),
  },
}))

const toolWindowSources = import.meta.glob('../../tools/**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const desktopToolWindowSuffixes = [
  '/terminal/TerminalPanel.vue',
  '/filemanager/FileManagerWindow.vue',
  '/editor/EditorWindow.vue',
  '/settings/SettingsWindow.vue',
  '/appmanager/AppManagerWindow.vue',
  '/chat/PCChatWindow.vue',
  '/dash/PCDashboard.vue',
  '/feedback/PCFeedbackWindow.vue',
  '/docs/PCDocsWindow.vue',
  '/notification/PCNotificationCenter.vue',
  '/admin/AdminLayout.vue',
]
let pinia: ReturnType<typeof createPinia>

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true })
}

function openShellWindow(id: string): WindowInstance {
  const store = useWindowManagerStore()
  return store.openWindow({
    id,
    tool: 'terminal',
    title: 'Test Window',
    width: 500,
    height: 320,
    minWidth: 240,
    minHeight: 180,
    x: 200,
    y: 120,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
  })
}

function openShellWindowWithDefaultCapabilities(id: string): WindowInstance {
  const store = useWindowManagerStore()
  return store.openWindow({
    id,
    tool: 'terminal',
    title: 'Default Controls Window',
    width: 500,
    height: 320,
    minWidth: 240,
    minHeight: 180,
    x: 200,
    y: 120,
  })
}

function getToolWindowSourceBySuffix(suffix: string) {
  const match = Object.entries(toolWindowSources).find(([file]) =>
    file.replace(/\\/g, '/').endsWith(suffix)
  )
  expect(match, `Missing desktop tool source ending with ${suffix}`).toBeDefined()
  return match?.[1] ?? ''
}

async function dragThenResizeFromBottomRight(
  wrapper: VueWrapper,
  selectors: { header: string; resize: string }
) {
  await wrapper.find(selectors.header).trigger('mousedown', {
    button: 0,
    clientX: 220,
    clientY: 140,
  })
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 160 }))
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 180 }))
  document.dispatchEvent(new MouseEvent('mouseup', { clientX: 300, clientY: 180 }))
  await nextTick()

  await wrapper.find(selectors.resize).trigger('mousedown', {
    clientX: 780,
    clientY: 480,
  })
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 820, clientY: 520 }))
  document.dispatchEvent(new MouseEvent('mouseup', { clientX: 820, clientY: 520 }))
  await nextTick()
}

describe('desktop window shells', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    setViewport(1280, 820)
  })

  it.each([
    ['PCWindow', PCWindow, { header: '.pc-window__header', resize: '.pc-window__resize--se' }],
    ['SCPWindow', SCPWindow, { header: '.scp-window__header', resize: '.scp-window__resize--se' }],
  ])(
    '%s keeps the moved origin when resizing immediately after a drag',
    async (name, component, selectors) => {
      const store = useWindowManagerStore()
      const windowInstance = openShellWindow(`${name}-drag-resize`)
      const wrapper = mount(component, {
        props: { windowInstance },
        global: { plugins: [pinia] },
      })

      await dragThenResizeFromBottomRight(wrapper, selectors)

      const win = store.getWindow(`${name}-drag-resize`)
      expect(win?.position).toEqual({ x: 280, y: 160 })
      expect(win?.size).toEqual({ width: 540, height: 360 })
    }
  )

  it('routes window shells through the shared Windows caption controls', () => {
    for (const source of [PCWindowSource, SCPWindowSource]) {
      expect(source).toContain('<WindowCaptionControls')
      expect(source).toContain('minimizable !== false')
      expect(source).toContain('maximizable !== false')
      expect(source).toContain('closable !== false')
      expect(source).not.toContain('__header-actions')
      expect(source).not.toContain('__btn--icon')
      expect(source).not.toContain('__btn--close')
      expect(source).not.toMatch(/__header\s*{[^}]*padding:\s*0\s+var\(/s)
      expect(source).not.toMatch(/__header\s*{[^}]*padding:\s*0\s+\d+px/s)
    }

    expect(WindowCaptionControlsSource).toContain('@mousedown.stop')
    expect(WindowCaptionControlsSource).toContain('margin-right: -1px')
    expect(WindowCaptionControlsSource).toContain('height: calc(100% + 1px)')
    expect(WindowCaptionControlsSource).toContain('<WindowCloseButton')
    expect(WindowCloseButtonSource).toContain('class="window-close-button"')
    expect(WindowCloseButtonSource).not.toContain('<style')
  })

  it.each([
    ['PCWindow', PCWindow],
    ['SCPWindow', SCPWindow],
  ])('%s renders the full caption button set when capabilities are omitted', (name, component) => {
    const windowInstance = openShellWindowWithDefaultCapabilities(`${name}-default-controls`)
    const wrapper = mount(component, {
      props: { windowInstance },
      global: { plugins: [pinia] },
    })

    expect(wrapper.findAll('.window-caption-controls__button')).toHaveLength(2)
    expect(wrapper.findAll('.window-close-button')).toHaveLength(1)
  })

  it('uses the managed window instance for every desktop tool window shell', () => {
    const oldPcWindowCalls = Object.entries(toolWindowSources)
      .filter(([, source]) => /<PCWindow(?![^>]*:window-instance=)/.test(source))
      .map(([file]) => file)
    const oldScpWindowCalls = Object.entries(toolWindowSources)
      .filter(([, source]) => /<SCPWindow(?![^>]*:window-instance=)/.test(source))
      .map(([file]) => file)

    expect(oldPcWindowCalls).toEqual([])
    expect(oldScpWindowCalls).toEqual([])
  })

  it('keeps every registered desktop app on a shared window shell', () => {
    for (const suffix of desktopToolWindowSuffixes) {
      const source = getToolWindowSourceBySuffix(suffix)
      if (suffix === '/admin/AdminLayout.vue') {
        expect(source).toContain('PCWindow')
        expect(source).toContain('windowInstance')
      } else {
        expect(source).toMatch(/<(PCWindow|SCPWindow)\b/)
      }
    }
  })

  it('does not use the legacy global close style in app windows or tool modals', () => {
    const legacyUses = Object.entries(toolWindowSources)
      .filter(([, source]) => source.includes('win-caption-close'))
      .map(([file]) => file)

    expect(legacyUses).toEqual([])
    expect(PCWindowSource).not.toContain('win-caption-close')
    expect(SCPWindowSource).not.toContain('win-caption-close')
  })
})
