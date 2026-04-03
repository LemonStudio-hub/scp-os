/**
 * Fetch HTTP Client
 * HTTP client implementation using Fetch API
 */

import type { IHttpClient, HttpRequestOptions, HttpResponse } from './http-client.interface'
import { HttpError } from './http-client.interface'

/**
 * Fetch HTTP Client
 */
export class FetchHttpClient implements IHttpClient {
  private defaultHeaders: Record<string, string>
  private defaultTimeout: number

  constructor(config?: {
    defaultHeaders?: Record<string, string>
    defaultTimeout?: number
  }) {
    this.defaultHeaders = config?.defaultHeaders || {
      'Content-Type': 'application/json'
    }
    this.defaultTimeout = config?.defaultTimeout || 30000
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'GET',
      ...options
    })
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'DELETE',
      ...options
    })
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
  }

  /**
   * Make a request with timeout
   */
  private async request<T = any>(
    url: string,
    options: HttpRequestOptions & { method: string; body?: string }
  ): Promise<HttpResponse<T>> {
    const timeout = options.timeout ?? this.defaultTimeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        controller.abort()
      })
    }

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        body: options.body,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      const data = await this.parseResponse<T>(response)

      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          data
        )
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new HttpError('Request timeout', 408, 'Request Timeout')
        }
        throw new HttpError(error.message, 0, 'Network Error')
      }

      throw new HttpError('Unknown error', 0, 'Unknown Error')
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return response.json()
    }

    if (contentType?.includes('text/')) {
      return response.text() as T
    }

    return response.blob() as T
  }

  /**
   * Set default header
   */
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value
  }

  /**
   * Remove default header
   */
  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key]
  }
}