/**
 * 爬虫错误类
 * 分类和标准化爬虫错误
 */

export enum ScraperErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  BLOCKED_ERROR = 'BLOCKED_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export class ScraperError extends Error {
  constructor(
    message: string,
    public type: ScraperErrorType,
    public retryable: boolean,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ScraperError'

    // 保持原型链
    Object.setPrototypeOf(this, ScraperError.prototype)
  }

  /**
   * 创建网络错误
   */
  static networkError(message: string, statusCode?: number): ScraperError {
    return new ScraperError(
      `Network error: ${message}`,
      ScraperErrorType.NETWORK_ERROR,
      true,
      statusCode
    )
  }

  /**
   * 创建解析错误
   */
  static parseError(message: string, details?: Record<string, any>): ScraperError {
    return new ScraperError(
      `Parse error: ${message}`,
      ScraperErrorType.PARSE_ERROR,
      false,
      undefined,
      details
    )
  }

  /**
   * 创建缓存错误
   */
  static cacheError(message: string): ScraperError {
    return new ScraperError(
      `Cache error: ${message}`,
      ScraperErrorType.CACHE_ERROR,
      false
    )
  }

  /**
   * 创建速率限制错误
   */
  static rateLimitError(): ScraperError {
    return new ScraperError(
      'Rate limit exceeded',
      ScraperErrorType.RATE_LIMIT_ERROR,
      true,
      429
    )
  }

  /**
   * 创建被阻止错误
   */
  static blockedError(message: string): ScraperError {
    return new ScraperError(
      `Blocked: ${message}`,
      ScraperErrorType.BLOCKED_ERROR,
      false
    )
  }

  /**
   * 创建验证错误
   */
  static validationError(message: string): ScraperError {
    return new ScraperError(
      `Validation error: ${message}`,
      ScraperErrorType.VALIDATION_ERROR,
      false
    )
  }

  /**
   * 创建超时错误
   */
  static timeoutError(): ScraperError {
    return new ScraperError(
      'Request timeout',
      ScraperErrorType.TIMEOUT_ERROR,
      true
    )
  }

  /**
   * 从 Error 对象创建 ScraperError
   */
  static fromError(error: Error): ScraperError {
    if (error instanceof ScraperError) {
      return error
    }

    return new ScraperError(
      error.message,
      ScraperErrorType.NETWORK_ERROR,
      true
    )
  }

  /**
   * 转换为 JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      retryable: this.retryable,
      statusCode: this.statusCode,
      details: this.details,
    }
  }
}