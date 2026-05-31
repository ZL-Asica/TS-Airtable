import type { GetRecordParams, ListRecordsParams } from '@/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AirtableCoreClient,
  DEFAULT_ENDPOINT_URL,
  MAX_LIST_RECORDS_GET_URL_LENGTH,
  MAX_RECORDS_PER_BATCH,
} from '@/client/core'
import { AirtableError } from '@/errors'

function jsonResponse(status: number, body: unknown, extraHeaders?: Record<string, string>) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  })
  return new Response(JSON.stringify(body), { status, headers })
}

describe('airtableCoreClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports constants', () => {
    expect(DEFAULT_ENDPOINT_URL).toBe('https://api.airtable.com')
    expect(MAX_RECORDS_PER_BATCH).toBe(10)
    expect(MAX_LIST_RECORDS_GET_URL_LENGTH).toBe(16_000)
  })

  it('throws if apiKey is missing', () => {
    expect(
      () =>
        new AirtableCoreClient({
          apiKey: '',
          baseId: 'app123',
          fetch: vi.fn() as any,
        }),
    ).toThrow('AirtableClient: apiKey is required')
  })

  it('throws if baseId is missing', () => {
    expect(
      () =>
        new AirtableCoreClient({
          apiKey: 'key',
          baseId: '',
          fetch: vi.fn() as any,
        }),
    ).toThrow('AirtableClient: baseId is required')
  })

  it('throws if neither custom fetch nor global fetch is available', () => {
    const originalFetch = (globalThis as any).fetch
    ;(globalThis as any).fetch = undefined

    expect(
      () =>
        new AirtableCoreClient({
          apiKey: 'key',
          baseId: 'app123',
          // No options.fetch
        } as any),
    ).toThrow(
      'AirtableClient: fetch is not available in this environment. '
      + 'Provide a custom fetch implementation in AirtableClientOptions.',
    )

    ;(globalThis as any).fetch = originalFetch
  })

  it('uses provided options and defaults in constructor', () => {
    const fetchMock = vi.fn() as unknown as typeof fetch

    const core = new AirtableCoreClient({
      apiKey: 'key-123',
      baseId: 'app123',
      endpointUrl: 'https://example.com',
      fetch: fetchMock,
      apiVersion: '0.4.0',
      customHeaders: { 'X-Foo': 'bar' },
      maxRetries: 7,
      retryInitialDelayMs: 250,
      retryOnStatuses: [429, 500],
      noRetryIfRateLimited: false,
    })

    expect(core.apiKey).toBe('key-123')
    expect(core.baseId).toBe('app123')
    expect(core.endpointUrl).toBe('https://example.com')
    expect(core.fetchImpl).toBe(fetchMock)
    expect(core.maxRetries).toBe(7)
    expect(core.retryInitialDelayMs).toBe(250)
    expect(core.retryOnStatuses).toEqual([429, 500])
    expect(core.apiVersion).toBe('0.4.0')
    expect(core.customHeaders).toEqual({ 'X-Foo': 'bar' })
    expect(core.noRetryIfRateLimited).toBe(false)
  })

  it('falls back to DEFAULT_ENDPOINT_URL and default retry options', () => {
    const fetchMock = vi.fn() as unknown as typeof fetch

    const core = new AirtableCoreClient({
      apiKey: 'key-123',
      baseId: 'app123',
      fetch: fetchMock,
    })

    expect(core.endpointUrl).toBe(DEFAULT_ENDPOINT_URL)
    expect(core.maxRetries).toBe(5)
    expect(core.retryInitialDelayMs).toBe(500)
    expect(core.retryOnStatuses).toEqual([429, 500, 502, 503, 504])
    expect(core.apiVersion).toBeUndefined()
    // Default behavior: retry rate limits and respect Retry-After.
    expect(core.noRetryIfRateLimited).toBe(false)
  })

  it('buildTableUrl builds table and record URLs with optional query', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
    })

    const urlNoQuery = core.buildTableUrl('Tasks')
    expect(urlNoQuery.pathname).toBe('/v0/baseId/Tasks')
    expect(urlNoQuery.search).toBe('')

    const params = new URLSearchParams()
    params.set('view', 'Grid view')

    const urlWithRecord = core.buildTableUrl('Tasks', 'rec123', params)
    expect(urlWithRecord.pathname).toBe('/v0/baseId/Tasks/rec123')
    expect(urlWithRecord.searchParams.get('view')).toBe('Grid view')
  })

  it('buildMetaUrl builds /v0/meta URLs with optional query', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
    })

    const url = core.buildMetaUrl('/bases')
    expect(url.pathname).toBe('/v0/meta/bases')
    expect(url.search).toBe('')

    const search = new URLSearchParams()
    search.set('offset', 'abc')
    const url2 = core.buildMetaUrl('/bases', search)
    expect(url2.searchParams.get('offset')).toBe('abc')
  })

  it('buildBaseUrl builds /v0/bases/{baseId} URLs and normalizes path', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
    })

    const url1 = core.buildBaseUrl('/webhooks')
    expect(url1.pathname).toBe('/v0/bases/baseId/webhooks')

    const url2 = core.buildBaseUrl('webhooks')
    expect(url2.pathname).toBe('/v0/bases/baseId/webhooks')

    const search = new URLSearchParams()
    search.set('q', 'test')
    const url3 = core.buildBaseUrl('/webhooks', search)
    expect(url3.searchParams.get('q')).toBe('test')
  })

  it('uses the v0 path for official-style and v-prefixed apiVersion values', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
      apiVersion: '0.4.0',
    })

    expect(core.buildTableUrl('Tasks').pathname).toBe('/v0/baseId/Tasks')
    expect(core.buildMetaUrl('/bases').pathname).toBe('/v0/meta/bases')
    expect(core.buildBaseUrl('/webhooks').pathname).toBe('/v0/bases/baseId/webhooks')

    const vPrefixed = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
      apiVersion: 'v1',
    })

    expect(vPrefixed.buildTableUrl('Tasks').pathname).toBe('/v0/baseId/Tasks')
  })

  it('buildListQuery returns undefined when no params and builds full query otherwise', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
    })

    // Branch 1: no params -> undefined
    expect(core.buildListQuery()).toBeUndefined()

    // Branch 2: with all fields, covering all if branches + fields/sort loops
    const params: ListRecordsParams = {
      maxRecords: 100,
      pageSize: 50,
      offset: 'off',
      view: 'Grid',
      fields: ['Name', 'Status'],
      filterByFormula: 'Status="Todo"',
      sort: [
        { field: 'Name', direction: 'asc' }, // has direction
        { field: 'CreatedAt' }, // no direction, hits the false branch of `if (spec.direction)`
      ],
      cellFormat: 'json',
      timeZone: 'UTC',
      userLocale: 'en',
      returnFieldsByFieldId: true,
    }

    const search = core.buildListQuery(params)!
    expect(search.get('maxRecords')).toBe('100')
    expect(search.get('pageSize')).toBe('50')
    expect(search.get('offset')).toBe('off')
    expect(search.get('view')).toBe('Grid')
    expect(search.get('filterByFormula')).toBe('Status="Todo"')
    expect(search.get('cellFormat')).toBe('json')
    expect(search.get('timeZone')).toBe('UTC')
    expect(search.get('userLocale')).toBe('en')
    expect(search.get('returnFieldsByFieldId')).toBe('true')

    // fields[] loop
    expect(search.getAll('fields[]')).toEqual(['Name', 'Status'])

    // sort loop: first has direction
    expect(search.get('sort[0][field]')).toBe('Name')
    expect(search.get('sort[0][direction]')).toBe('asc')

    // Second has no direction, should not generate key direction
    expect(search.get('sort[1][field]')).toBe('CreatedAt')
    expect(search.get('sort[1][direction]')).toBeNull()
  })

  it('buildGetQuery returns undefined when no params and builds query otherwise', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
    })

    expect(core.buildGetQuery()).toBeUndefined()

    const params: GetRecordParams = {
      cellFormat: 'string',
      timeZone: 'Asia/Shanghai',
      userLocale: 'zh',
      returnFieldsByFieldId: false,
    }

    const search = core.buildGetQuery(params)!
    expect(search.get('cellFormat')).toBe('string')
    expect(search.get('timeZone')).toBe('Asia/Shanghai')
    expect(search.get('userLocale')).toBe('zh')
    expect(search.get('returnFieldsByFieldId')).toBe('false')
  })

  it('buildReturnFieldsQuery returns undefined when not specified and builds query otherwise', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'baseId',
      fetch: vi.fn() as any,
    })

    expect(core.buildReturnFieldsQuery(undefined)).toBeUndefined()

    const search = core.buildReturnFieldsQuery(true)!
    expect(search.get('returnFieldsByFieldId')).toBe('true')

    const searchFalse = core.buildReturnFieldsQuery(false)!
    expect(searchFalse.get('returnFieldsByFieldId')).toBe('false')
  })

  it('requestJson injects Authorization header and Content-Type for non-GET methods', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { ok: true }),
    )

    const core = new AirtableCoreClient({
      apiKey: 'secret',
      baseId: 'baseId',
      fetch: fetchMock as any,
    })

    const url = new URL('https://example.com/api')
    const result = await core.requestJson<{ ok: boolean }>(url, {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
    })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toBe(url.toString())
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer secret')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('requestJson does not override existing Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { ok: true }),
    )

    const core = new AirtableCoreClient({
      apiKey: 'secret',
      baseId: 'baseId',
      fetch: fetchMock as any,
    })

    const url = new URL('https://example.com/api')
    await core.requestJson(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'raw',
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('text/plain')
  })

  it('requestJson treats method names case-insensitively when setting Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { ok: true }),
    )

    const core = new AirtableCoreClient({
      apiKey: 'secret',
      baseId: 'baseId',
      fetch: fetchMock as any,
    })

    await core.requestJson(new URL('https://example.com/api'), {
      method: 'post',
      body: JSON.stringify({ records: [] }),
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('requestJson accepts Headers-like instances and tuple headers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const core = new AirtableCoreClient({
      apiKey: 'secret',
      baseId: 'baseId',
      fetch: fetchMock as any,
    })

    await core.requestJson(new URL('https://example.com/headers'), {
      method: 'GET',
      headers: new Headers({ 'X-From-Headers': 'yes' }),
    })
    await core.requestJson(new URL('https://example.com/tuples'), {
      method: 'GET',
      headers: [['X-From-Tuple', 'yes']],
    })
    await core.requestJson(new URL('https://example.com/headers-like'), {
      method: 'GET',
      headers: {
        forEach(callback: (value: string, key: string) => void) {
          callback('yes', 'X-From-Headers-Like')
        },
      } as any,
    })
    await core.requestJson(new URL('https://example.com/iterable'), {
      method: 'GET',
      headers: {
        * [Symbol.iterator]() {
          yield ['X-From-Iterable', 'yes'] as const
        },
      } as any,
    })

    const [, headersInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headersFromHeaders = headersInit.headers as Record<string, string>
    expect(headersFromHeaders['x-from-headers']).toBe('yes')

    const [, tupleInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    const headersFromTuple = tupleInit.headers as Record<string, string>
    expect(headersFromTuple['X-From-Tuple']).toBe('yes')

    const [, headersLikeInit] = fetchMock.mock.calls[2] as [string, RequestInit]
    const headersFromHeadersLike = headersLikeInit.headers as Record<string, string>
    expect(headersFromHeadersLike['X-From-Headers-Like']).toBe('yes')

    const [, iterableInit] = fetchMock.mock.calls[3] as [string, RequestInit]
    const headersFromIterable = iterableInit.headers as Record<string, string>
    expect(headersFromIterable['X-From-Iterable']).toBe('yes')
  })

  it('handleResponse returns undefined for 204 status', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = new Response(null, { status: 204 })
    // @ts-expect-error testing private method
    const result = await core.handleResponse<string>(resp)
    expect(result).toBeUndefined()
  })

  it('handleResponse returns parsed JSON for 2xx with JSON Content-Type', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = jsonResponse(200, { foo: 'bar' })
    // @ts-expect-error testing private method
    const result = await core.handleResponse<{ foo: string }>(resp)
    expect(result).toEqual({ foo: 'bar' })
  })

  it('handleResponse parses JSON Content-Type case-insensitively', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: new Headers({ 'Content-Type': 'Application/JSON' }),
    })

    // @ts-expect-error testing private method
    const result = await core.handleResponse(resp)
    expect(result).toEqual({ ok: true })
  })

  it('handleResponse returns undefined for empty JSON bodies', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = new Response('', {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })

    // @ts-expect-error testing private method
    const result = await core.handleResponse(resp)
    expect(result).toBeUndefined()
  })

  it('handleResponse throws SyntaxError for invalid successful JSON', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = new Response('{not valid json', {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })

    await expect(
      // @ts-expect-error testing private method
      core.handleResponse(resp),
    ).rejects.toBeInstanceOf(SyntaxError)
  })

  it('handleResponse returns plain text for 2xx non-JSON Content-Type', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = new Response('hello', {
      status: 200,
      headers: new Headers({ 'Content-Type': 'text/plain' }),
    })
    // @ts-expect-error testing private method
    const result = await core.handleResponse<string>(resp)
    expect(result).toBe('hello')
  })

  it('handleResponse throws AirtableError with payload for non-2xx JSON', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = jsonResponse(400, {
      error: { type: 'INVALID_REQUEST', message: 'Bad' },
    })

    await expect(
      // @ts-expect-error testing private method
      core.handleResponse(resp),
    ).rejects.toMatchObject({
      status: 400,
      type: 'INVALID_REQUEST',
      message: 'Bad',
    })
  })

  it('handleResponse throws AirtableError without payload for non-2xx non-JSON', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = new Response('oops', {
      status: 500,
      headers: new Headers({ 'Content-Type': 'text/plain' }),
    })

    await expect(
      // @ts-expect-error testing private method
      core.handleResponse(resp),
    ).rejects.toBeInstanceOf(AirtableError)
  })

  it('handleResponse wraps invalid non-2xx JSON as AirtableError', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    const resp = new Response('{not valid json', {
      status: 500,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })

    await expect(
      // @ts-expect-error testing private method
      core.handleResponse(resp),
    ).rejects.toMatchObject({
      status: 500,
    })
  })

  it('shouldRetry respects maxRetries and retryOnStatuses when noRetryIfRateLimited is false', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
      maxRetries: 2,
      noRetryIfRateLimited: false,
      retryOnStatuses: [429, 500],
    })

    // @ts-expect-error private method
    expect(core.shouldRetry(429, 0)).toBe(true)
    // @ts-expect-error private method
    expect(core.shouldRetry(500, 1)).toBe(true)
    // attempt >= maxRetries
    // @ts-expect-error private method
    expect(core.shouldRetry(429, 2)).toBe(false)
    // status not in retryOnStatuses
    // @ts-expect-error private method
    expect(core.shouldRetry(404, 0)).toBe(false)
  })

  it('shouldRetry retries 429 by default and can disable rate-limit retries', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
      maxRetries: 2,
      retryOnStatuses: [429, 500],
    })

    // @ts-expect-error private method
    expect(core.shouldRetry(429, 0)).toBe(true)
    // Other statuses still follow retryOnStatuses
    // @ts-expect-error private method
    expect(core.shouldRetry(500, 0)).toBe(true)

    const noRateLimitRetry = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
      maxRetries: 2,
      retryOnStatuses: [429, 500],
      noRetryIfRateLimited: true,
    })

    // @ts-expect-error private method
    expect(noRateLimitRetry.shouldRetry(429, 0)).toBe(false)
  })

  it('getRetryDelayMs uses Retry-After header when valid', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
      retryInitialDelayMs: 100,
    })

    const resp = new Response('', {
      status: 429,
      headers: new Headers({ 'Retry-After': '2' }),
    })

    // @ts-expect-error private method
    const delay = core.getRetryDelayMs(resp, 0)
    expect(delay).toBe(2000)
  })

  it('getRetryDelayMs falls back to exponential backoff when no valid Retry-After', () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
      retryInitialDelayMs: 100,
    })

    const resp = new Response('', {
      status: 429,
      headers: new Headers(), // no Retry-After
    })

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0) // no jitter
    // @ts-expect-error private method
    const delay = core.getRetryDelayMs(resp, 1)
    expect(delay).toBe(100 * 2 ** 1) // base * 2^attempt

    randomSpy.mockRestore()
  })

  it('sleep helper resolves (covers setTimeout line)', async () => {
    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: vi.fn() as any,
    })

    // @ts-expect-error private method
    await core.sleep(0)

    expect(true).toBe(true)
  })

  it('requestJson retries on retryable errors when noRetryIfRateLimited is false and eventually succeeds', async () => {
    const first = jsonResponse(429, {
      error: { type: 'RATE_LIMIT', message: 'slow down' },
    })
    const second = jsonResponse(200, { ok: true })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      noRetryIfRateLimited: false,
      retryOnStatuses: [429],
      maxRetries: 3,
      retryInitialDelayMs: 1,
    })

    // mock sleep avoid actual delay
    // @ts-expect-error private property
    core.sleep = vi.fn().mockResolvedValue(undefined)

    const url = new URL('https://example.com')
    const result = await core.requestJson<{ ok: boolean }>(url, { method: 'GET' })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requestJson stops retrying after maxRetries and throws error', async () => {
    const resp429 = jsonResponse(429, {
      error: { type: 'RATE_LIMIT', message: 'still failing' },
    })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resp429)
      .mockResolvedValueOnce(resp429)

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      noRetryIfRateLimited: false,
      retryOnStatuses: [429],
      maxRetries: 1,
      retryInitialDelayMs: 1,
    })

    // @ts-expect-error private property
    core.sleep = vi.fn().mockResolvedValue(undefined)

    const url = new URL('https://example.com')
    await expect(core.requestJson(url, { method: 'GET' })).rejects.toBeInstanceOf(
      AirtableError,
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requestJson retries 429 by default', async () => {
    const resp429 = jsonResponse(429, {
      error: { type: 'RATE_LIMIT', message: 'retry' },
    })
    const success = jsonResponse(200, { ok: true })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resp429)
      .mockResolvedValueOnce(success)

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      retryOnStatuses: [429],
      maxRetries: 3,
      retryInitialDelayMs: 1,
    })

    // @ts-expect-error private property
    core.sleep = vi.fn().mockResolvedValue(undefined)

    const result = await core.requestJson<{ ok: boolean }>(
      new URL('https://example.com'),
      { method: 'GET' },
    )

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requestJson does not retry 429 when noRetryIfRateLimited is true', async () => {
    const resp429 = jsonResponse(429, {
      error: { type: 'RATE_LIMIT', message: 'no retry' },
    })

    const fetchMock = vi.fn().mockResolvedValue(resp429)

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      retryOnStatuses: [429],
      maxRetries: 3,
      retryInitialDelayMs: 1,
      noRetryIfRateLimited: true,
    })

    const url = new URL('https://example.com')

    await expect(core.requestJson(url, { method: 'GET' })).rejects.toBeInstanceOf(
      AirtableError,
    )
    // Should only call fetch once (no retries on 429)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('requestJson retries network errors and eventually succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      maxRetries: 2,
      retryInitialDelayMs: 1,
    })

    // @ts-expect-error private property
    core.sleep = vi.fn().mockResolvedValue(undefined)

    const result = await core.requestJson<{ ok: boolean }>(
      new URL('https://example.com'),
      { method: 'GET' },
    )

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requestJson retries HEAD network errors', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      maxRetries: 2,
      retryInitialDelayMs: 1,
    })

    // @ts-expect-error private property
    core.sleep = vi.fn().mockResolvedValue(undefined)

    const result = await core.requestJson<{ ok: boolean }>(
      new URL('https://example.com'),
      { method: 'HEAD' },
    )

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requestJson retries opted-in POST read requests after network errors', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(jsonResponse(200, { records: [] }))

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      maxRetries: 2,
      retryInitialDelayMs: 1,
      retryOnStatuses: [],
    })

    // @ts-expect-error private property
    core.sleep = vi.fn().mockResolvedValue(undefined)

    const result = await core.requestJson<{ records: unknown[] }>(
      new URL('https://example.com/listRecords'),
      {
        method: 'POST',
        body: JSON.stringify({ filterByFormula: 'TRUE()' }),
        retryNetworkErrors: true,
      },
    )

    expect(result.records).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requestJson stops retrying network errors after maxRetries', async () => {
    const error = new Error('network down')
    const fetchMock = vi.fn().mockRejectedValue(error)

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      maxRetries: 1,
      retryInitialDelayMs: 1,
    })

    // @ts-expect-error private property
    core.sleep = vi.fn().mockResolvedValue(undefined)

    await expect(
      core.requestJson(new URL('https://example.com'), { method: 'GET' }),
    ).rejects.toBe(error)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requestJson does not retry network errors for non-idempotent methods', async () => {
    const error = new Error('network down after mutation')
    const fetchMock = vi.fn().mockRejectedValue(error)

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      maxRetries: 2,
      retryInitialDelayMs: 1,
    })

    await expect(
      core.requestJson(new URL('https://example.com'), {
        method: 'POST',
        body: JSON.stringify({ records: [] }),
      }),
    ).rejects.toBe(error)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('requestJson does not retry AbortError', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    const fetchMock = vi.fn().mockRejectedValue(abortError)

    const core = new AirtableCoreClient({
      apiKey: 'key',
      baseId: 'base',
      fetch: fetchMock as any,
      maxRetries: 2,
      retryInitialDelayMs: 1,
    })

    await expect(
      core.requestJson(new URL('https://example.com'), { method: 'GET' }),
    ).rejects.toBe(abortError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('requestJson merges apiVersion and customHeaders into headers and allows per-call override', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { ok: true }),
    )

    const core = new AirtableCoreClient({
      apiKey: 'secret',
      baseId: 'base',
      fetch: fetchMock as any,
      apiVersion: '0.4.0',
      customHeaders: {
        'X-Global': 'g',
        'X-Override': 'global',
      },
    })

    const url = new URL('https://example.com/api')

    await core.requestJson(url, {
      method: 'GET',
      headers: {
        'X-Local': 'l',
        'X-Override': 'local',
      },
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>

    expect(headers.Authorization).toBe('Bearer secret')
    expect(headers['X-Airtable-API-Version']).toBe('0.4.0')
    expect(headers['X-Global']).toBe('g')
    expect(headers['X-Local']).toBe('l')
    expect(headers['X-Override']).toBe('local')
  })
})
