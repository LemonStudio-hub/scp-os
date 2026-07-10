import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMobile } from '../useMobile'

// useMobile uses module-level refs (screenWidth, screenHeight) that are initialized
// once. The onResize handler is only attached via onMounted (which doesn't fire outside
// a component). However, useMobile() returns the same module-level refs, so we can
// directly set their .value to simulate dimension changes.

describe('useMobile', () => {
  beforeEach(() => {
    // Reset to desktop defaults
    const mobile = useMobile()
    mobile.screenWidth.value = 1920
    mobile.screenHeight.value = 1080
  })

  describe('isDesktop', () => {
    it('should be true for large screens', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 1920
      mobile.screenHeight.value = 1080
      // isDesktop = !isMobile; isMobile requires small screen AND mobile UA
      expect(mobile.isDesktop.value).toBe(true)
    })
  })

  describe('isTablet', () => {
    it('should be true for medium screens (769-1024px)', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 900
      mobile.screenHeight.value = 600
      expect(mobile.isTablet.value).toBe(true)
    })

    it('should be false for screens <= 768px', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 768
      mobile.screenHeight.value = 1024
      expect(mobile.isTablet.value).toBe(false)
    })

    it('should be false for screens > 1024px', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 1200
      mobile.screenHeight.value = 800
      expect(mobile.isTablet.value).toBe(false)
    })
  })

  describe('isPortrait / isLandscape', () => {
    it('should be portrait when height > width', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 400
      mobile.screenHeight.value = 800
      expect(mobile.isPortrait.value).toBe(true)
      expect(mobile.isLandscape.value).toBe(false)
    })

    it('should be landscape when width > height', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 1024
      mobile.screenHeight.value = 768
      expect(mobile.isLandscape.value).toBe(true)
      expect(mobile.isPortrait.value).toBe(false)
    })
  })

  describe('isSmallMobile', () => {
    it('should be true for screens < 480px', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 375
      mobile.screenHeight.value = 667
      expect(mobile.isSmallMobile.value).toBe(true)
    })

    it('should be false for screens >= 480px', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 480
      mobile.screenHeight.value = 800
      expect(mobile.isSmallMobile.value).toBe(false)
    })
  })

  describe('isLargeMobile', () => {
    it('should be true for screens 480-768px', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 600
      mobile.screenHeight.value = 800
      expect(mobile.isLargeMobile.value).toBe(true)
    })

    it('should be false for screens < 480px', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 375
      mobile.screenHeight.value = 667
      expect(mobile.isLargeMobile.value).toBe(false)
    })

    it('should be false for screens > 768px', () => {
      const mobile = useMobile()
      mobile.screenWidth.value = 900
      mobile.screenHeight.value = 600
      expect(mobile.isLargeMobile.value).toBe(false)
    })
  })

  describe('haptic', () => {
    it('should call navigator.vibrate with default pattern (10)', () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      })

      const mobile = useMobile()
      mobile.haptic()

      expect(vibrateMock).toHaveBeenCalledWith(10)
    })

    it('should call navigator.vibrate with custom pattern', () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      })

      const mobile = useMobile()
      mobile.haptic([50, 100, 50])

      expect(vibrateMock).toHaveBeenCalledWith([50, 100, 50])
    })

    it('should not throw when navigator.vibrate is not available', () => {
      const originalVibrate = (navigator as any).vibrate
      delete (navigator as any).vibrate

      const mobile = useMobile()
      expect(() => mobile.haptic()).not.toThrow()

      // Restore
      if (originalVibrate !== undefined) {
        Object.defineProperty(navigator, 'vibrate', {
          value: originalVibrate,
          writable: true,
          configurable: true,
        })
      }
    })
  })
})
