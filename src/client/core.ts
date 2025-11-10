import type {
  AirtableClientOptions,
  AirtableErrorResponseBody,
  CustomHeaders,
  GetRecordParams,
  ListRecordsParams,
} from '@/types'
import { AirtableError } from '@/errors'

/**
 * Default Airtable API root URL.
 * You usually do not need to change this unless you are
 * testing against a proxy or a mock server.
 */
export const DEFAULT_ENDPOINT_URL = 'https://api.airtable.com'

/**
 * Maximum number of records that can be created/updated/deleted in one batch,
 * according to Airtable API limits.
 *
 * This constant is used by records-related clients to automatically split
 * large arrays into batches.
 */
export const MAX_RECORDS_PER_BATCH = 10

/**
 * Shared low-level HTTP client used by all higher-level Airtable clients.
 *
 * This class is not meant to be used directly by consumers; instead, use
 * `AirtableClient` which composes records, metadata and webhooks
 * on top of this core.
 */
export class AirtableCoreClient {
  readonly apiKey: string
  readonly apiVersion: string
  readonly baseId: string
  readonly endpointUrl: string
  readonly fetchImpl: typeof fetch
  readonly customHeaders?: CustomHeaders
  readonly noRetryIfRateLimited: boolean
  readonly maxRetries: number
  readonly retryInitialDelayMs: number
  readonly retryOnStatuses: number[]

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
    this.apiVersion = options.apiVersion ?? 'v0'
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
    this.noRetryIfRateLimited = options.noRetryIfRateLimited ?? true
    this.maxRetries = options.maxRetries ?? 5
    this.retryInitialDelayMs = options.retryInitialDelayMs ?? 500
    this.retryOnStatuses = options.retryOnStatuses ?? [429, 500, 502, 503, 504]
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
      `/${this.apiVersion}/${this.baseId}/${encodedTable}${encodedRecord}`,
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
    const url = new URL(`/${this.apiVersion}/meta${path}`, this.endpointUrl)

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
      `/${this.apiVersion}/bases/${this.baseId}${normalizedPath}`,
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
  async requestJson<T>(url: URL, init: RequestInit): Promise<T> {
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
    if (init.headers) {
    // Handle as Record<string,string>
      const h = init.headers as Record<string, string>
      for (const [key, value] of Object.entries(h)) {
        headers[key] = value
      }
    }

    if (init.method && init.method !== 'GET' && init.method !== 'HEAD') {
      headers['Content-Type'] ??= 'application/json'
    }

    let attempt = 0

    while (true) {
      const response = await this.fetchImpl(url.toString(), {
        ...init,
        headers,
      })

      if (!this.shouldRetry(response.status, attempt)) {
        return this.handleResponse<T>(response)
      }

      const delayMs = this.getRetryDelayMs(response, attempt)
      await this.sleep(delayMs)
      attempt += 1
    }
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
    const isJson = contentType.includes('application/json')
    const data = isJson && text ? (JSON.parse(text) as unknown) : (text as unknown)

    if (response.ok) {
      return data as T
    }

    const payload = (isJson && data ? (data as AirtableErrorResponseBody) : undefined)

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

  /**
   * Compute delay before the next retry attempt.
   *
   * Prefers `Retry-After` header when present, otherwise uses
   * exponential backoff with a small random jitter.
   *
   * @internal
   */
  private getRetryDelayMs(response: Response, attempt: number): number {
    const retryAfter = response.headers.get('Retry-After')
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
}
