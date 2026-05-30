import { ref } from 'vue'

export type DialogType = 'alert' | 'confirm' | 'prompt'

export interface DialogState {
  type: DialogType
  title?: string
  message: string
  defaultValue?: string
  resolve: (value: boolean | string | null) => void
}

const queue: DialogState[] = []
const current = ref<DialogState | null>(null)

function processQueue() {
  if (current.value || queue.length === 0) return
  current.value = queue.shift()!
}

function push(state: Omit<DialogState, 'resolve'>): Promise<any> {
  return new Promise((resolve) => {
    queue.push({ ...state, resolve })
    if (!current.value) processQueue()
  })
}

function resolve(value: boolean | string | null) {
  current.value?.resolve(value)
  current.value = null
  setTimeout(processQueue, 50)
}

export const dialogService = {
  current,
  resolve,
  alert(message: string, title?: string): Promise<void> {
    return push({ type: 'alert', message, title })
  },
  confirm(message: string, title?: string): Promise<boolean> {
    return push({ type: 'confirm', message, title })
  },
  prompt(message: string, defaultValue = '', title?: string): Promise<string | null> {
    return push({ type: 'prompt', message, defaultValue, title })
  },
}
