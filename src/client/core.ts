import type {
  AirtableClientOptions,
  AirtableErrorResponseBody,
  AirtableObservabilityHooks,
  AirtableRequestContext,
  AirtableRequestMethod,
  AirtableRequestRateLimitEvent,
  AirtableRequestScheduler,
  CustomHeaders,
  GetRecordParams,
  ListRecordsParams,
} from '@/types'
import { AirtableError } from '@/errors'
import { AirtableRateLimiter } from '@/rate-limiter'

/**
 * Default Airtable API root URL.
 * You usually do not need to change this unless you are
 * testing against a proxy or a mock server.
 */
export const DEFAULT_ENDPOINT_URL = 'https://api.airtable.com'
const DEFAULT_API_PATH_VERSION = 'v0'

interface AirtableRequestInit extends RequestInit {
  /**
   * Retry transient network failures for a request that is safe to replay even
   * though its HTTP method is not GET/HEAD.
   *
   * This is used for Airtable's POST /listRecords read endpoint only.
   */
  retryNetworkErrors?: boolean
}

/**
 * Maximum number of records that can be created/updated/deleted in one batch,
 * according to Airtable API limits.
 *
 * This constant is used by records-related clients to automatically split
 * large arrays into batches.
 */
export const MAX_RECORDS_PER_BATCH = 10

/**
 * Airtable recommends using POST /listRecords before a GET request URL
 * reaches the Web API's 16,000 character URL limit.
 */
export const MAX_LIST_RECORDS_GET_URL_LENGTH = 16_000

/**
 * Shared low-level HTTP client used by all higher-level Airtable clients.
 *
 * This class is not meant to be used directly by consumers; instead, use
 * `AirtableClient` which composes records, metadata and webhooks
 * on top of this core.
 */
export class AirtableCoreClient {
  readonly apiKey: string
  readonly apiVersion?: string
  readonly baseId: string
  readonly endpointUrl: string
  readonly fetchImpl: typeof fetch
  readonly customHeaders?: CustomHeaders
  readonly noRetryIfRateLimited: boolean
  readonly maxRetries: number
  readonly retryInitialDelayMs: number
  readonly retryOnStatuses: number[]
  private readonly apiPathVersion: string
  private readonly observability?: AirtableObservabilityHooks
  private readonly requestScheduler?: AirtableRequestScheduler

  /**
   * Construct a new low-level Airtable client.
   */
  constructor(options: AirtableClientOptions) {
    if (!options.apiKey) {
      throw new Error('AirtableClient: apiKey is required')
    }
    if (!options.baseId) {
      throw new Error('AirtableClient: baseId is required')
    }

    this.apiKey = options.apiKey
    this.apiVersion = options.apiVersion
    this.apiPathVersion = DEFAULT_API_PATH_VERSION
    this.baseId = options.baseId
    this.endpointUrl = options.endpointUrl ?? DEFAULT_ENDPOINT_URL

    const globalFetch: typeof fetch | undefined
      = typeof fetch === 'function' ? fetch : undefined

    if (!options.fetch && !globalFetch) {
      throw new Error(
        'AirtableClient: fetch is not available in this environment. '
        + 'Provide a custom fetch implementation in AirtableClientOptions.',
      )
    }

    this.fetchImpl = options.fetch ?? (globalFetch as typeof fetch)
    this.customHeaders = options.customHeaders
    this.noRetryIfRateLimited = options.noRetryIfRateLimited ?? false
    this.maxRetries = options.maxRetries ?? 5
    this.retryInitialDelayMs = options.retryInitialDelayMs ?? 500
    this.retryOnStatuses = options.retryOnStatuses ?? [429, 500, 502, 503, 504]
    this.observability = options.observability
    if (options.requestScheduler && options.rateLimiter) {
      throw new Error('AirtableClient: requestScheduler and rateLimiter are mutually exclusive')
    }
    this.requestScheduler = options.requestScheduler
      ?? createRateLimiter(options.rateLimiter, event =>
        this.emit('onRateLimit', event))
  }

  // ---------------------------------------------------------------------------
  // URL builders
  // ---------------------------------------------------------------------------

  /**
   * Build the URL for a table-level or record-level operation.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param recordId - Optional record ID for record-level endpoints.
   * @param query - Optional query string parameters.
   */
  buildTableUrl(
    tableIdOrName: string,
    recordId?: string,
    query?: URLSearchParams,
  ): URL {
    const encodedTable = encodeURIComponent(tableIdOrName)
    const encodedRecord = recordId ? `/${encodeURIComponent(recordId)}` : ''
    const url = new URL(
      `/${this.apiPathVersion}/${this.baseId}/${encodedTable}${encodedRecord}`,
      this.endpointUrl,
    )

    if (query && Array.from(query.keys()).length > 0) {
      url.search = query.toString()
    }

    return url
  }

  /**
   * Build the URL for a metadata endpoint.
   *
   * @param path - Path under `/{apiVersion}/meta`.
   * @param query - Optional query string parameters.
   */
  buildMetaUrl(path: string, query?: URLSearchParams): URL {
    const url = new URL(`/${this.apiPathVersion}/meta${path}`, this.endpointUrl)

    if (query && Array.from(query.keys()).length > 0) {
      url.search = query.toString()
    }

    return url
  }

  /**
   * Build a base-level URL (e.g. /{apiVersion}/bases/{baseId}/webhooks/...).
   *
   * @param path - Path under `/{apiVersion}/bases/{baseId}`.
   * @param query - Optional query string parameters.
   */
  buildBaseUrl(path: string, query?: URLSearchParams): URL {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const url = new URL(
      `/${this.apiPathVersion}/bases/${this.baseId}${normalizedPath}`,
      this.endpointUrl,
    )

    if (query && Array.from(query.keys()).length > 0) {
      url.search = query.toString()
    }

    return url
  }

  // ---------------------------------------------------------------------------
  // Query builders used by records APIs
  // ---------------------------------------------------------------------------

  /**
   * Build query parameters for the "List records" endpoint.
   */
  buildListQuery(
    params?: ListRecordsParams,
  ): URLSearchParams | undefined {
    if (!params)
      return undefined
    const search = new URLSearchParams()

    if (params.maxRecords != null)
      search.set('maxRecords', String(params.maxRecords))
    if (params.pageSize != null)
      search.set('pageSize', String(params.pageSize))
    if (params.offset)
      search.set('offset', params.offset)
    if (params.view)
      search.set('view', params.view)
    if (params.filterByFormula) {
      search.set('filterByFormula', params.filterByFormula)
    }
    if (params.cellFormat)
      search.set('cellFormat', params.cellFormat)
    if (params.timeZone)
      search.set('timeZone', params.timeZone)
    if (params.userLocale)
      search.set('userLocale', params.userLocale)
    if (params.returnFieldsByFieldId !== undefined) {
      search.set('returnFieldsByFieldId', String(params.returnFieldsByFieldId))
    }

    if (params.fields) {
      for (const field of params.fields) {
        search.append('fields[]', field)
      }
    }

    if (params.sort) {
      params.sort.forEach((spec, index) => {
        search.append(`sort[${index}][field]`, spec.field)
        if (spec.direction) {
          search.append(`sort[${index}][direction]`, spec.direction)
        }
      })
    }

    return search
  }

  /**
   * Build query parameters for "Retrieve a record" endpoint.
   */
  buildGetQuery(
    params?: GetRecordParams,
  ): URLSearchParams | undefined {
    if (!params)
      return undefined
    const search = new URLSearchParams()

    if (params.cellFormat)
      search.set('cellFormat', params.cellFormat)
    if (params.timeZone)
      search.set('timeZone', params.timeZone)
    if (params.userLocale)
      search.set('userLocale', params.userLocale)
    if (params.returnFieldsByFieldId !== undefined) {
      search.set('returnFieldsByFieldId', String(params.returnFieldsByFieldId))
    }

    return search
  }

  /**
   * Build query parameters to control whether fields are returned by name or by ID.
   */
  buildReturnFieldsQuery(
    returnFieldsByFieldId?: boolean,
  ): URLSearchParams | undefined {
    if (returnFieldsByFieldId === undefined)
      return undefined
    const search = new URLSearchParams()
    search.set('returnFieldsByFieldId', String(returnFieldsByFieldId))
    return search
  }

  // ---------------------------------------------------------------------------
  // HTTP / retry / error handling
  // ---------------------------------------------------------------------------

  /**
   * Perform a fetch request and parse the JSON response.
   *
   * Handles:
   * - Authorization header injection
   * - Retry with exponential backoff
   * - Error wrapping into `AirtableError`
   */
  async requestJson<T>(url: URL, init: AirtableRequestInit): Promise<T> {
    const { retryNetworkErrors, ...fetchInit } = init
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...(this.apiVersion
        ? { 'X-Airtable-API-Version': this.apiVersion }
        : {}),
    }

    // 1) global custom headers
    if (this.customHeaders) {
      for (const [key, value] of Object.entries(this.customHeaders)) {
        headers[key] = String(value)
      }
    }

    // 2) per-request headers (may override global headers)
    if (fetchInit.headers) {
      for (const [key, value] of normalizeHeaders(fetchInit.headers)) {
        setHeader(headers, key, value)
      }
    }

    const method = normalizeRequestMethod(fetchInit.method)
    if (
      method
      && method !== 'GET'
      && method !== 'HEAD'
      && !hasHeader(headers, 'Content-Type')
    ) {
      headers['Content-Type'] ??= 'application/json'
    }

    let attempt = 0
    const requestId = createRequestId()
    const urlString = url.toString()

    while (true) {
      let response: Response
      const context: AirtableRequestContext = {
        requestId,
        baseId: this.baseId,
        method,
        url: urlString,
        attempt,
      }
      const startedAt = nowMs()

      this.emit('onRequestStart', context)

      try {
        response = await this.executeRequestAttempt(context, () =>
          this.fetchImpl(urlString, {
            ...fetchInit,
            headers,
          }))
      }
      catch (err) {
        if (!this.shouldRetryNetworkError(
          err,
          attempt,
          fetchInit.method,
          retryNetworkErrors,
        )) {
          this.emit('onError', {
            ...context,
            error: err,
            durationMs: nowMs() - startedAt,
          })
          throw err
        }

        const delayMs = this.getRetryDelayMs(undefined, attempt)
        this.emit('onRetry', {
          ...context,
          delayMs,
          error: err,
        })
        await this.sleep(delayMs)
        attempt += 1
        continue
      }

      this.emit('onRequestEnd', {
        ...context,
        status: response.status,
        ok: response.ok,
        durationMs: nowMs() - startedAt,
      })

      if (!this.shouldRetry(response.status, attempt)) {
        try {
          return await this.handleResponse<T>(response)
        }
        catch (err) {
          this.emit('onError', {
            ...context,
            error: err,
            durationMs: nowMs() - startedAt,
            status: response.status,
          })
          throw err
        }
      }

      const delayMs = this.getRetryDelayMs(response, attempt)
      this.emit('onRetry', {
        ...context,
        delayMs,
        status: response.status,
      })
      await this.sleep(delayMs)
      attempt += 1
    }
  }

  private executeRequestAttempt<T>(
    context: AirtableRequestContext,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!this.requestScheduler) {
      return run()
    }

    return this.requestScheduler.schedule(run, context)
  }

  /**
   * Interpret an HTTP response, throwing `AirtableError` for non-2xx statuses.
   *
   * @internal
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      // No content
      return undefined as unknown as T
    }

    const contentType = response.headers.get('Content-Type') ?? ''
    const text = await response.text()
    const isJson = contentType.toLowerCase().includes('application/json')
    const data = isJson
      ? parseJsonResponseBody(text, response.ok)
      : (text as unknown)

    if (response.ok) {
      return data as T
    }

    const payload = parseErrorResponsePayload(data, text, isJson)

    throw new AirtableError(response.status, payload)
  }

  /**
   * Decide whether a given response status should be retried.
   *
   * @internal
   */
  private shouldRetry(status: number, attempt: number): boolean {
    if (attempt >= this.maxRetries) {
      return false
    }
    if (this.noRetryIfRateLimited && status === 429) {
      return false
    }
    return this.retryOnStatuses.includes(status)
  }

  private shouldRetryNetworkError(
    err: unknown,
    attempt: number,
    method?: string,
    retryNetworkErrors = false,
  ): boolean {
    if (attempt >= this.maxRetries) {
      return false
    }
    if (isAbortError(err)) {
      return false
    }
    if (!retryNetworkErrors && !isNetworkRetryMethod(method)) {
      return false
    }
    return true
  }

  /**
   * Compute delay before the next retry attempt.
   *
   * Prefers `Retry-After` header when present, otherwise uses
   * exponential backoff with a small random jitter.
   *
   * @internal
   */
  private getRetryDelayMs(response: Response | undefined, attempt: number): number {
    const retryAfter = response?.headers.get('Retry-After')
    if (retryAfter) {
      const seconds = Number(retryAfter)
      if (!Number.isNaN(seconds) && seconds > 0) {
        return seconds * 1000
      }
    }

    const base = this.retryInitialDelayMs * 2 ** attempt
    const jitter = base * 0.2 * Math.random() // 20% jitter
    return base + jitter
  }

  /**
   * Sleep helper used by retry logic.
   *
   * @internal
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private emit<TEvent extends keyof AirtableObservabilityHooks>(
    event: TEvent,
    payload: Parameters<NonNullable<AirtableObservabilityHooks[TEvent]>>[0],
  ): void {
    try {
      this.observability?.[event]?.(payload as never)
    }
    catch {
      // Observability hooks are best-effort and must not break requests.
    }
  }
}

function normalizeHeaders(headers: HeadersInit): Array<[string, string]> {
  if (Array.isArray(headers)) {
    return headers.map(([key, value]) => [key, value])
  }

  if (hasHeaderForEach(headers)) {
    const entries: Array<[string, string]> = []
    headers.forEach((value, key) => entries.push([key, String(value)]))
    return entries
  }

  if (isHeaderEntryIterable(headers)) {
    return Array.from(headers, ([key, value]) => [key, String(value)])
  }

  return Object.entries(headers).map(([key, value]) => [key, String(value)])
}

function hasHeaderForEach(headers: unknown): headers is {
  forEach: (callback: (value: string, key: string) => void) => void
} {
  return (
    typeof headers === 'object'
    && headers !== null
    && 'forEach' in headers
    && typeof headers.forEach === 'function'
  )
}

function isHeaderEntryIterable(
  headers: unknown,
): headers is Iterable<readonly [string, unknown]> {
  return (
    typeof headers === 'object'
    && headers !== null
    && Symbol.iterator in headers
    && typeof headers[Symbol.iterator] === 'function'
  )
}

function hasHeader(headers: Record<string, string>, key: string): boolean {
  const normalizedKey = key.toLowerCase()
  return Object.keys(headers).some(header => header.toLowerCase() === normalizedKey)
}

function setHeader(
  headers: Record<string, string>,
  key: string,
  value: string,
): void {
  const existingKey = Object.keys(headers).find(
    header => header.toLowerCase() === key.toLowerCase(),
  )

  if (existingKey) {
    headers[existingKey] = value
    return
  }

  headers[key] = value
}

function parseJsonResponseBody(text: string, isOk: boolean): unknown {
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  }
  catch (err) {
    if (!isOk) {
      return undefined
    }
    throw err
  }
}

function parseErrorResponsePayload(
  data: unknown,
  text: string,
  isJson: boolean,
): AirtableErrorResponseBody | undefined {
  if (isJson) {
    return data ? (data as AirtableErrorResponseBody) : undefined
  }

  if (!looksLikeJsonObject(text)) {
    return undefined
  }

  try {
    const parsed = JSON.parse(text) as unknown
    return parsed && typeof parsed === 'object'
      ? (parsed as AirtableErrorResponseBody)
      : undefined
  }
  catch {
    return undefined
  }
}

function looksLikeJsonObject(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith('{') && trimmed.endsWith('}')
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object'
    && err !== null
    && 'name' in err
    && err.name === 'AbortError'
  )
}

function isNetworkRetryMethod(method?: string): boolean {
  const normalizedMethod = method?.toUpperCase() ?? 'GET'
  return normalizedMethod === 'GET' || normalizedMethod === 'HEAD'
}

function normalizeRequestMethod(method?: string): AirtableRequestMethod {
  const normalizedMethod = method?.toUpperCase() ?? 'GET'

  switch (normalizedMethod) {
    case 'HEAD':
    case 'POST':
    case 'PATCH':
    case 'PUT':
    case 'DELETE':
      return normalizedMethod
    default:
      return 'GET'
  }
}

function createRequestId(): string {
  if (typeof crypto === 'object' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
}

function nowMs(): number {
  return typeof performance === 'object' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function createRateLimiter(
  options: AirtableClientOptions['rateLimiter'],
  onDelay: (event: AirtableRequestRateLimitEvent) => void,
): AirtableRequestScheduler | undefined {
  if (!options)
    return undefined

  if (options === true) {
    return new AirtableRateLimiter({ onDelay })
  }

  return new AirtableRateLimiter({
    ...options,
    onDelay: (event) => {
      try {
        options.onDelay?.(event)
      }
      finally {
        onDelay(event)
      }
    },
  })
}
