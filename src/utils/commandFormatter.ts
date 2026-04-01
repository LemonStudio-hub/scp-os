import { ANSICode } from '../constants/theme'

/**
 * 创建带边框的文本框
 * @param lines 内容行数组
 * @param title 可选的标题
 * @returns 格式化后的行数组
 */
export function createBox(lines: string[], title?: string): string[] {
  const separator = '═══════════════════════════════════════════════════════════════'
  const result: string[] = [
    `${ANSICode.red}${separator}${ANSICode.reset}`,
  ]
  
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
 * 创建章节标题
 * @param title 标题文本
 * @param color 颜色代码（默认为绿色）
 * @returns 格式化后的标题行
 */
export function createSectionHeader(title: string, color: string = ANSICode.green): string {
  return `${color}${title}${ANSICode.reset}`
}

/**
 * 创建警告信息
 * @param message 警告消息
 * @returns 格式化后的警告行
 */
export function createWarning(message: string): string {
  return `${ANSICode.yellow}${message}${ANSICode.reset}`
}

/**
 * 创建错误信息
 * @param message 错误消息
 * @returns 格式化后的错误行
 */
export function createError(message: string): string {
  return `${ANSICode.red}${message}${ANSICode.reset}`
}

/**
 * 创建成功信息
 * @param message 成功消息
 * @returns 格式化后的成功行
 */
export function createSuccess(message: string): string {
  return `${ANSICode.green}${message}${ANSICode.reset}`
}

/**
 * 创建信息提示
 * @param message 提示消息
 * @returns 格式化后的提示行
 */
export function createInfo(message: string): string {
  return `${ANSICode.white}${message}${ANSICode.reset}`
}