/**
 * HTTP Client Interface
 * Abstract HTTP client for making HTTP requests
 */

/**
 * HTTP Request Options
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
}

/**
 * HTTP Response
 */
export interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
}

/**
 * HTTP Error
 */
export class HttpError extends Error {
  public readonly status: number
  public readonly statusText: string
  public readonly data?: any

  constructor(
    message: string,
    status: number,
    statusText: string,
    data?: any
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

/**
 * HTTP Client Interface
 */
export interface IHttpClient {
  /**
   * Make a GET request
   */
  get<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>

  /**
   * Make a POST request
   */
  post<T = any>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>

  /**
   * Make a PUT request
   */
  put<T = any>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>

  /**
   * Make a DELETE request
   */
  delete<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>

  /**
   * Make a PATCH request
   */
  patch<T = any>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>
}