/**
 * Refactored Terminal Composable
 * Uses dependency injection and event-driven architecture
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Ref } from 'vue'
import type { ITabRepository } from '../domain/repositories'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { getGlobalContainer } from '../core/container'
import { getGlobalEventBus } from '../platform/events/event-bus'

/**
 * Terminal Composable
 * Refactored to use dependency injection and event bus
 */
export function useTerminalRefactored(containerRef: Ref<HTMLElement | null>) {
  const terminal = ref<XTerm | null>(null)
  const fitAddon = ref<FitAddon | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const currentTabId = ref<string | null>(null)

  // Inject dependencies
  const tabRepository = getGlobalContainer().resolve<ITabRepository>('TabRepository')
  const eventBus = getGlobalEventBus()

  // Initialize terminal
  const initialize = async () => {
    if (initialized.value || !containerRef.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      // Create terminal instance
      terminal.value = new XTerm({
        theme: {
          background: '#000000',
          foreground: '#00ff00',
          cursor: '#00ff00',
          cursorAccent: '#000000',
          black: '#000000',
          red: '#cd0000',
          green: '#00cd00',
          yellow: '#cdcd00',
          blue: '#0000ee',
          magenta: '#cd00cd',
          cyan: '#00cdcd',
          white: '#e5e5e5',
          brightBlack: '#7f7f7f',
          brightRed: '#ff0000',
          brightGreen: '#00ff00',
          brightYellow: '#ffff00',
          brightBlue: '#5c5cff',
          brightMagenta: '#ff00ff',
          brightCyan: '#00ffff',
          brightWhite: '#ffffff'
        },
        fontSize: 14,
        fontFamily: 'monospace',
        cursorBlink: true,
        scrollback: 1000
      })

      // Create fit addon
      fitAddon.value = new FitAddon()
      terminal.value.loadAddon(fitAddon.value)

      // Mount terminal
      terminal.value.open(containerRef.value)
      fitAddon.value.fit()

      // Load active tab
      const activeTab = await tabRepository.getActive()
      if (activeTab) {
        currentTabId.value = activeTab.id
        const content = activeTab.getData('content')
        if (content) {
          terminal.value.write(content)
        }
      }

      initialized.value = true

      // Emit event
      eventBus.emit('terminal:initialized', { tabId: currentTabId.value })

      // Listen for resize
      window.addEventListener('resize', handleResize)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTerminal] Failed to initialize:', err)
    } finally {
      loading.value = false
    }
  }

  // Handle resize
  const handleResize = () => {
    if (fitAddon.value) {
      fitAddon.value.fit()
    }
  }

  // Write to terminal
  const write = (data: string) => {
    if (terminal.value) {
      terminal.value.write(data)
    }
  }

  // Write line to terminal
  const writeln = (data: string) => {
    if (terminal.value) {
      terminal.value.writeln(data)
    }
  }

  // Clear terminal
  const clear = () => {
    if (terminal.value) {
      terminal.value.clear()
    }
  }

  // Save terminal content
  const saveContent = async () => {
    if (!terminal.value || !currentTabId.value) {
      return
    }

    try {
      const buffer = terminal.value.buffer.active
      const content: string[] = []
      
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i)
        if (line) {
          content.push(line.translateToString(true))
        }
      }

      await tabRepository.updateData(currentTabId.value, 'content', content.join('\n'))
      eventBus.emit('terminal:saved', { tabId: currentTabId.value })
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTerminal] Failed to save content:', err)
    }
  }

  // Resize terminal
  const resize = (cols: number, rows: number) => {
    if (terminal.value) {
      terminal.value.resize(cols, rows)
    }
  }

  // Focus terminal
  const focus = () => {
    if (terminal.value) {
      terminal.value.focus()
    }
  }

  // Blur terminal
  const blur = () => {
    if (terminal.value) {
      terminal.value.blur()
    }
  }

  // Dispose terminal
  const dispose = () => {
    if (terminal.value) {
      terminal.value.dispose()
      terminal.value = null
      fitAddon.value = null
      initialized.value = false
      window.removeEventListener('resize', handleResize)
    }
  }

  // Listen to events
  const handleCommandExecuted = (event: any) => {
    writeln(`> ${event.command}`)
  }

  const handleTabChanged = (event: any) => {
    currentTabId.value = event.tabId
    clear()
    // Load content for new tab
    tabRepository.findById(event.tabId).then(tab => {
      if (tab) {
        const content = tab.getData('content')
        if (content) {
          write(content)
        }
      }
    })
  }

  // Lifecycle hooks
  onMounted(() => {
    eventBus.on('command:executed', handleCommandExecuted)
    eventBus.on('tab:changed', handleTabChanged)
  })

  onUnmounted(() => {
    eventBus.off('command:executed', handleCommandExecuted)
    eventBus.off('tab:changed', handleTabChanged)
    dispose()
  })

  // Computed properties
  const isReady = computed(() => initialized.value && !loading.value)
  const hasError = computed(() => error.value !== null)

  return {
    terminal,
    fitAddon,
    initialized,
    loading,
    error,
    currentTabId,
    isReady,
    hasError,
    initialize,
    write,
    writeln,
    clear,
    saveContent,
    resize,
    focus,
    blur,
    dispose
  }
}
