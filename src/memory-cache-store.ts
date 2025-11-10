import type { AirtableCacheStore } from '@/types/cache-store'

/**
 * In-memory implementation of {@link AirtableCacheStore} with:
 *
 * - **LRU (least recently used) eviction** when `maxSize` is reached.
 * - **Per-entry TTL support** (time-to-live, in milliseconds).
 * - **Prefix-based deletion** for grouped invalidation (e.g. all keys for a table).
 *
 * This is intended as a simple, zero-dependency cache for environments like
 * Node.js or Cloudflare Workers. It uses a `Map` internally and relies on
 * insertion order to track LRU state:
 *
 * - Every `get()` of a non-expired entry marks it as most recently used.
 * - Every `set()` marks the key as most recently used.
 * - When capacity is exceeded, the **least recently used** key is evicted.
 *
 * TTL is enforced lazily:
 *
 * - On `get()`, if the entry is expired, it is removed and `undefined` is returned.
 * - On `set()`, before evicting for capacity, the cache will try to drop any
 *   expired entry first (if found).
 *
 * This class is not meant to be shared across multiple processes; it is strictly
 * in-memory for a single runtime.
 */
export class InMemoryCacheStore implements AirtableCacheStore {
  /**
   * Internal storage. The Map’s iteration order encodes recency:
   * the **last** key is the most recently used.
   */
  private map = new Map<string, { value: unknown, expiresAt?: number }>()

  /**
   * Maximum number of entries the cache will hold before evicting.
   * Defaults to 1000 entries.
   */
  private readonly maxSize: number

  /**
   * Creates a new in-memory cache store.
   *
   * @param maxSize - Maximum number of entries the cache will hold.
   *   When the limit is reached, the **least recently used** entry is evicted.
   *   Defaults to `1000`.
   *
   * @example
   * // Basic usage with default capacity
   * const cache = new InMemoryCacheStore()
   *
   * @example
   * // Custom capacity (e.g. keep at most 100 entries)
   * const cache = new InMemoryCacheStore(100)
   */
  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  /**
   * Retrieves a cached value if present and not expired.
   *
   * Accessing a non-expired key marks it as **most recently used**
   * for LRU purposes.
   *
   * If the entry has expired, it is removed and `undefined` is returned.
   *
   * @typeParam T - Expected type of the cached value.
   *
   * @param key - Cache key to look up.
   *
   * @returns The cached value typed as `T`, or `undefined` if the key
   *   is missing or expired.
   *
   * @example
   * const value = cache.get<MyType>(key)
   * if (value) {
   *   // cache hit
   * } else {
   *   // cache miss
   * }
   */
  get<T = unknown>(key: string): T | undefined {
    const entry = this.map.get(key)
    if (!entry)
      return undefined

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      // TTL expired → treat as miss and remove from cache
      this.map.delete(key)
      return undefined
    }

    // Mark as most recently used: move to the end of the Map
    this.map.delete(key)
    this.map.set(key, entry)

    return entry.value as T
  }

  /**
   * Stores a value in the cache, optionally with a TTL.
   *
   * Setting an existing key updates its value and TTL and marks it as
   * most recently used.
   *
   * When inserting a new key and the cache is at or above capacity,
   * the cache will:
   *
   * 1. Try to remove **one expired entry** (if any).
   * 2. If none are expired, evict the **least recently used** entry.
   *
   * @typeParam T - Type of the value being stored.
   *
   * @param key - Cache key. Should be globally unique for the data
   *   you are caching (e.g. include baseId, table, params, etc.).
   * @param value - Value to store.
   * @param ttlMs - Optional TTL in milliseconds. If provided, the entry
   *   is considered expired once `Date.now() > createdAt + ttlMs`.
   *
   * @example
   * // Cache a list response for 10 seconds
   * const key = listKey(baseId, table, params)
   * cache.set(key, records, 10_000)
   *
   * @example
   * // Cache a single record without TTL
   * const key = getKey(baseId, table, recordId, params)
   * cache.set(key, record)
   */
  set<T = unknown>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now()
    const expiresAt
      = typeof ttlMs === 'number'
        ? now + ttlMs
        : undefined

    if (this.map.has(key)) {
      // Update existing entry and mark as most recently used
      this.map.delete(key)
      this.map.set(key, { value, expiresAt })
      return
    }

    if (this.map.size >= this.maxSize) {
      this.evictOne(now)
    }

    this.map.set(key, { value, expiresAt })
  }

  /**
   * Deletes a single key from the cache, if present.
   *
   * This does **not** throw if the key does not exist.
   *
   * @param key - Cache key to remove.
   *
   * @example
   * cache.delete(getKey(baseId, table, recordId, params))
   */
  delete(key: string): void {
    this.map.delete(key)
  }

  /**
   * Deletes all keys that start with the given prefix.
   *
   * This is useful for invalidating all cache entries for:
   *
   * - A specific table: use something like `tablePrefix(baseId, table)`.
   * - A specific record: use `recordPrefix(baseId, table, recordId)`.
   *
   * Complexity is O(n) over current cache size, since it needs to scan
   * all keys to check the prefix.
   *
   * @param prefix - String prefix to match against cache keys.
   *
   * @example
   * // Invalidate all list queries for a table
   * cache.deleteByPrefix(tablePrefix(baseId, table))
   *
   * @example
   * // Invalidate all cached views of a single record
   * cache.deleteByPrefix(recordPrefix(baseId, table, recordId))
   */
  deleteByPrefix(prefix: string): void {
    for (const k of this.map.keys()) {
      if (k.startsWith(prefix)) {
        this.map.delete(k)
      }
    }
  }

  /**
   * Evicts a single entry to respect `maxSize`.
   *
   * Priority:
   * 1. Remove one **expired** entry if found.
   * 2. Otherwise, remove the **least recently used** entry (the first key).
   *
   * @param now - Current timestamp (in ms) used to check TTL.
   * @internal
   */
  private evictOne(now: number): void {
    // First try to drop an expired entry
    for (const [key, entry] of this.map.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.map.delete(key)
        return
      }
    }

    // No expired entries → evict least recently used (first key)
    const firstKey = this.map.keys().next().value as string | undefined
    if (firstKey !== undefined) {
      this.map.delete(firstKey)
    }
  }
}
