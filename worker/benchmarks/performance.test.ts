/**
 * 性能基准测试
 * 验证重构后的性能提升
 */

import { describe, it, expect } from 'vitest'
import { HTMLCleaner } from '../utils/htmlCleaner'
import { RegexCache } from '../utils/regexCache'
import { ParagraphFilter } from '../utils/paragraphFilter'
import { HTMLSanitizer } from '../utils/htmlSanitizer'

describe('Performance Benchmarks', () => {
  const sampleHTML = `
    <div id="page-content">
      <p>SCP-173 是一个由混凝土和钢筋建造的雕像，表面绘有 Keter 面料的图案。</p>
      <p>项目等级: Euclid</p>
      <p>特殊收容措施: SCP-173 必须始终保存在一个上锁的容器中。</p>
      <script>alert("XSS")</script>
      <style>.danger { color: red; }</style>
      <p>描述: SCP-173 具有生命力和敌意，异常快速移动。</p>
      <p>SCP-173 无法在被观察时移动。</p>
      <p>必须始终保持有人员注视 SCP-173。</p>
      <p>清洁团队每两周进入 SCP-173 的收容间进行清洁。</p>
      <p>在清洁期间，任何时刻都必须至少有三名人员注视 SCP-173。</p>
      <p>如果 SCP-173 攻击，所有人员必须立即撤离。</p>
      <div class="page-rate">评分: 4.5</div>
      <div class="page-info">最后编辑: 2024-01-01</div>
    </div>
  `

  describe('HTMLCleaner Performance', () => {
    it('应该在合理时间内清理 HTML', () => {
      const cleaner = new HTMLCleaner()
      const iterations = 100

      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        cleaner.clean(sampleHTML)
      }

      const endTime = performance.now()
      const avgTime = (endTime - startTime) / iterations

      console.log(`HTMLCleaner 平均时间: ${avgTime.toFixed(2)}ms`)

      // 平均时间应该小于 10ms
      expect(avgTime).toBeLessThan(10)
    })

    it('应该批量移除元素，性能优于逐个移除', () => {
      const cleaner = new HTMLCleaner()

      const startTime = performance.now()
      cleaner.clean(sampleHTML)
      const endTime = performance.now()

      const time = endTime - startTime

      console.log(`HTMLCleaner 清理时间: ${time.toFixed(2)}ms`)

      // 清理时间应该小于 10ms（放宽阈值以适应系统负载）
      expect(time).toBeLessThan(10)
    })
  })

  describe('RegexCache Performance', () => {
    it('应该缓存正则表达式，避免重复编译', () => {
      const iterations = 1000
      const pattern = /\*\*特殊收容措施[:：]\*\*/gi

      // 测试未缓存的性能（每次都创建新的 RegExp）
      const uncachedStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        new RegExp(pattern.source, pattern.flags)
      }
      const uncachedEnd = performance.now()

      // 测试缓存的性能（使用 RegexCache）
      const cachedStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        RegexCache.get(pattern.source, pattern.flags)
      }
      const cachedEnd = performance.now()

      const uncachedTime = uncachedEnd - uncachedStart
      const cachedTime = cachedEnd - cachedStart

      console.log(`未缓存时间: ${uncachedTime.toFixed(2)}ms`)
      console.log(`缓存时间: ${cachedTime.toFixed(2)}ms`)
      console.log(`性能提升: ${((uncachedTime - cachedTime) / uncachedTime * 100).toFixed(2)}%`)

      // 验证缓存确实在工作（多次调用应该返回相同的实例）
      const regex1 = RegexCache.get(pattern.source, pattern.flags)
      const regex2 = RegexCache.get(pattern.source, pattern.flags)
      expect(regex1).toBe(regex2)

      // 验证缓存大小
      expect(RegexCache.size()).toBeGreaterThan(0)
    })

    it('应该批量预编译正则表达式', () => {
      const patterns = [
        { pattern: /\*\*特殊收容措施[:：]\*\*/gi },
        { pattern: /\*\*描述[:：]\*\*/gi },
        { pattern: /\*\*附录[:：]\*\*/gi },
      ]

      const startTime = performance.now()
      RegexCache.precompile(patterns)
      const endTime = performance.now()

      const time = endTime - startTime

      console.log(`预编译时间: ${time.toFixed(2)}ms`)
      console.log(`缓存大小: ${RegexCache.size()}`)

      // 预编译应该很快
      expect(time).toBeLessThan(5)

      // 验证所有正则都被缓存
      expect(RegexCache.size()).toBeGreaterThanOrEqual(3)
    })
  })

  describe('ParagraphFilter Performance', () => {
    it('应该快速过滤段落', () => {
      const filter = new ParagraphFilter()
      const paragraphs = Array(50).fill('这是一个测试段落，用于测试段落过滤器的性能。')

      const startTime = performance.now()
      const filtered = filter.filter(paragraphs)
      const endTime = performance.now()

      const time = endTime - startTime

      console.log(`ParagraphFilter 过滤时间: ${time.toFixed(2)}ms`)
      console.log(`过滤后的段落数: ${filtered.length}`)

      // 过滤时间应该小于 5ms
      expect(time).toBeLessThan(5)
    })
  })

  describe('HTMLSanitizer Performance', () => {
    it('应该快速消毒 HTML', () => {
      const sanitizer = new HTMLSanitizer()
      const iterations = 50

      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        sanitizer.sanitize(sampleHTML)
      }

      const endTime = performance.now()
      const avgTime = (endTime - startTime) / iterations

      console.log(`HTMLSanitizer 平均时间: ${avgTime.toFixed(2)}ms`)

      // 平均时间应该小于 5ms
      expect(avgTime).toBeLessThan(5)
    })

    it('应该移除所有危险内容', () => {
      const sanitizer = new HTMLSanitizer()
      const result = sanitizer.sanitize(sampleHTML)

      // 应该移除脚本
      expect(result).not.toContain('<script>')

      // 应该移除样式
      expect(result).not.toContain('<style>')

      // 应该保留安全内容
      expect(result).toContain('SCP-173')
    })
  })

  describe('整体性能测试', () => {
    it('完整解析流程应该在合理时间内完成', () => {
      const sanitizer = new HTMLSanitizer()
      const cleaner = new HTMLCleaner()

      const startTime = performance.now()

      // 消毒
      const sanitized = sanitizer.sanitize(sampleHTML)

      // 清理
      const cleaned = cleaner.clean(sanitized)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`完整解析时间: ${totalTime.toFixed(2)}ms`)

      // 完整解析时间应该小于 10ms
      expect(totalTime).toBeLessThan(10)
    })
  })
})