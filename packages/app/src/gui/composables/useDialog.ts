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
  const next = queue.shift()
  if (!next) return
  current.value = next
}

function push(state: Omit<DialogState, 'resolve'>): Promise<boolean | string | null> {
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
    return push({ type: 'alert', message, title }).then(() => undefined)
  },
  confirm(message: string, title?: string): Promise<boolean> {
    return push({ type: 'confirm', message, title }).then((value) => value === true)
  },
  prompt(message: string, defaultValue = '', title?: string): Promise<string | null> {
    return push({ type: 'prompt', message, defaultValue, title }).then((value) =>
      typeof value === 'string' ? value : null
    )
  },
}
