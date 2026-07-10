/**
 * Terminal responsive utilities.
 * Adapts output formatting to the current terminal width.
 */

/**
 * Get the current terminal width in columns.
 */
export function getTerminalWidth(): number {
  // Prefer the live terminal instance for accurate width
  if (typeof window !== 'undefined' && window.__terminalInstance) {
    const cols = window.__terminalInstance.cols
    if (cols && cols > 10) {
      return cols
    }
  }

  // Fallback: estimate from screen width
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 768

    if (isMobile) {
      // Mobile: ~10-12px font with ~6-7px character width
      const charWidth = 6.5
      const padding = 16
      const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
      return Math.max(25, Math.min(50, estimatedCols))
    }

    // Desktop
    const charWidth = 9.6
    const padding = 20
    const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
    return Math.max(40, Math.min(120, estimatedCols))
  }

  // Sensible default when no window is available
  return 80
}

/**
 * Check if the terminal is narrow (mobile layout).
 */
export function isNarrowTerminal(): boolean {
  return getTerminalWidth() <= 50
}

/**
 * Generate a border line sized to the current terminal width.
 * @param char Border character (default '═')
 * @param minWidth Minimum line width (default 20)
 * @param maxWidth Maximum line width (default 120)
 */
export function createBorderLine(
  char: string = '═',
  minWidth: number = 20,
  maxWidth: number = 120
): string {
  const width = getTerminalWidth()
  const lineWidth = Math.max(minWidth, Math.min(width, maxWidth))
  return char.repeat(lineWidth)
}

/**
 * Generate a border line with a centered title.
 * @param text Title text
 * @param borderChar Border character
 * @returns Formatted bordered title string
 */
export function createBorderedTitle(text: string, borderChar: string = '═'): string {
  const width = getTerminalWidth()
  const padding = 2
  const availableWidth = width - padding

  if (text.length >= availableWidth) {
    // Text is too long to center — return a plain border line instead
    return createBorderLine(borderChar)
  }

  const remainingWidth = availableWidth - text.length
  const leftCount = Math.floor(remainingWidth / 2)
  const rightCount = remainingWidth - leftCount

  return borderChar.repeat(leftCount) + text + borderChar.repeat(rightCount)
}

/**
 * Generate a bordered block with a title and content lines.
 * @param title Section title
 * @param contentLines Array of content lines
 * @returns Array of formatted strings for the complete block
 */
export function createBlock(title: string, contentLines: string[]): string[] {
  const lines: string[] = []
  const borderLine = createBorderLine()

  lines.push(borderLine)
  lines.push(createBorderedTitle(title))
  lines.push(borderLine)
  lines.push('')
  lines.push(...contentLines)
  lines.push('')
  lines.push(borderLine)

  return lines
}

/**
 * Truncate text to fit the terminal width, preserving ANSI color codes.
 * @param text Original text
 * @param maxWidth Maximum width (defaults to terminal width)
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, maxWidth?: number): string {
  const width = maxWidth || getTerminalWidth()

  // Measure length after stripping ANSI color codes
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '')

  if (cleanText.length <= width) {
    return text
  }

  // Find the last ANSI code so we can append a reset after truncation
  const lastAnsiMatch = text.match(/\x1b\[[0-9;]*m/g)
  const resetCode = lastAnsiMatch ? lastAnsiMatch[lastAnsiMatch.length - 1] : ''

  // Truncate and append reset code to avoid broken colors
  return text.substring(0, width - 3) + '...' + resetCode
}

/**
 * Word-wrap text to fit the terminal width.
 * @param text Original text
 * @param maxWidth Maximum width (defaults to terminal width)
 * @returns Array of wrapped lines
 */
export function wrapText(text: string, maxWidth?: number): string[] {
  const width = maxWidth || getTerminalWidth()
  const lines: string[] = []

  // Strip ANSI codes for width calculation
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '')

  if (cleanText.length <= width) {
    return [text]
  }

  // Split by words and recombine to fit within width
  const words = cleanText.split(' ')
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}
