import type { AirtableRecordsCacheOptions } from './cache-store'
import type {
  AirtableObservabilityHooks,
  AirtableRequestScheduler,
} from './observability'
import type { AirtableRateLimiterOptions } from '@/rate-limiter'

export type CustomHeaders = Record<string, string | number | boolean>

/**
 * Options for constructing an {@link AirtableClient} instance.
 *
 * The same shape (without `baseId`) is also used by the high-level
 * `Airtable.configure(...)` helper as global defaults.
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
   *   apiKey: process.env.AIRTABLE_API_KEY!,
   *   baseId: 'appXXXXXXXXXXXXXX',
   * })
   * ```
   */
  apiKey: string

  /**
   * Optional Airtable API version string.
   *
   * This is accepted for compatibility with the official `airtable` client.
   * When provided, the value is sent as `X-Airtable-API-Version`, while this
   * library continues to use Airtable's v0 HTTP path.
   *
   * If you need to target a different API surface, prefer configuring
   * {@link endpointUrl} instead (e.g. pointing at a proxy or mock).
   */
  apiVersion?: string

  /**
   * The base ID, e.g. `"appXXXXXXXXXXXXXX"`.
   *
   * The client is always bound to a single base. To work with multiple bases,
   * construct multiple `AirtableClient` instances (or use `Airtable.base(...)`
   * from the façade).
   */
  baseId: string

  /**
   * Global custom headers added to every request.
   *
   * Values will be stringified. Per-request headers can still
   * override these.
   */
  customHeaders?: CustomHeaders

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
   * - Custom HTTP agents (proxy, retries, logging, etc.)
   * - Tests, where you may wish to mock fetch.
   *
   * If omitted, the global `fetch` function is used.
   *
   * This also makes it possible to use the client in edge runtimes or
   * other environments that provide a standards-compliant `fetch`.
   */
  fetch?: typeof fetch

  /**
   * When `true`, 429 ("Rate limited") responses are **not** retried, even if
   * 429 is present in {@link retryOnStatuses}.
   *
   * This flag is equivalent to removing `429` from `retryOnStatuses`, but
   * can be more convenient in simple setups.
   *
   * Default: `false`.
   *
   * If you need fine-grained control over which statuses are retried, prefer
   * setting {@link retryOnStatuses} explicitly.
   */
  noRetryIfRateLimited?: boolean

  /**
   * Maximum number of retry attempts for retryable HTTP status codes.
   *
   * This controls how many times a single request may be retried when the
   * response status is one of {@link retryOnStatuses}.
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
   *
   * Combined with {@link noRetryIfRateLimited}, you can quickly toggle
   * whether 429 is retried or not.
   */
  retryOnStatuses?: number[]

  /**
   * Options for caching Airtable records at the SDK level.
   *
   * When provided, read operations such as `listRecords`, `listAllRecords`,
   * `iterateRecords` (first page), and `getRecord` can reuse cached responses
   * instead of hitting the Airtable HTTP API every time.
   *
   * Under the hood this delegates to an {@link AirtableCacheStore}
   * implementation (for example the built-in `InMemoryCacheStore`) and uses
   * stable, prefixed keys derived from:
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
   * This option can also be set globally via `Airtable.configure({ recordsCache })`
   * and overridden per-base via `Airtable.base(baseId, { recordsCache })`.
   */
  recordsCache?: AirtableRecordsCacheOptions

  /**
   * Lightweight lifecycle hooks for production logging and metrics.
   *
   * These hooks receive safe request metadata such as URL, method, base id,
   * attempt number, status, retry delay, and duration. They intentionally do
   * not include request headers or bodies so secrets and record contents are
   * not logged by default.
   *
   * Hook failures are swallowed by the SDK. Observability code should never
   * make Airtable requests fail.
   */
  observability?: AirtableObservabilityHooks

  /**
   * Optional scheduler that wraps every HTTP attempt before `fetch` is called.
   *
   * Use this when you want to enforce a shared queue, rate limiter, circuit
   * breaker, or tracing boundary around Airtable requests. The built-in
   * `AirtableRateLimiter` implements this interface for common per-process
   * throttling.
   */
  requestScheduler?: AirtableRequestScheduler

  /**
   * Convenience configuration for the built-in `AirtableRateLimiter`.
   *
   * - `true` enables the default limiter (`5` request starts per second,
   *   up to `5` concurrent attempts).
   * - an options object customizes the limiter.
   *
   * Use {@link requestScheduler} instead when you need a shared external
   * scheduler or distributed rate limiting. `rateLimiter` and
   * `requestScheduler` are mutually exclusive.
   */
  rateLimiter?: boolean | AirtableRateLimiterOptions
}
