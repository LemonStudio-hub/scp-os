import { ANSICode } from '../constants/theme'

/**
 * Wrap content lines in a decorative border, optionally with a centered title
 * @param lines Content lines to display inside the box
 * @param title Optional centered title shown at the top
 * @returns Formatted lines including border and content
 */
export function createBox(lines: string[], title?: string): string[] {
  const separator = '═══════════════════════════════════════════════════════════════'
  const result: string[] = [`${ANSICode.red}${separator}${ANSICode.reset}`]

  if (title) {
    const centeredTitle = title.padStart(51 + Math.floor(title.length / 2)).padEnd(63)
    result.push(`${ANSICode.green}${centeredTitle}${ANSICode.reset}`)
  }

  result.push(
    `${ANSICode.red}${separator}${ANSICode.reset}`,
    ...lines,
    `${ANSICode.red}${separator}${ANSICode.reset}`
  )

  return result
}

/**
 * Render a section title with ANSI color
 * @param title Title text to display
 * @param color ANSI color code (defaults to green)
 * @returns Color-formatted title string
 */
export function createSectionHeader(title: string, color: string = ANSICode.green): string {
  return `${color}${title}${ANSICode.reset}`
}

/**
 * Format a warning message in yellow
 * @param message Warning text
 * @returns Color-formatted warning string
 */
export function createWarning(message: string): string {
  return `${ANSICode.yellow}${message}${ANSICode.reset}`
}

/**
 * Format an error message in red
 * @param message Error text
 * @returns Color-formatted error string
 */
export function createError(message: string): string {
  return `${ANSICode.red}${message}${ANSICode.reset}`
}

/**
 * Format a success message in green
 * @param message Success text
 * @returns Color-formatted success string
 */
export function createSuccess(message: string): string {
  return `${ANSICode.green}${message}${ANSICode.reset}`
}

/**
 * Format an informational message in white
 * @param message Info text
 * @returns Color-formatted info string
 */
export function createInfo(message: string): string {
  return `${ANSICode.white}${message}${ANSICode.reset}`
}
