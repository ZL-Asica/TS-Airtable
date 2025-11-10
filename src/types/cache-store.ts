/**
 * Abstraction over a key–value cache used by the Airtable client.
 *
 * Implementations can be **synchronous** (e.g. in-memory map) or
 * **asynchronous** (e.g. Redis, Cloudflare KV). Each method may either
 * return its value directly or a Promise that resolves to that value.
 *
 * All TTL values are expressed in **milliseconds** and are interpreted
 * relative to the time `set` is called (e.g. `30_000` = 30 seconds).
 *
 * Minimal requirements:
 *
 * - `get` and `set` **must** be implemented.
 * - `delete` and `deleteByPrefix` are optional and will only be used
 *   when mutation should invalidate cached entries.
 *
 * Implementations are expected to:
 *
 * - Respect TTL semantics if they support expiration.
 * - Treat a missing or expired entry as `undefined`.
 * - Be safe to use across multiple keys within the same process.
 *
 * @example
 * // A minimal synchronous implementation (no TTL, no invalidation)
 * const store: AirtableCacheStore = {
 *   get(key) {
 *     return localMap.get(key)
 *   },
 *   set(key, value) {
 *     localMap.set(key, value)
 *   },
 * }
 *
 * @example
 * // A simple async KV-style implementation
 * const store: AirtableCacheStore = {
 *   async get(key) {
 *     const raw = await env.MY_KV.get(key)
 *     return raw ? JSON.parse(raw) : undefined
 *   },
 *   async set(key, value, ttlMs) {
 *     const serialized = JSON.stringify(value)
 *     await env.MY_KV.put(key, serialized, ttlMs ? { expirationTtl: ttlMs / 1000 } : undefined)
 *   },
 *   async delete(key) {
 *     await env.MY_KV.delete(key)
 *   },
 * }
 */
export interface AirtableCacheStore {
  /**
   * Retrieves a cached value by key.
   *
   * Implementations should:
   *
   * - Return `undefined` when the key is missing or the entry is expired.
   * - Respect TTL if the backend supports expiration.
   *
   * @typeParam T - Expected type of the cached value.
   *
   * @param key - Cache key previously used in {@link AirtableCacheStore.set}.
   *
   * @returns The cached value (typed as `T`) or `undefined`.
   *          May be returned directly or wrapped in a Promise.
   */
  get: <T = unknown>(key: string) => T | undefined | Promise<T | undefined>

  /**
   * Stores a value in the cache for the given key.
   *
   * Implementations are free to decide how TTL is handled; a typical
   * behavior is to compute `expiresAt = Date.now() + ttlMs` and discard
   * entries once expired.
   *
   * If `ttlMs` is omitted or `undefined`, implementations may:
   *
   * - Store entries without expiration, or
   * - Fall back to a default TTL.
   *
   * @typeParam T - Type of the value to be stored.
   *
   * @param key - Cache key under which the value will be stored.
   * @param value - Value to store.
   * @param ttlMs - Optional time-to-live in **milliseconds**.
   *
   * @returns Either `void` or a Promise that resolves once the value
   *          has been written.
   */
  set: <T = unknown>(key: string, value: T, ttlMs?: number) => void | Promise<void>

  /**
   * Deletes a single cache entry by key.
   *
   * This method is optional. If omitted, mutation-triggered invalidation
   * (e.g. after creating/updating a record) will not delete individual keys.
   *
   * Implementations should not throw when the key does not exist.
   *
   * @param key - Cache key to remove.
   *
   * @returns Either `void` or a Promise that resolves when the entry
   *          has been removed.
   */
  delete?: (key: string) => void | Promise<void>

  /**
   * Deletes all cache entries whose keys start with the given prefix.
   *
   * This is typically used for invalidating groups of keys, for example:
   *
   * - All list queries for a table (using `tablePrefix(baseId, table)`).
   * - All cached views of a single record (using `recordPrefix(...)`).
   *
   * This method is optional. If omitted, prefix-based invalidation
   * will be skipped (the cache will still work, but may serve stale data
   * after mutations unless you call `delete` manually).
   *
   * @param prefix - String prefix to match against cache keys.
   *
   * @returns Either `void` or a Promise that resolves when all matching
   *          entries have been removed.
   */
  deleteByPrefix?: (prefix: string) => void | Promise<void>
}

/**
 * Context object passed to {@link AirtableRecordsCacheOptions.onError}
 * whenever a cache operation throws.
 *
 * This is meant to give you enough information to:
 *
 * - Log what went wrong at the cache layer (key / prefix / op type)
 * - Decide whether to treat it as a soft warning or escalate
 * - Correlate with upstream application logs
 *
 * It does **not** include the error itself — that is provided as the
 * first parameter to `onError(error, ctx)`.
 *
 * ### Semantics
 *
 * - `op`:
 *   - `"get"`   — a call to `store.get(key)` failed
 *   - `"set"`   — a call to `store.set(key, value, ttlMs)` failed
 *   - `"delete"` — a call to `store.deleteByPrefix(prefix)` failed
 * - `key`:
 *   - Present only for `"get"` / `"set"` operations
 *   - Contains the fully constructed cache key
 * - `prefix`:
 *   - Present only for `"delete"` operations
 *   - Contains the prefix passed to `deleteByPrefix`, usually produced by
 *     helpers like `tablePrefix(...)` or `recordPrefix(...)`
 *
 * @example
 * ```ts
 * const cacheOptions: AirtableRecordsCacheOptions = {
 *   store: myStore,
 *   onError(error, ctx) {
 *     console.warn('[airtable-cache]', {
 *       op: ctx.op,
 *       key: ctx.key,
 *       prefix: ctx.prefix,
 *       error,
 *     })
 *   },
 *   failOnCacheError: false, // keep cache failures non-fatal
 * }
 * ```
 */
export interface AirtableRecordsCacheOnErrorContext {
  /**
   * Type of cache operation that failed.
   *
   * - `"get"`   — failure during a `cache.get(key)` call
   * - `"set"`   — failure during a `cache.set(key, value, ttlMs)` call
   * - `"delete"` — failure during a `cache.deleteByPrefix(prefix)` call
   */
  op: 'get' | 'set' | 'delete'

  /**
   * Fully constructed cache key used for the operation, when applicable.
   *
   * This is only set for:
   * - `op === "get"`
   * - `op === "set"`
   *
   * For `"delete"` operations, this will be `undefined`, and you should
   * look at {@link AirtableRecordsCacheOnErrorContext.prefix} instead.
   */
  key?: string

  /**
   * Prefix used for bulk invalidation operations.
   *
   * This is only set for:
   * - `op === "delete"` (i.e. `deleteByPrefix`)
   *
   * It typically comes from helpers like:
   * - `tablePrefix(baseId, tableIdOrName)`
   * - `recordPrefix(baseId, tableIdOrName, recordId)`
   */
  prefix?: string
}

/**
 * Configuration options for the records-level cache used by the Airtable client.
 *
 * An `AirtableRecordsCache` instance is responsible for caching the high-level
 * record operations exposed by the SDK, such as:
 *
 * - `listRecords`
 * - `listAllRecords`
 * - `iterateRecords` (first page)
 * - `getRecord`
 *
 * This options object allows you to:
 *
 * - Plug in a custom backing store (e.g. Redis, Cloudflare KV).
 * - Change the default TTL for cached entries.
 * - Enable / disable caching for specific methods.
 *
 * @example
 * // Use the default in-memory store with a 30-second TTL
 * const cache = new AirtableRecordsCache({
 *   defaultTtlMs: 30_000,
 * })
 *
 * @example
 * // Use a custom store and disable getRecord caching
 * const cache = new AirtableRecordsCache({
 *   store: myRedisStore,
 *   defaultTtlMs: 60_000,
 *   methods: {
 *     listRecords: true,
 *     listAllRecords: true,
 *     getRecord: false,
 *   },
 * })
 */
export interface AirtableRecordsCacheOptions {
  /**
   * Underlying key–value store implementation.
   *
   * If omitted, a default in-memory implementation will be used, which:
   *
   * - Lives only within the current process/runtime.
   * - Is suitable for single-worker or development environments.
   *
   * You can provide any implementation that conforms to
   * {@link AirtableCacheStore}, including async ones.
   *
   * @example
   * import { InMemoryCacheStore } from './in-memory-cache'
   *
   * const cache = new AirtableRecordsCache({
   *   store: new InMemoryCacheStore(500),
   * })
   */
  store?: AirtableCacheStore

  /**
   * Default time-to-live for cached entries (in milliseconds).
   *
   * This TTL is applied when a cacheable operation is performed and the
   * specific call does not provide its own TTL. It affects:
   *
   * - List operations (`listRecords`, `listAllRecords`, `iterateRecords` first page)
   * - Single-record operations (`getRecord`), if enabled in {@link AirtableRecordsCacheOptions.methods}.
   *
   * If omitted, the cache implementation may choose a sensible default
   * or store entries without expiration.
   *
   * @example
   * // Cache for 30 seconds
   * const cache = new AirtableRecordsCache({ defaultTtlMs: 30_000 })
   */
  defaultTtlMs?: number

  /**
   * Throw an error when cache failed
   *
   * Default false, no handle.
   */
  failOnCacheError?: boolean

  /**
   * Optional callback invoked whenever a cache operation throws.
   *
   * This is **purely observational**: it lets you log, trace, or collect
   * metrics about cache-layer failures without changing how the Airtable
   * client behaves by default.
   *
   * The actual behavior on error is:
   *
   * - `onError` (if provided) is called with:
   *   - the original `error` thrown by the cache store, and
   *   - a {@link AirtableRecordsCacheOnErrorContext} describing the operation
   *     (`op`, `key`, `prefix`).
   * - If `failOnCacheError === true`, the error is then rethrown and will
   *   bubble up through the records API (e.g. `listRecords`, `getRecord`).
   * - Otherwise, the error is swallowed and the client behaves as if caching
   *   were disabled (i.e. cache miss / best-effort invalidation).
   *
   * This callback is invoked from the internal helpers:
   *
   * - `cacheGet`   → `op: "get"`
   * - `cacheSet`   → `op: "set"`
   * - `cacheDeleteByPrefix` → `op: "delete"`
   *
   * @param error - Error thrown by the underlying {@link AirtableCacheStore}
   *   during a `get`, `set`, or `deleteByPrefix` call.
   * @param ctx - Context about the cache operation being performed:
   *   - `ctx.op`: `"get" | "set" | "delete"`
   *   - `ctx.key?`: cache key used for `get` / `set`
   *   - `ctx.prefix?`: prefix used for `deleteByPrefix`
   */
  onError?: (error: unknown, ctx: AirtableRecordsCacheOnErrorContext) => void

  /**
   * Per-method toggles to enable or disable caching behavior.
   *
   * Any flag that is `false` or `undefined` is treated as "do not cache"
   * for that method. Omitted flags default to `true` in the implementation
   * (depending on how `AirtableRecordsCache` is wired).
   *
   * This is useful if:
   *
   * - Some methods are too dynamic to benefit from caching.
   * - You only want to cache list operations but not individual `getRecord` calls.
   */
  methods?: {
    /**
     * Whether to cache the **first page** of list-based APIs.
     *
     * This typically affects:
     *
     * - `listRecords`
     * - `iterateRecords` (first page only; subsequent pages are usually streamed)
     *
     * When enabled, keys are usually derived from:
     * - `baseId`, `table`, and normalized list parameters (e.g. `view`, `filterByFormula`).
     *
     * @defaultValue `true` (implementation-dependent)
     */
    listRecords?: boolean

    /**
     * Whether to cache the **fully materialized** result of `listAllRecords`.
     *
     * This can be very useful for moderately sized tables where the full
     * list is often requested, but can be memory-heavy for large tables.
     *
     * When enabled, the entire aggregated result is cached under a single key.
     *
     * @defaultValue `true` (implementation-dependent)
     */
    listAllRecords?: boolean

    /**
     * Whether to cache individual `getRecord` results.
     *
     * This is usually safe and helpful for read-heavy workloads, but you may
     * want to disable it if:
     *
     * - Records change very frequently.
     * - You prefer to always fetch the latest data from Airtable.
     *
     * @defaultValue `true` (implementation-dependent)
     */
    getRecord?: boolean
  }
}
