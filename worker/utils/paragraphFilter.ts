/**
 * 段落过滤器
 * 优化的段落过滤逻辑，预编译所有过滤模式
 */

import { getConfig } from '../shared/config'
import { RegexCache } from './regexCache'

export class ParagraphFilter {
  private config = getConfig()
  private compiledPatterns: RegExp[]

  constructor() {
    // 预编译所有过滤模式
    this.compiledPatterns = RegexCache.getMany(
      this.config.parsing.ignorePatterns.map(p => ({ pattern: p.source, flags: p.flags }))
    )
  }

  /**
   * 过滤段落
   */
  filter(paragraphs: string[]): string[] {
    return paragraphs.filter(p => this.shouldKeep(p))
  }

  /**
   * 判断是否保留段落
   */
  private shouldKeep(paragraph: string): boolean {
    // 基本长度过滤
    if (paragraph.length < this.config.parsing.minParagraphLength) return false
    if (paragraph.length > this.config.parsing.maxParagraphLength) return false

    // 检查是否包含无关内容
    for (const pattern of this.compiledPatterns) {
      if (pattern.test(paragraph)) return false
    }

    // 检查是否全是数字或特殊字符
    if (/^[\d\s\-\+\=\*\_]+$/.test(paragraph)) return false

    return true
  }

  /**
   * 清理段落文本
   */
  clean(paragraph: string): string {
    let cleaned = paragraph

    // 移除 HTML 标签
    cleaned = cleaned.replace(/<[^>]+>/g, '')

    // 移除 Markdown 语法
    cleaned = cleaned.replace(/\*\*/g, '')
    cleaned = cleaned.replace(/\*/g, '')
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    // 移除图片标记
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

    // 移除 JavaScript 代码
    cleaned = cleaned.replace(/window\[['"]nitroAds['"]\]\.createAd\([^)]+\)/g, '')
    cleaned = cleaned.replace(/window\['nitroAds'\]=window\['nitroAds'\]\|\|\{[^}]+\}/g, '')
    cleaned = cleaned.replace(/nitroAds\.(queue|createAd|addUserToken)\([^)]*\)/g, '')

    // 移除页面导航
    cleaned = cleaned.replace(/«[^»]+»/g, '')

    // 规范化空白字符
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    return cleaned
  }

  /**
   * 分割文本为段落
   */
  splitIntoParagraphs(text: string): string[] {
    const paragraphs: string[] = []

    // 按句子分割
    const sentences = text.split(/[。！？.!?]+/)

    let currentParagraph = ''

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (currentParagraph) {
        currentParagraph += ' '
      }
      currentParagraph += trimmedSentence

      // 如果段落足够长，保存它
      if (currentParagraph.length >= this.config.parsing.minParagraphLength) {
        const cleaned = this.clean(currentParagraph)
        if (cleaned) {
          paragraphs.push(cleaned)
        }
        currentParagraph = ''
      }
    }

    // 添加剩余的内容
    if (currentParagraph.trim()) {
      const cleaned = this.clean(currentParagraph)
      if (cleaned) {
        paragraphs.push(cleaned)
      }
    }

    return paragraphs
  }
}