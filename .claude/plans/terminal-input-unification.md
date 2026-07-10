# Plan: Unify Terminal Input Handling

## Problem

Two independent input handling implementations exist:

1. **`useTerminal.setupCommandHandler()`** (legacy, `src/composables/useTerminal.ts`) — feature-rich: command history (arrow keys), tab autocomplete with cycling, command highlighting (green for recognized commands), `SCP-ROOT>` prompt
2. **`useTerminalEmulator.handleInput()`** (GUI, `src/gui/composables/useTerminalEmulator.ts`) — minimal: Enter/Backspace/Ctrl+C/printable only, no history, no autocomplete, no highlighting, `scp@foundation:~$` prompt

This means `TerminalPanel.vue` and `MobileTerminal.vue` (the GUI terminals) lack history navigation and tab completion that the legacy `SCPTerminal.vue` has.

## Approach

Enhance `useTerminalEmulator` as the **single source of truth** for input handling, then have `useTerminal` delegate to it. This is a two-file change — no Vue components need modification.

## Changes

### 1. `src/gui/composables/useTerminalEmulator.ts` — Enhance

Add these features from the legacy implementation:

- **Command history** via existing `useCommandHistory` composable (same one `useTerminal` currently uses)
- **Tab autocomplete** via existing `autocompleteService` singleton (same one `useTerminal` currently uses)
- **Command highlighting** — recognized commands rendered in green via `ANSICode.command`
- **Full line replacement** — `replaceCurrentLine()` using ANSI `\r\x1b[K` instead of character-by-character echo
- **Configurable prompt style** — new `promptStyle` option: `'scp'` (default: `scp@foundation:~$`) or `'legacy'` (`SCP-ROOT>`)

New option interface:
```ts
export interface UseTerminalEmulatorOptions {
  getTerminal: () => Terminal | null
  t?: (key: string, params?) => string
  promptStyle?: 'scp' | 'legacy'  // default: 'scp'
}
```

New exports added to return value:
```ts
{ inputBuffer, writePrompt, executeCommand, handleInput, clearAndPrompt,
  navigateHistory, autocomplete }  // ← new
```

### 2. `src/composables/useTerminal.ts` — Delegate

Remove duplicated input handling code and delegate to `useTerminalEmulator`:

- **Add** `import { useTerminalEmulator } from '../gui/composables/useTerminalEmulator'`
- **Call** `useTerminalEmulator({ getTerminal, promptStyle: 'legacy' })` inside `useTerminal()`
- **Remove** imports: `AVAILABLE_COMMANDS`, `useCommandHistory`
- **Remove** local state: `currentInput` ref, `autocompleteSuggestions` ref, `autocompleteIndex` ref
- **Remove** functions: `replaceCurrentLine()`, `navigateHistory()`, `autocomplete()`, `executeCommand()`, `processCommand()`
- **Remove** local `writePrompt()` (replaced by emulator's version with `'legacy'` style)
- **Update** `setupCommandHandler()` to wire `terminal.onData(handleInput)` from emulator
- **Update** all internal callers of `writePrompt()` to use emulator's version
- **Re-add** `processCommand()` as a thin wrapper that checks `systemStore.isRunning` before calling emulator's `executeCommand()`

### 3. No Vue Component Changes

- `SCPTerminal.vue` — already calls `setupCommandHandler()`, `navigateHistory()`, `autocomplete()` from `useTerminal`. These will now delegate to the emulator transparently.
- `TerminalPanel.vue` — already uses `useTerminalEmulator`. Gains history + autocomplete automatically.
- `MobileTerminal.vue` — already uses `useTerminalEmulator`. Gains history + autocomplete automatically.

## Key Design Decisions

1. **Prompt style via option** rather than duplicating prompt logic — `useTerminal` passes `promptStyle: 'legacy'`, GUI components use default `'scp'`
2. **`processCommand` stays in `useTerminal`** — it contains `systemStore.isRunning` guard logic that's specific to the legacy terminal lifecycle, not general input handling
3. **Reuse existing `useCommandHistory` composable** — no new history implementation, same composable both paths
4. **Reuse existing `autocompleteService` singleton** — same service, same `CompletionHistory` tracking
5. **`executeCommand` in emulator does NOT write prompt** — the `handleInput` function calls `writePrompt()` after `executeCommand()`, keeping them decoupled for external callers

## Data Flow After Unification

```
User Input → terminal.onData()
  → useTerminalEmulator.handleInput()
    ├── Enter: executeCommand() → writePrompt()
    ├── Arrow Up/Down: navigateHistory() → replaceCurrentLine()
    ├── Tab: autocomplete() → replaceCurrentLine() or show suggestions
    ├── Backspace: trim input → replaceCurrentLine()
    ├── Ctrl+C: cancel → writePrompt()
    └── Printable: append → replaceCurrentLine()

replaceCurrentLine():
  1. \r\x1b[K (clear line)
  2. Write prompt (style-dependent)
  3. Write input (green if recognized command)
```

## Files Modified

| File | Action |
|------|--------|
| `src/gui/composables/useTerminalEmulator.ts` | Enhance with history, autocomplete, highlighting, prompt style |
| `src/composables/useTerminal.ts` | Remove duplicated code, delegate to emulator |

## Verification

1. `pnpm typecheck` — ensure no type errors
2. `pnpm --filter @scp-os/app vitest run` — existing tests pass
3. Manual: legacy terminal has same behavior (SCP-ROOT> prompt, history, autocomplete, green commands)
4. Manual: GUI terminals now have history (arrow keys) and tab completion
