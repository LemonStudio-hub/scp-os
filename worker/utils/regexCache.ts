/**
 * 正则表达式缓存
 * 缓存编译后的正则表达式，避免重复编译
 */

export class RegexCache {
  private static cache = new Map<string, RegExp>()

  /**
   * 获取或创建正则表达式
   */
  static get(pattern: string, flags?: string): RegExp {
    const key = `${pattern}:${flags || ''}`

    if (!this.cache.has(key)) {
      this.cache.set(key, new RegExp(pattern, flags))
    }

    return this.cache.get(key)!
  }

  /**
   * 获取或创建正则表达式（使用正则对象）
   */
  static fromRegex(regex: RegExp): RegExp {
    const key = `${regex.source}:${regex.flags}`

    if (!this.cache.has(key)) {
      this.cache.set(key, regex)
    }

    return this.cache.get(key)!
  }

  /**
   * 预编译多个正则表达式
   */
  static precompile(patterns: Array<{ pattern: string; flags?: string }>): void {
    patterns.forEach(({ pattern, flags }) => {
      this.get(pattern, flags)
    })
  }

  /**
   * 清除缓存
   */
  static clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  static size(): number {
    return this.cache.size
  }

  /**
   * 批量获取正则表达式
   */
  static getMany(patterns: Array<{ pattern: string; flags?: string }>): RegExp[] {
    return patterns.map(({ pattern, flags }) => this.get(pattern, flags))
  }
}