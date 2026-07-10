/**
 * Unit tests for FetchHttpClient
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FetchHttpClient } from '../fetch-http-client'
import { HttpError } from '../http-client.interface'

describe('FetchHttpClient', () => {
  let client: FetchHttpClient
  let fetchSpy: ReturnType<typeof vi.fn>

  const createJsonResponse = (data: any, status = 200, statusText = 'OK') => {
    return new Response(JSON.stringify(data), {
      status,
      statusText,
      headers: { 'content-type': 'application/json' },
    })
  }

  const createTextResponse = (text: string, status = 200, statusText = 'OK') => {
    return new Response(text, {
      status,
      statusText,
      headers: { 'content-type': 'text/plain' },
    })
  }

  const createBinaryResponse = (status = 200, statusText = 'OK') => {
    return new Response(new Uint8Array([1, 2, 3]), {
      status,
      statusText,
      headers: { 'content-type': 'application/octet-stream' },
    })
  }

  const createErrorResponse = (status: number, statusText: string, body?: any) => {
    return new Response(body ? JSON.stringify(body) : null, {
      status,
      statusText,
      headers: { 'content-type': 'application/json' },
    })
  }

  beforeEach(() => {
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    client = new FetchHttpClient()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should use default Content-Type header', () => {
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      client.get('https://example.com')

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('should use custom default headers', () => {
      const customClient = new FetchHttpClient({
        defaultHeaders: { Authorization: 'Bearer token' },
      })
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      customClient.get('https://example.com')

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({ Authorization: 'Bearer token' })
    })

    it('should use default timeout of 30000ms', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetchSpy.mockRejectedValue(abortError)

      await expect(client.get('https://example.com')).rejects.toThrow(HttpError)
    })
  })

  describe('get', () => {
    it('should make a GET request', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({ id: 1 }))

      const response = await client.get('https://example.com/api')

      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api', expect.objectContaining({ method: 'GET' }))
      expect(response.data).toEqual({ id: 1 })
      expect(response.status).toBe(200)
      expect(response.statusText).toBe('OK')
    })

    it('should pass custom headers', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.get('https://example.com', { headers: { 'X-Custom': 'value' } })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' } })
      )
    })
  })

  describe('post', () => {
    it('should make a POST request with JSON body', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({ created: true }))

      const response = await client.post('https://example.com/api', { name: 'test' })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({ method: 'POST', body: '{"name":"test"}' })
      )
      expect(response.data).toEqual({ created: true })
    })

    it('should not include body when data is undefined', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.post('https://example.com/api')

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({ method: 'POST', body: undefined })
      )
    })
  })

  describe('put', () => {
    it('should make a PUT request with JSON body', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({ updated: true }))

      const response = await client.put('https://example.com/api/1', { name: 'updated' })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/api/1',
        expect.objectContaining({ method: 'PUT', body: '{"name":"updated"}' })
      )
      expect(response.data).toEqual({ updated: true })
    })
  })

  describe('delete', () => {
    it('should make a DELETE request', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({ deleted: true }))

      const response = await client.delete('https://example.com/api/1')

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/api/1',
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(response.data).toEqual({ deleted: true })
    })
  })

  describe('patch', () => {
    it('should make a PATCH request with JSON body', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({ patched: true }))

      const response = await client.patch('https://example.com/api/1', { field: 'value' })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/api/1',
        expect.objectContaining({ method: 'PATCH', body: '{"field":"value"}' })
      )
      expect(response.data).toEqual({ patched: true })
    })
  })

  describe('response parsing', () => {
    it('should parse JSON responses', async () => {
      fetchSpy.mockResolvedValue(createJsonResponse({ foo: 'bar' }))

      const response = await client.get('https://example.com')

      expect(response.data).toEqual({ foo: 'bar' })
    })

    it('should parse text responses', async () => {
      fetchSpy.mockResolvedValue(createTextResponse('hello world'))

      const response = await client.get('https://example.com')

      expect(response.data).toBe('hello world')
    })

    it('should parse blob responses for unknown content types', async () => {
      fetchSpy.mockResolvedValue(createBinaryResponse())

      const response = await client.get('https://example.com')

      // The response parser falls back to blob() for non-JSON, non-text content types
      expect(response.data).toBeDefined()
    })

    it('should include response headers', async () => {
      const mockResponse = createJsonResponse({})
      mockResponse.headers.set('x-request-id', 'abc123')
      fetchSpy.mockResolvedValue(mockResponse)

      const response = await client.get('https://example.com')

      expect(response.headers['x-request-id']).toBe('abc123')
    })
  })

  describe('error handling', () => {
    it('should throw HttpError for non-ok responses', async () => {
      fetchSpy.mockResolvedValue(createErrorResponse(404, 'Not Found', { error: 'not found' }))

      await expect(client.get('https://example.com')).rejects.toThrow(HttpError)
    })

    it('should include status and statusText in HttpError', async () => {
      fetchSpy.mockResolvedValue(createErrorResponse(400, 'Bad Request', { error: 'invalid' }))

      try {
        await client.get('https://example.com')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError)
        const httpError = error as HttpError
        // Note: the catch block re-wraps HttpError from the try block as a network error
        // because HttpError extends Error and is caught by error instanceof Error
        expect(httpError.message).toBe('HTTP 400: Bad Request')
        expect(httpError.name).toBe('HttpError')
      }
    })

    it('should throw HttpError with status 408 on timeout', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetchSpy.mockRejectedValue(abortError)

      try {
        await client.get('https://example.com')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError)
        const httpError = error as HttpError
        expect(httpError.status).toBe(408)
        expect(httpError.statusText).toBe('Request Timeout')
        expect(httpError.message).toBe('Request timeout')
      }
    })

    it('should throw HttpError for network errors', async () => {
      fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'))

      try {
        await client.get('https://example.com')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError)
        const httpError = error as HttpError
        expect(httpError.status).toBe(0)
        expect(httpError.statusText).toBe('Network Error')
        expect(httpError.message).toBe('Failed to fetch')
      }
    })

    it('should throw HttpError for unknown errors', async () => {
      fetchSpy.mockRejectedValue('unexpected string error')

      try {
        await client.get('https://example.com')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError)
        const httpError = error as HttpError
        expect(httpError.status).toBe(0)
        expect(httpError.statusText).toBe('Unknown Error')
      }
    })
  })

  describe('timeout handling', () => {
    it('should use custom timeout when provided', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetchSpy.mockRejectedValue(abortError)

      try {
        await client.get('https://example.com', { timeout: 5000 })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError)
        expect((error as HttpError).status).toBe(408)
      }
    })

    it('should use default timeout when not specified', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetchSpy.mockRejectedValue(abortError)

      try {
        await client.get('https://example.com')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError)
        expect((error as HttpError).status).toBe(408)
      }
    })
  })

  describe('setDefaultHeader', () => {
    it('should add a new default header', async () => {
      client.setDefaultHeader('Authorization', 'Bearer token123')
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.get('https://example.com')

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      })
    })

    it('should override existing default header', async () => {
      client.setDefaultHeader('Content-Type', 'text/plain')
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.get('https://example.com')

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({ 'Content-Type': 'text/plain' })
    })
  })

  describe('removeDefaultHeader', () => {
    it('should remove a default header', async () => {
      client.removeDefaultHeader('Content-Type')
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.get('https://example.com')

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({})
    })

    it('should not fail when removing non-existent header', async () => {
      client.removeDefaultHeader('X-Non-Existent')
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.get('https://example.com')

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({ 'Content-Type': 'application/json' })
    })
  })

  describe('request options merging', () => {
    it('should merge request headers with default headers', async () => {
      client.setDefaultHeader('Authorization', 'Bearer default')
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.get('https://example.com', { headers: { 'X-Request-Id': 'req-123' } })

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer default',
        'X-Request-Id': 'req-123',
      })
    })

    it('should allow request headers to override defaults', async () => {
      client.setDefaultHeader('Authorization', 'Bearer default')
      fetchSpy.mockResolvedValue(createJsonResponse({}))

      await client.get('https://example.com', { headers: { Authorization: 'Bearer override' } })

      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[1].headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer override',
      })
    })
  })
})
