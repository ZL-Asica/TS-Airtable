import type {
  AirtableRequestContext,
  AirtableRequestRateLimitEvent,
  AirtableRequestScheduler,
} from '@/types'

/**
 * Options for the built-in per-process Airtable request rate limiter.
 */
export interface AirtableRateLimiterOptions {
  /**
   * Maximum number of request attempts allowed per second.
   *
   * Airtable's public Web API limit is commonly enforced per base, so the
   * default is `5` requests per second. If you share a single limiter across
   * clients for the same base, keep this value at or below Airtable's limit.
   *
   * Default: `5`.
   */
  requestsPerSecond?: number

  /**
   * Maximum number of request attempts that may run at the same time.
   *
   * The limiter still spaces out start times according to
   * {@link requestsPerSecond}; this option mainly protects long-running
   * requests from piling up.
   *
   * Default: `5`.
   */
  maxConcurrent?: number

  /**
   * Optional delay callback used for metrics and tests.
   *
   * The SDK wires this into `observability.onRateLimit` when the limiter is
   * configured through `new AirtableClient({ rateLimiter: ... })`.
   */
  onDelay?: (event: AirtableRequestRateLimitEvent) => void

  /**
   * Custom clock, primarily useful for deterministic tests.
   *
   * @internal
   */
  now?: () => number

  /**
   * Custom sleep function, primarily useful for deterministic tests.
   *
   * @internal
   */
  sleep?: (ms: number) => Promise<void>
}

interface QueueItem<T> {
  context: AirtableRequestContext
  reject: (error: unknown) => void
  resolve: (value: T) => void
  run: () => Promise<T>
}

/**
 * Small in-memory request scheduler for Airtable's per-base request limits.
 *
 * The limiter is process-local. In serverless or multi-process deployments,
 * each instance has its own queue; use a custom {@link AirtableRequestScheduler}
 * when you need distributed throttling.
 *
 * @example
 * ```ts
 * import { AirtableClient, AirtableRateLimiter } from 'ts-airtable'
 *
 * const limiter = new AirtableRateLimiter({ requestsPerSecond: 5 })
 *
 * const client = new AirtableClient({
 *   apiKey: process.env.AIRTABLE_API_KEY!,
 *   baseId: process.env.AIRTABLE_BASE_ID!,
 *   requestScheduler: limiter,
 * })
 * ```
 */
export class AirtableRateLimiter implements AirtableRequestScheduler {
  private readonly intervalMs: number
  private readonly maxConcurrent: number
  private readonly now: () => number
  private readonly onDelay?: (event: AirtableRequestRateLimitEvent) => void
  private readonly sleep: (ms: number) => Promise<void>
  private activeCount = 0
  private draining = false
  private nextStartAt = 0
  private readonly queue: Array<QueueItem<unknown>> = []

  /**
   * Create a per-process Airtable request limiter.
   */
  constructor(options: AirtableRateLimiterOptions = {}) {
    const requestsPerSecond = options.requestsPerSecond ?? 5
    const maxConcurrent = options.maxConcurrent ?? 5

    if (!Number.isFinite(requestsPerSecond) || requestsPerSecond <= 0) {
      throw new Error('AirtableRateLimiter: requestsPerSecond must be greater than 0')
    }
    if (!Number.isInteger(maxConcurrent) || maxConcurrent <= 0) {
      throw new Error('AirtableRateLimiter: maxConcurrent must be a positive integer')
    }

    this.intervalMs = 1000 / requestsPerSecond
    this.maxConcurrent = maxConcurrent
    this.now = options.now ?? Date.now
    this.onDelay = options.onDelay
    this.sleep = options.sleep ?? sleep
  }

  /**
   * Schedule one Airtable HTTP attempt.
   *
   * Requests are started in FIFO order. Start times are spaced by
   * `1000 / requestsPerSecond` milliseconds and no more than
   * `maxConcurrent` attempts run at once.
   */
  schedule<T>(
    run: () => Promise<T>,
    context: AirtableRequestContext,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        context,
        reject,
        resolve: resolve as (value: unknown) => void,
        run,
      })
      void this.drain()
    })
  }

  private async drain(): Promise<void> {
    if (this.draining)
      return

    this.draining = true

    try {
      while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
        const delayMs = Math.max(0, this.nextStartAt - this.now())
        if (delayMs > 0) {
          this.emitDelay(this.queue[0].context, delayMs)
          await this.sleep(delayMs)
          continue
        }

        const item = this.queue.shift()!

        this.activeCount += 1
        this.nextStartAt = this.now() + this.intervalMs

        void item.run()
          .then(item.resolve)
          .catch(item.reject)
          .finally(() => {
            this.activeCount -= 1
            void this.drain()
          })
      }
    }
    finally {
      this.draining = false
    }
  }

  private emitDelay(context: AirtableRequestContext, delayMs: number): void {
    try {
      this.onDelay?.({
        ...context,
        delayMs,
      })
    }
    catch {
      // Delay callbacks are observability-only and must not break scheduling.
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
