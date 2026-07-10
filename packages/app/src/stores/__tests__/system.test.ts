import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSystemStore } from '../system'

describe('SystemStore', () => {
  let store: ReturnType<typeof useSystemStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useSystemStore()
  })

  describe('initial state', () => {
    it('isFirstLaunch is true when no localStorage key', () => {
      expect(store.isFirstLaunch).toBe(true)
    })

    it('isRunning is false when no localStorage key', () => {
      expect(store.isRunning).toBe(false)
    })

    it('bootLogShown is false when no localStorage key', () => {
      expect(store.bootLogShown).toBe(false)
    })
  })

  describe('initial state with saved values', () => {
    it('reads isFirstLaunch from localStorage', () => {
      localStorage.setItem('scp-os-first-launch', 'true')
      setActivePinia(createPinia())
      const s = useSystemStore()
      expect(s.isFirstLaunch).toBe(false)
    })

    it('reads isRunning from localStorage', () => {
      localStorage.setItem('scp-os-system-status', 'running')
      setActivePinia(createPinia())
      const s = useSystemStore()
      expect(s.isRunning).toBe(true)
    })

    it('reads bootLogShown from localStorage', () => {
      localStorage.setItem('scp-os-boot-log-shown', 'true')
      setActivePinia(createPinia())
      const s = useSystemStore()
      expect(s.bootLogShown).toBe(true)
    })
  })

  describe('markSystemLaunched', () => {
    it('sets localStorage and isFirstLaunch becomes false', () => {
      store.markSystemLaunched()
      expect(localStorage.getItem('scp-os-first-launch')).toBe('true')
      expect(store.isFirstLaunch).toBe(false)
    })
  })

  describe('markSystemRunning', () => {
    it('sets localStorage and isRunning becomes true', () => {
      store.markSystemRunning()
      expect(localStorage.getItem('scp-os-system-status')).toBe('running')
      expect(store.isRunning).toBe(true)
    })
  })

  describe('markSystemShutdown', () => {
    it('sets localStorage and isRunning becomes false', () => {
      store.markSystemRunning()
      store.markSystemShutdown()
      expect(localStorage.getItem('scp-os-system-status')).toBe('shutdown')
      expect(store.isRunning).toBe(false)
    })
  })

  describe('markBootLogShown', () => {
    it('sets localStorage and bootLogShown becomes true', () => {
      store.markBootLogShown()
      expect(localStorage.getItem('scp-os-boot-log-shown')).toBe('true')
      expect(store.bootLogShown).toBe(true)
    })
  })

  describe('resetBootLogShown', () => {
    it('removes localStorage and bootLogShown becomes false', () => {
      store.markBootLogShown()
      store.resetBootLogShown()
      expect(localStorage.getItem('scp-os-boot-log-shown')).toBeNull()
      expect(store.bootLogShown).toBe(false)
    })
  })

  describe('resetFirstLaunch', () => {
    it('removes localStorage and isFirstLaunch becomes true', () => {
      store.markSystemLaunched()
      store.resetFirstLaunch()
      expect(localStorage.getItem('scp-os-first-launch')).toBeNull()
      expect(store.isFirstLaunch).toBe(true)
    })
  })
})
