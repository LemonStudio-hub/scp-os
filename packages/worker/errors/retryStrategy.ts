/**
 * 重试策略
 * 智能的重试逻辑，支持指数退避
 */

import type { ScraperError } from './scraperError'
import { ScraperErrorType } from './scraperError'

export class RetryStrategy {
  private static readonly RETRYABLE_ERRORS = [
    ScraperErrorType.NETWORK_ERROR,
    ScraperErrorType.RATE_LIMIT_ERROR,
    ScraperErrorType.TIMEOUT_ERROR,
  ]

  /**
   * 判断是否应该重试
   */
  shouldRetry(error: ScraperError, attempt: number, maxAttempts: number): boolean {
    return (
      RetryStrategy.RETRYABLE_ERRORS.includes(error.type) &&
      error.retryable &&
      attempt < maxAttempts
    )
  }

  /**
   * 获取重试延迟时间（指数退避）
   */
  getRetryDelay(attempt: number, baseDelay: number): number {
    // 指数退避：baseDelay * 2^attempt
    const delay = baseDelay * Math.pow(2, attempt)

    // 限制最大延迟时间为 10 秒
    return Math.min(delay, 10000)
  }

  /**
   * 执行带重试的异步操作
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // 检查是否应该重试
        if (attempt < maxAttempts - 1 && this.shouldRetry(error as ScraperError, attempt, maxAttempts)) {
          const delay = this.getRetryDelay(attempt, baseDelay)
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, (error as ScraperError).message)
          await this.delay(delay)
        } else {
          break
        }
      }
    }

    throw lastError
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}