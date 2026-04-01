/**
 * 章节解析器
 * 负责从文本中提取各个章节的内容
 */

import { getConfig } from '../shared/config'
import type { ParsedSections, ObjectClass } from '../shared/types'

export class SectionParser {
  private config = getConfig()

  /**
   * 解析所有章节
   */
  parseSections(text: string): ParsedSections {
    return {
      title: this.extractTitle(text),
      objectClass: this.extractObjectClass(text),
      containment: this.parseContainment(text),
      description: this.parseDescription(text),
      appendix: this.parseAppendix(text),
      author: this.extractAuthor(text),
    }
  }

  /**
   * 提取标题
   */
  private extractTitle(text: string): string {
    const patterns = [
      /项目编号[:：]\s*(SCP-?\d+)/i,
      /Item\s*#[:：]\s*(SCP-?\d+)/i,
      /SCP-\d+/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const numberMatch = match[0].match(/SCP-?\d+/)
        if (numberMatch) {
          return numberMatch[0].toUpperCase().replace('SCP-', 'SCP-')
        }
      }
    }

    return 'UNKNOWN'
  }

  /**
   * 提取项目等级
   */
  private extractObjectClass(text: string): ObjectClass {
    const patterns = [
      /项目等级[:：]\s*([^\s]+)/i,
      /Object\s*Class[:：]\s*([^\s]+)/i,
      /分级[:：]\s*([^\s]+)/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        let classText = match[1].trim().toUpperCase()

        // 清理可能的 HTML 实体或标记
        classText = classText.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim()
        classText = classText.replace(/\*\*/g, '').trim()

        const knownClasses: ObjectClass[] = ['SAFE', 'EUCLID', 'KETER', 'THAUMIEL', 'NEUTRALIZED', 'PENDING']
        for (const className of knownClasses) {
          if (classText.includes(className)) {
            return className
          }
        }
      }
    }

    return 'UNKNOWN'
  }

  /**
   * 解析收容措施
   */
  private parseContainment(text: string): string[] {
    const patterns = [
      /\*\*特殊收容措施[:：]\*\*[\s\S]*?(?=\*\*描述[:：]\*\*|\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
      /\*\*收容措施[:：]\*\*[\s\S]*?(?=\*\*描述[:：]\*\*|\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
      /特殊收容措施[:：][\s\S]*?(?=\*\*描述[:：]\*\*|\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const containmentText = match[0]
          .replace(/\*\*特殊收容措施[:：]\*\*|\*\*收容措施[:：]\*\*/gi, '')
          .trim()

        const paragraphs = this.parseParagraphs(containmentText)
        if (paragraphs.length > 0) {
          return paragraphs
        }
      }
    }

    return []
  }

  /**
   * 解析描述
   */
  private parseDescription(text: string): string[] {
    const patterns = [
      /\*\*描述[:：]\*\*[\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|\*\*附录|$)/is,
      /\*\*Description[:：]\*\*[\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
      /描述[:：][\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const descriptionText = match[0]
          .replace(/\*\*描述[:：]\*\*/gi, '')
          .trim()

        const paragraphs = this.parseParagraphs(descriptionText)
        if (paragraphs.length > 0) {
          return paragraphs
        }
      }
    }

    return []
  }

  /**
   * 解析附录
   */
  private parseAppendix(text: string): string[] {
    const appendixPattern = /\*\*附录[^：:]*[:：]*\*\*[\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/gis
    const appendix: string[] = []

    let match
    while ((match = appendixPattern.exec(text)) !== null) {
      const appendixText = match[0]
        .replace(/\*\*附录[^：:]*[:：]*\*\*/gi, '')
        .trim()

      const paragraphs = this.parseParagraphs(appendixText)
      appendix.push(...paragraphs)
    }

    return appendix
  }

  /**
   * 提取作者信息
   */
  private extractAuthor(text: string): string | undefined {
    const patterns = [
      /\*\*作者[:：]\*\*\s*([^\*\n]+)/i,
      /\*\*创作信息[:：]\*\*\s*([^\*\n]+)/i,
      /\*\*创作者信息[:：]\*\*\s*([^\*\n]+)/i,
      /\*\*Author[:：]\*\*\s*([^\*\n]+)/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim().replace(/\*\*/g, '')
      }
    }

    return undefined
  }

  /**
   * 解析段落
   */
  private parseParagraphs(text: string): string[] {
    // 移除 HTML 标签
    let cleanText = text.replace(/<[^>]+>/g, '')

    // 移除 Markdown 语法（保留文本）
    cleanText = cleanText.replace(/\*\*/g, '') // 移除加粗
    cleanText = cleanText.replace(/\*/g, '')  // 移除斜体
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片标记

    // 移除 JavaScript 代码和广告相关内容
    cleanText = cleanText.replace(/window\[['"]nitroAds['"]\]\.createAd\([^)]+\)/g, '')
    cleanText = cleanText.replace(/window\['nitroAds'\]=window\['nitroAds'\]\|\|\{[^}]+\}/g, '')
    cleanText = cleanText.replace(/nitroAds\.(queue|createAd|addUserToken)\([^)]*\)/g, '')

    // 移除页面导航链接
    cleanText = cleanText.replace(/«[^»]+»/g, '')

    // 移除页面底部工具栏内容
    cleanText = cleanText.replace(/页面版本[:：]\s*\d+[^。]*。/g, '')
    cleanText = cleanText.replace(/最后编辑于[:：][^。]+。/g, '')
    cleanText = cleanText.replace(/编辑\s*评分\s*\([^)]+\)/g, '')
    cleanText = cleanText.replace(/标签\s*讨论\s*\([^)]+\)/g, '')
    cleanText = cleanText.replace(/历史记录\s*附件\s*打印/g, '')

    // 规范化空白字符
    cleanText = cleanText.replace(/\s+/g, ' ').trim()

    // 分割成段落
    const paragraphs: string[] = []
    const sentences = cleanText.split(/[。！？.!?]+/)
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
        paragraphs.push(currentParagraph.trim())
        currentParagraph = ''
      }
    }

    // 添加剩余的内容
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim())
    }

    // 过滤无关内容
    return paragraphs.filter(p => {
      // 基本长度过滤
      if (p.length < this.config.parsing.minParagraphLength) return false
      if (p.length > this.config.parsing.maxParagraphLength) return false

      // 检查是否包含无关内容
      for (const pattern of this.config.parsing.ignorePatterns) {
        if (pattern.test(p)) return false
      }

      // 检查是否全是数字或特殊字符
      if (/^[\d\s\-\+\=\*\_]+$/.test(p)) return false

      return true
    })
  }
}
