import type { CommandHandler } from '../types/command'

export type CommandSource = 'builtin' | 'plugin'

export interface RegisteredCommand {
  name: string
  aliases?: string[]
  description: string
  usage?: string
  permission?: string
  permissions?: string[]
  source: CommandSource
  pluginId?: string
  handler: CommandHandler
}

export interface CommandRegistrationInput {
  name: string
  aliases?: string[]
  description: string
  usage?: string
  permission?: string
  permissions?: string[]
  source?: CommandSource
  pluginId?: string
  handler: CommandHandler
}

export interface CommandSummary {
  name: string
  aliases: string[]
  description: string
  usage: string
  source: CommandSource
  pluginId?: string
}

function normalizeCommandName(name: string): string {
  return name.trim().toLowerCase()
}

function uniqueNames(names: string[]): string[] {
  return [...new Set(names.map(normalizeCommandName).filter(Boolean))]
}

export class CommandRegistry {
  private commands = new Map<string, RegisteredCommand>()
  private aliases = new Map<string, string>()

  register(input: CommandRegistrationInput): void {
    const name = normalizeCommandName(input.name)
    const aliases = uniqueNames(input.aliases ?? [])

    if (!name) {
      throw new Error('Command name is required')
    }

    const conflicts = this.findConflicts(name, aliases)
    if (conflicts.length > 0) {
      throw new Error(`Command name conflict: ${conflicts.join(', ')}`)
    }

    const command: RegisteredCommand = {
      ...input,
      name,
      aliases,
      usage: input.usage ?? name,
      source: input.source ?? 'plugin',
    }

    this.commands.set(name, command)
    for (const alias of aliases) {
      this.aliases.set(alias, name)
    }
  }

  unregister(name: string): void {
    const normalized = normalizeCommandName(name)
    const command = this.commands.get(normalized)
    if (!command) return

    this.commands.delete(normalized)
    for (const alias of command.aliases ?? []) {
      this.aliases.delete(alias)
    }
  }

  unregisterPlugin(pluginId: string): void {
    for (const command of this.getAll()) {
      if (command.pluginId === pluginId) {
        this.unregister(command.name)
      }
    }
  }

  get(nameOrAlias: string): RegisteredCommand | null {
    const normalized = normalizeCommandName(nameOrAlias)
    const commandName = this.aliases.get(normalized) ?? normalized
    return this.commands.get(commandName) ?? null
  }

  has(nameOrAlias: string): boolean {
    return Boolean(this.get(nameOrAlias))
  }

  getAll(): RegisteredCommand[] {
    return [...this.commands.values()].sort((a, b) => a.name.localeCompare(b.name))
  }

  getSummaries(): CommandSummary[] {
    return this.getAll().map((command) => ({
      name: command.name,
      aliases: command.aliases ?? [],
      description: command.description,
      usage: command.usage ?? command.name,
      source: command.source,
      pluginId: command.pluginId,
    }))
  }

  findConflicts(name: string, aliases: string[] = []): string[] {
    const requested = uniqueNames([name, ...aliases])
    return requested.filter(
      (candidate) => this.commands.has(candidate) || this.aliases.has(candidate)
    )
  }

  clear(): void {
    this.commands.clear()
    this.aliases.clear()
  }
}

export const commandRegistry = new CommandRegistry()
