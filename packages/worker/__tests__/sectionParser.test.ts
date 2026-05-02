import { describe, it, expect } from 'vitest'
import { SectionParser } from '../parsers/sectionParser'

describe('SectionParser', () => {
  const parser = new SectionParser()

  describe('parseSections - containment', () => {
    it('should identify containment section with Chinese header', () => {
      const text =
        '**特殊收容措施：**\nSCP-XXXX must be contained in a standard secure locker at Site-19. Access requires Level 3 clearance or higher. All testing must be approved by at least two senior researchers. The containment chamber should be monitored at all times via closed-circuit cameras.'
      const result = parser.parseSections(text)
      expect(result.containment.length).toBeGreaterThan(0)
    })

    it('should identify containment section with English header', () => {
      const text =
        '**Special Containment Procedures:**\nSCP-XXXX is to be kept in a reinforced containment cell with electromagnetic shielding. Personnel entering the containment area must wear Faraday suits. Any breach of containment must be reported immediately to Site Command.'
      const result = parser.parseSections(text)
      expect(result.containment.length).toBeGreaterThan(0)
    })
  })

  describe('parseSections - description', () => {
    it('should identify description section with Chinese header', () => {
      const text =
        '**描述：**\nSCP-XXXX is a humanoid entity standing approximately 2 meters in height. The entity appears to be composed entirely of shadows that shift and move independently of ambient light sources. When approached, the entity emits a low frequency hum that causes mild disorientation in human subjects.'
      const result = parser.parseSections(text)
      expect(result.description.length).toBeGreaterThan(0)
    })

    it('should identify description section with English header', () => {
      const text =
        '**Description:**\nSCP-XXXX is an anomalous phenomenon occurring in urban environments. The effect manifests as a sudden spatial distortion within a radius of approximately 50 meters. Subjects within the affected area report experiencing temporal displacement events lasting between 3 and 7 seconds.'
      const result = parser.parseSections(text)
      expect(result.description.length).toBeGreaterThan(0)
    })
  })

  describe('parseSections - edge cases', () => {
    it('should not crash on empty input', () => {
      const result = parser.parseSections('')
      expect(result).toBeDefined()
      expect(result.containment).toEqual([])
      expect(result.description).toEqual([])
    })

    it('should not crash on whitespace only input', () => {
      const result = parser.parseSections('   \n\t  ')
      expect(result).toBeDefined()
      expect(result.containment).toEqual([])
      expect(result.description).toEqual([])
    })
  })
})
