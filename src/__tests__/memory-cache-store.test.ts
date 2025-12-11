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

  describe('inMemoryCacheStore - transformAttachment', () => {
    it('memoizes attachments by id and returns the same instance on subsequent calls', async () => {
      const store = new InMemoryCacheStore()

      const ctx = {
        baseId: 'appTest',
        tableIdOrName: 'Tasks',
        recordId: 'rec1',
        fieldName: 'Attachments',
      }

      const firstAttachment = {
        id: 'att1',
        url: 'https://airtable.com/tmp/att1',
        filename: 'file-a.png',
      } as any

      const secondAttachmentWithSameId = {
      // same id, but different url to prove we reuse the first one
        id: 'att1',
        url: 'https://airtable.com/tmp/att1-different',
        filename: 'file-a-new.png',
      } as any

      const result1 = await store.transformAttachment(firstAttachment, ctx)
      const result2 = await store.transformAttachment(
        secondAttachmentWithSameId,
        ctx,
      )

      // For the first call we simply return the original object
      expect(result1).toBe(firstAttachment)

      // For the second call with the same id, we should reuse the
      // previously memoized instance instead of the new object
      expect(result2).toBe(result1)

      // And the reused instance should still reflect the original
      // attachment rather than the second one’s fields
      expect(result2.url).toBe('https://airtable.com/tmp/att1')
      expect(result2.filename).toBe('file-a.png')
    })

    it('does not mix attachments with different ids', async () => {
      const store = new InMemoryCacheStore()

      const ctx = {
        baseId: 'appTest',
        tableIdOrName: 'Tasks',
        recordId: 'rec1',
        fieldName: 'Attachments',
      }

      const attachmentA = {
        id: 'attA',
        url: 'https://airtable.com/tmp/attA',
      } as any

      const attachmentB = {
        id: 'attB',
        url: 'https://airtable.com/tmp/attB',
      } as any

      const resultA = await store.transformAttachment(attachmentA, ctx)
      const resultB = await store.transformAttachment(attachmentB, ctx)

      // Different ids should be memoized as different entries
      expect(resultA).toBe(attachmentA)
      expect(resultB).toBe(attachmentB)
      expect(resultA).not.toBe(resultB)
    })

    it('accepts context argument without affecting memoization semantics', async () => {
      const store = new InMemoryCacheStore()

      const attachment = {
        id: 'attX',
        url: 'https://airtable.com/tmp/attX',
      } as any

      const ctx1 = {
        baseId: 'app1',
        tableIdOrName: 'TableA',
        recordId: 'rec1',
        fieldName: 'FieldA',
      }

      const ctx2 = {
        baseId: 'app2',
        tableIdOrName: 'TableB',
        recordId: 'rec2',
        fieldName: 'FieldB',
      }

      const first = await store.transformAttachment(attachment, ctx1)
      const second = await store.transformAttachment(
        {
        // same id, slightly different data
          id: 'attX',
          url: 'https://airtable.com/tmp/attX-new',
        } as any,
        ctx2,
      )

      // Context differences should not change memoization behavior:
      // as long as the id is the same, we reuse the first instance.
      expect(first).toBe(second)
      expect(second.url).toBe('https://airtable.com/tmp/attX')
    })
  })
})
