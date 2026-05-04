import { describe, it, expect, beforeEach } from 'vitest'
import { CommandAutocompleteService } from '../commandAutocomplete'

describe('CommandAutocompleteService', () => {
  let service: CommandAutocompleteService

  beforeEach(() => {
    service = new CommandAutocompleteService()
  })

  describe('getSuggestions', () => {
    it('should return all commands for empty input', () => {
      const suggestions = service.getSuggestions('')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].type).toBe('command')
    })

    it('should return matching commands for partial input', () => {
      const suggestions = service.getSuggestions('hel')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some((s) => s.text === 'help')).toBe(true)
    })

    it('should return argument suggestions for known command', () => {
      const suggestions = service.getSuggestions('info ')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].type).toBe('argument')
    })

    it('should return CN- prefix suggestions for info command', () => {
      const suggestions = service.getSuggestions('info CN-')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some((s) => s.text.includes('CN-'))).toBe(true)
    })

    it('should return shutdown argument suggestions', () => {
      const suggestions = service.getSuggestions('shutdown ')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some((s) => s.text === 'now')).toBe(true)
    })

    it('should return empty for unknown command with no partial match', () => {
      const suggestions = service.getSuggestions('zzzzzzz')
      expect(suggestions).toEqual([])
    })
  })

  describe('fuzzy matching', () => {
    it('should match by subsequence', () => {
      const suggestions = service.getSuggestions('hlp')
      expect(suggestions.some((s) => s.text === 'help')).toBe(true)
    })

    it('should prioritize prefix matches over fuzzy matches', () => {
      const suggestions = service.getSuggestions('he')
      const helpIndex = suggestions.findIndex((s) => s.text === 'help')
      expect(helpIndex).toBeLessThan(suggestions.length)
    })
  })

  describe('formatSuggestions', () => {
    it('should return empty array for no suggestions', () => {
      expect(service.formatSuggestions([])).toEqual([])
    })

    it('should return single suggestion text directly', () => {
      const result = service.formatSuggestions([
        {
          text: 'help',
          type: 'command',
        },
      ])
      expect(result).toEqual(['help'])
    })

    it('should format multiple suggestions with descriptions', () => {
      const result = service.formatSuggestions([
        { text: 'help', description: 'Show help', type: 'command' as const },
        { text: 'info', description: 'Show info', type: 'command' as const },
      ])
      expect(result.length).toBeGreaterThan(2)
    })
  })

  describe('recordChoice', () => {
    it('should record and influence future suggestions', () => {
      service.recordChoice('he', 'help')
      const suggestions = service.getSuggestions('he')
      const helpSuggestion = suggestions.find((s) => s.text === 'help')
      expect(helpSuggestion).toBeDefined()
    })
  })

  describe('cycleSuggestions', () => {
    it('should cycle through suggestions', () => {
      const suggestions = [
        { text: 'a', type: 'command' as const },
        { text: 'b', type: 'command' as const },
        { text: 'c', type: 'command' as const },
      ]
      expect(service.cycleSuggestions(suggestions, 0)).toBe(1)
      expect(service.cycleSuggestions(suggestions, 2)).toBe(0)
    })
  })

  describe('getSuggestionAt', () => {
    it('should return suggestion at index', () => {
      const suggestions = [
        { text: 'help', type: 'command' as const },
        { text: 'info', type: 'command' as const },
      ]
      expect(service.getSuggestionAt(suggestions, 0)).toBe('help')
      expect(service.getSuggestionAt(suggestions, 1)).toBe('info')
    })

    it('should wrap around index', () => {
      const suggestions = [{ text: 'help', type: 'command' as const }]
      expect(service.getSuggestionAt(suggestions, 5)).toBe('help')
    })

    it('should return null for empty suggestions', () => {
      expect(service.getSuggestionAt([], 0)).toBeNull()
    })
  })
})
