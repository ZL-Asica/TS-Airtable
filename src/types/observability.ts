/**
 * HTTP method used by an Airtable request.
 */
export type AirtableRequestMethod = 'GET' | 'HEAD' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

/**
 * Shared metadata emitted by request observability hooks and schedulers.
 *
 * Values in this object are safe to log. Sensitive headers and request bodies
 * are intentionally omitted.
 */
export interface AirtableRequestContext {
  /**
   * Unique identifier for this logical SDK request.
   *
   * Retries keep the same `requestId` and increment {@link attempt}.
   */
  requestId: string

  /**
   * Base id configured on the client that is making the request.
   */
  baseId: string

  /**
   * HTTP method used for this attempt.
   */
  method: AirtableRequestMethod

  /**
   * Fully resolved request URL.
   *
   * This may contain Airtable query parameters, but never includes API keys or
   * request headers.
   */
  url: string

  /**
   * Zero-based attempt number.
   *
   * `0` is the initial request. Retries increment this value.
   */
  attempt: number
}

/**
 * Event emitted immediately before an HTTP attempt is scheduled.
 */
export type AirtableRequestStartEvent = AirtableRequestContext

/**
 * Event emitted after an HTTP attempt receives a response.
 */
export interface AirtableRequestEndEvent extends AirtableRequestContext {
  /**
   * HTTP status returned by Airtable.
   */
  status: number

  /**
   * Whether the HTTP status is in the 2xx range.
   */
  ok: boolean

  /**
   * Elapsed time for this attempt in milliseconds.
   *
   * This includes any SDK scheduler delay before `fetch` is called.
   */
  durationMs: number
}

/**
 * Event emitted before the SDK retries a failed attempt.
 */
export interface AirtableRequestRetryEvent extends AirtableRequestContext {
  /**
   * Delay before the next attempt starts.
   */
  delayMs: number

  /**
   * HTTP status that triggered the retry, when the failed attempt reached
   * Airtable and received a response.
   */
  status?: number

  /**
   * Network error that triggered the retry, when the failed attempt did not
   * receive an HTTP response.
   */
  error?: unknown
}

/**
 * Event emitted when a request waits inside an SDK scheduler or rate limiter.
 */
export interface AirtableRequestRateLimitEvent extends AirtableRequestContext {
  /**
   * Delay before this attempt is allowed to start.
   */
  delayMs: number
}

/**
 * Event emitted when an attempt fails and will not be retried.
 */
export interface AirtableRequestErrorEvent extends AirtableRequestContext {
  /**
   * Error that will be thrown to the caller.
   */
  error: unknown

  /**
   * Elapsed time for this attempt in milliseconds.
   *
   * This includes any SDK scheduler delay before `fetch` is called.
   */
  durationMs: number

  /**
   * HTTP status, when the failure came from an Airtable response.
   */
  status?: number
}

/**
 * Lightweight observability hooks for production logging and metrics.
 *
 * The SDK calls these hooks best-effort. If a hook throws, the hook error is
 * swallowed so logging or metrics code cannot break Airtable requests.
 */
export interface AirtableObservabilityHooks {
  /**
   * Called immediately before an HTTP attempt is scheduled.
   */
  onRequestStart?: (event: AirtableRequestStartEvent) => void

  /**
   * Called after an HTTP attempt receives a response.
   */
  onRequestEnd?: (event: AirtableRequestEndEvent) => void

  /**
   * Called before a retry delay is applied.
   */
  onRetry?: (event: AirtableRequestRetryEvent) => void

  /**
   * Called when a request waits inside a configured scheduler or rate limiter.
   */
  onRateLimit?: (event: AirtableRequestRateLimitEvent) => void

  /**
   * Called when a request fails and will not be retried.
   */
  onError?: (event: AirtableRequestErrorEvent) => void
}

/**
 * Scheduler hook used to delay or serialize HTTP attempts before `fetch`.
 *
 * Custom schedulers can implement request queues, shared rate limiters,
 * distributed throttling, tracing, or circuit breakers. The scheduler receives
 * a callback that performs exactly one HTTP attempt and must return its result.
 */
export interface AirtableRequestScheduler {
  /**
   * Schedule a single HTTP attempt.
   *
   * @param run - Callback that performs the actual `fetch` attempt.
   * @param context - Safe-to-log request metadata for this attempt.
   */
  schedule: <T>(
    run: () => Promise<T>,
    context: AirtableRequestContext,
  ) => Promise<T>
}
