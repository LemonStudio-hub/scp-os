import { describe, expect, it, beforeEach, vi } from 'vitest'
import { commandRegistry } from './commandRegistry'
import { getCommandHandler, registerBuiltinCommands, commandHandlers } from './index'
import { autocompleteService } from '../utils/commandAutocomplete'

describe('commandRegistry integration', () => {
  beforeEach(() => {
    commandRegistry.clear()
    registerBuiltinCommands()
  })

  it('executes built-in commands through the unified registry', () => {
    expect(getCommandHandler('help')).toBe(commandHandlers.help)
  })

  it('executes plugin commands through the unified registry', async () => {
    const handler = vi.fn()
    commandRegistry.register({
      name: 'hello',
      aliases: ['hi'],
      description: 'Say hello',
      usage: 'hello [name]',
      source: 'plugin',
      pluginId: 'test-plugin',
      handler,
    })

    const resolved = getCommandHandler('hi')
    expect(resolved).toBe(handler)

    await resolved?.(['site-19'], vi.fn(), vi.fn())
    expect(handler).toHaveBeenCalledWith(['site-19'], expect.any(Function), expect.any(Function))
  })

  it('rejects plugin command conflicts with built-ins', () => {
    expect(() =>
      commandRegistry.register({
        name: 'help',
        description: 'Conflicting help',
        source: 'plugin',
        pluginId: 'bad-plugin',
        handler: vi.fn(),
      })
    ).toThrow(/conflict/i)
  })

  it('includes plugin commands in autocomplete suggestions', () => {
    commandRegistry.register({
      name: 'containment-report',
      aliases: ['crep'],
      description: 'Generate containment report',
      source: 'plugin',
      pluginId: 'report-plugin',
      handler: vi.fn(),
    })

    const suggestions = autocompleteService.getSuggestions('cre')
    expect(suggestions.some((item) => item.text === 'crep')).toBe(true)
  })

  it('removes plugin commands from lookup and autocomplete on unregister', () => {
    commandRegistry.register({
      name: 'temporary',
      description: 'Temporary command',
      source: 'plugin',
      pluginId: 'temp-plugin',
      handler: vi.fn(),
    })

    commandRegistry.unregisterPlugin('temp-plugin')

    expect(getCommandHandler('temporary')).toBeNull()
    expect(autocompleteService.getSuggestions('temp')).toEqual([])
  })
})
