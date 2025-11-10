import type { AirtableRecordsCacheOptions } from './cache-store'

/**
 * Options for constructing an `AirtableClient` instance.
 */
export interface AirtableClientOptions {
  /**
   * Personal access token / OAuth token / legacy API key.
   *
   * This value is sent as a Bearer token via the `Authorization` header.
   *
   * @example
   * ```ts
   * const client = new AirtableClient({
   *   apiKey: process.env.AIRTABLE_TOKEN!,
   *   baseId: 'appXXXXXXXXXXXXXX',
   * })
   * ```
   */
  apiKey: string

  /**
   * The base ID, e.g. `"appXXXXXXXXXXXXXX"`.
   *
   * The client is always bound to a single base. To work with multiple bases,
   * construct multiple `AirtableClient` instances.
   */
  baseId: string

  /**
   * Override Airtable API root URL.
   *
   * Defaults to `https://api.airtable.com`. You generally do not need to
   * customize this unless you are using a proxy, mock server, or testing
   * environment.
   */
  endpointUrl?: string

  /**
   * Custom fetch implementation.
   *
   * Useful for:
   * - Node < 18 (no built-in global `fetch`)
   * - Custom HTTP agents (proxy, retries, logging, etc.)
   * - Tests, where you may wish to mock fetch.
   *
   * If omitted, the global `fetch` function is used.
   */
  fetch?: typeof fetch

  /**
   * Maximum number of retry attempts for retryable HTTP status codes.
   *
   * This controls how many times a single request may be retried when the
   * response status is one of `AirtableClientOptions.retryOnStatuses`.
   *
   * Default: `5`.
   */
  maxRetries?: number

  /**
   * Initial delay (in milliseconds) for exponential backoff.
   *
   * Example progression (no `Retry-After` header, 20% jitter ignored):
   * - attempt 0: `retryInitialDelayMs`
   * - attempt 1: `retryInitialDelayMs * 2`
   * - attempt 2: `retryInitialDelayMs * 4`
   * - ...
   *
   * Default: `500`.
   */
  retryInitialDelayMs?: number

  /**
   * HTTP status codes that should be retried.
   *
   * Defaults to `[429, 500, 502, 503, 504]`.
   * Set to `[]` to disable automatic retries entirely.
   */
  retryOnStatuses?: number[]

  /**
   * Options for caching Airtable records at the SDK level.
   *
   * When provided, read operations such as `listRecords`, `listAllRecords`,
   * `iterateRecords` (first page), and `getRecord` can reuse cached responses
   * instead of hitting the Airtable HTTP API every time.
   *
   * Under the hood this delegates to an {@link AirtableCacheStore} implementation
   * (in-memory by default, if you supply one) and uses stable, prefixed keys
   * derived from:
   *
   * - `baseId`
   * - table name / ID
   * - normalized request params (e.g. view, filter, sorts, etc.)
   *
   * Use this to:
   *
   * - Reduce latency and API usage for repeated reads
   * - Shield your app from short bursts of traffic
   * - Plug in shared stores like Redis / Cloudflare KV / Upstash, etc.
   *
   * When omitted, the client performs no caching and every read is sent
   * directly to Airtable.
   *
   * @example
   * // Enable caching with default in-memory store and a 30s TTL
   * const client = new AirtableClient({
   *   apiKey: process.env.AIRTABLE_TOKEN!,
   *   baseId: 'appXXXXXXXXXXXXXX',
   *   recordsCache: {
   *     defaultTtlMs: 30_000,
   *   },
   * })
   *
   * @example
   * // Use a custom async store and disable getRecord caching
   * const client = new AirtableClient({
   *   apiKey: process.env.AIRTABLE_TOKEN!,
   *   baseId: 'appXXXXXXXXXXXXXX',
   *   recordsCache: {
   *     store: myRedisBackedStore,
   *     defaultTtlMs: 60_000,
   *     methods: {
   *       listRecords: true,
   *       listAllRecords: true,
   *       getRecord: false,
   *     },
   *   },
   * })
   */
  recordsCache?: AirtableRecordsCacheOptions
}
