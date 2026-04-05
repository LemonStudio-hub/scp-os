/**
 * 终端响应式工具
 * 根据终端宽度动态调整输出格式
 */

/**
 * 获取终端当前宽度（列数）
 */
export function getTerminalWidth(): number {
  // 尝试从全局终端实例获取
  if (typeof window !== 'undefined' && window.__terminalInstance) {
    const cols = window.__terminalInstance.cols
    if (cols && cols > 10) {
      return cols
    }
  }

  // 根据屏幕宽度估算
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 768
    
    if (isMobile) {
      // 移动端：10-12px 字体，字符宽度约 6-7px
      const charWidth = 6.5
      const padding = 16
      const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
      return Math.max(25, Math.min(50, estimatedCols))
    }
    
    // 桌面端
    const charWidth = 9.6
    const padding = 20
    const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
    return Math.max(40, Math.min(120, estimatedCols))
  }

  // 默认值
  return 80
}

/**
 * 判断是否为移动端（窄终端）
 */
export function isNarrowTerminal(): boolean {
  return getTerminalWidth() <= 50
}

/**
 * 生成响应式边框线
 * @param char 边框字符（默认 '═'）
 * @param minWidth 最小宽度（默认 20）
 * @param maxWidth 最大宽度（默认 120）
 */
export function createBorderLine(char: string = '═', minWidth: number = 20, maxWidth: number = 120): string {
  const width = getTerminalWidth()
  const lineWidth = Math.max(minWidth, Math.min(width, maxWidth))
  return char.repeat(lineWidth)
}

/**
 * 生成带标题的响应式边框行
 * @param text 标题文本
 * @param borderChar 边框字符
 * @returns 格式化的边框行
 */
export function createBorderedTitle(text: string, borderChar: string = '═'): string {
  const width = getTerminalWidth()
  const padding = 2 // 文本左右各留空格
  const availableWidth = width - padding
  
  if (text.length >= availableWidth) {
    // 文本太长，直接返回边框线
    return createBorderLine(borderChar)
  }
  
  const remainingWidth = availableWidth - text.length
  const leftCount = Math.floor(remainingWidth / 2)
  const rightCount = remainingWidth - leftCount
  
  return borderChar.repeat(leftCount) + text + borderChar.repeat(rightCount)
}

/**
 * 生成区块（带边框的标题和内容）
 * @param title 标题
 * @param contentLines 内容行数组
 * @returns 完整的区块字符串数组
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
 * 截断文本以适应终端宽度
 * @param text 原始文本
 * @param maxWidth 最大宽度（可选，默认使用终端宽度）
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxWidth?: number): string {
  const width = maxWidth || getTerminalWidth()
  
  // 移除 ANSI 颜色代码后计算长度
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '')
  
  if (cleanText.length <= width) {
    return text
  }
  
  // 找到最后一个 ANSI 代码的位置
  const lastAnsiMatch = text.match(/\x1b\[[0-9;]*m/g)
  const resetCode = lastAnsiMatch ? lastAnsiMatch[lastAnsiMatch.length - 1] : ''
  
  // 截断并添加重置代码
  return text.substring(0, width - 3) + '...' + resetCode
}

/**
 * 自动换行文本以适应终端宽度
 * @param text 原始文本
 * @param maxWidth 最大宽度（可选）
 * @returns 换行后的文本数组
 */
export function wrapText(text: string, maxWidth?: number): string[] {
  const width = maxWidth || getTerminalWidth()
  const lines: string[] = []
  
  // 移除 ANSI 代码以便计算
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '')
  
  if (cleanText.length <= width) {
    return [text]
  }
  
  // 按单词分割并重新组合
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
