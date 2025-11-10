import { afterEach, describe, expect, it, vi } from 'vitest'
import { InMemoryCacheStore } from '@/memory-cache-store'

afterEach(() => {
  vi.useRealTimers()
})

describe('inMemoryCacheStore - basic get/set', () => {
  it('returns undefined for missing keys', () => {
    const store = new InMemoryCacheStore()
    expect(store.get('missing')).toBeUndefined()
  })

  it('stores and retrieves values', () => {
    const store = new InMemoryCacheStore()
    store.set('foo', 123)
    expect(store.get<number>('foo')).toBe(123)
  })

  it('updates existing keys and overwrites value and TTL', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00.000Z'))

    const store = new InMemoryCacheStore()

    store.set('foo', 1, 1_000) // TTL t=1000
    // Cover the same key, new TTL
    store.set('foo', 2, 10_000) // TTL t=10000

    // After 2000ms, the new TTL is still valid
    vi.setSystemTime(new Date('2020-01-01T00:00:02.000Z'))
    expect(store.get<number>('foo')).toBe(2)
  })
})

describe('inMemoryCacheStore - TTL behavior', () => {
  it('removes expired entries on get', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00.000Z'))

    const store = new InMemoryCacheStore()
    store.set('foo', 'bar', 1_000) // 1s TTL

    // Not expire
    vi.setSystemTime(new Date('2020-01-01T00:00:00.500Z'))
    expect(store.get('foo')).toBe('bar')

    // Expired
    vi.setSystemTime(new Date('2020-01-01T00:00:02.000Z'))
    expect(store.get('foo')).toBeUndefined()
    // Should be undefined when re-getting (the first get already removed it from the map)
    expect(store.get('foo')).toBeUndefined()
  })

  it('prefers evicting expired entries over LRU when at capacity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00.000Z'))

    const store = new InMemoryCacheStore(2)

    // foo: expire really soon
    store.set('foo', 'expiredSoon', 1_000)
    // bar: never expire
    store.set('bar', 'alive')

    // Move time forward enough for foo to expire
    vi.setSystemTime(new Date('2020-01-01T00:00:05.000Z'))

    // Trigger expand: now map.size === maxSize === 2
    store.set('baz', 'new')

    // Based on the logic of evictOne: should evict foo (expired), keep bar and baz
    expect(store.get('foo')).toBeUndefined()
    expect(store.get('bar')).toBe('alive')
    expect(store.get('baz')).toBe('new')
  })
})

describe('inMemoryCacheStore - LRU behavior', () => {
  it('evicts the least recently used entry when over capacity', () => {
    const store = new InMemoryCacheStore(2)

    store.set('a', 'A')
    store.set('b', 'B')

    // Access a to make it most recently used (b becomes LRU)
    expect(store.get('a')).toBe('A')

    // Insert third key, trigger evictOne -> remove b
    store.set('c', 'C')

    expect(store.get('a')).toBe('A')
    expect(store.get('b')).toBeUndefined()
    expect(store.get('c')).toBe('C')
  })

  it('handles maxSize = 0 and evictOne with empty map (firstKey undefined branch)', () => {
    const store = new InMemoryCacheStore(0)

    // The set here will trigger this.map.size >= this.maxSize (0 >= 0)
    // When evictOne, the map is still empty, firstKey is undefined, pass if (!firstKey) branch
    store.set('a', 1)

    // But it finally will put 1 into a
    expect(store.get('a')).toBe(1)
  })
})

describe('inMemoryCacheStore - delete & deleteByPrefix', () => {
  it('delete removes a single key', () => {
    const store = new InMemoryCacheStore()
    store.set('foo', 'bar')
    expect(store.get('foo')).toBe('bar')

    store.delete('foo')
    expect(store.get('foo')).toBeUndefined()
  })

  it('delete is a no-op for missing keys', () => {
    const store = new InMemoryCacheStore()
    // No error throw is ok
    store.delete('missing')
    expect(store.get('missing')).toBeUndefined()
  })

  it('deleteByPrefix removes all matching keys and leaves others intact', () => {
    const store = new InMemoryCacheStore()
    store.set('users:1', 'u1')
    store.set('users:2', 'u2')
    store.set('posts:1', 'p1')

    store.deleteByPrefix('users:')

    expect(store.get('users:1')).toBeUndefined()
    expect(store.get('users:2')).toBeUndefined()
    expect(store.get('posts:1')).toBe('p1')
  })

  it('deleteByPrefix is a no-op when no keys match', () => {
    const store = new InMemoryCacheStore()
    store.set('foo', 'bar')

    store.deleteByPrefix('not-matching:')

    // key should still be there
    expect(store.get('foo')).toBe('bar')
  })
})
