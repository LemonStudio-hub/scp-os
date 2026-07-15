import { beforeEach, describe, expect, it } from 'vitest'
import { dialogService } from '../useDialog'

describe('dialogService', () => {
  beforeEach(() => {
    // Drain any pending dialog
    while (dialogService.current.value) {
      dialogService.resolve(null)
    }
  })

  it('queues confirm and resolves true/false', async () => {
    const p = dialogService.confirm('Delete?')
    expect(dialogService.current.value?.type).toBe('confirm')
    expect(dialogService.current.value?.message).toBe('Delete?')
    dialogService.resolve(true)
    await expect(p).resolves.toBe(true)
  })

  it('queues alert and resolves', async () => {
    const p = dialogService.alert('Hello', 'Title')
    expect(dialogService.current.value?.type).toBe('alert')
    expect(dialogService.current.value?.title).toBe('Title')
    dialogService.resolve(true)
    await expect(p).resolves.toBeUndefined()
  })

  it('queues prompt and returns string', async () => {
    const p = dialogService.prompt('Name?', 'guest')
    expect(dialogService.current.value?.type).toBe('prompt')
    expect(dialogService.current.value?.defaultValue).toBe('guest')
    dialogService.resolve('alice')
    await expect(p).resolves.toBe('alice')
  })

  it('returns null when prompt is cancelled', async () => {
    const p = dialogService.prompt('Name?')
    dialogService.resolve(null)
    await expect(p).resolves.toBeNull()
  })
})
