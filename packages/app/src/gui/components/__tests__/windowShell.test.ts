import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PCWindow from '../PCWindow.vue'
import PCWindowSource from '../PCWindow.vue?raw'
import SCPWindow from '../SCPWindow.vue'
import SCPWindowSource from '../SCPWindow.vue?raw'
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

  it('keeps close buttons as the rightmost caption button without their own corner radius', () => {
    for (const source of [PCWindowSource, SCPWindowSource]) {
      expect(source).toContain('__header-actions" @mousedown.stop')
      expect(source).toContain('margin-right: -1px')
      expect(source).toContain('height: calc(100% + 1px)')
      expect(source).not.toMatch(/__btn--close\s*{[^}]*border-top-right-radius/s)
      expect(source).not.toMatch(/__header\s*{[^}]*padding:\s*0\s+var\(/s)
      expect(source).not.toMatch(/__header\s*{[^}]*padding:\s*0\s+\d+px/s)
    }
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
})
