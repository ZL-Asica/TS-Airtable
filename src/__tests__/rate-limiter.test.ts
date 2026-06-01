import type { AirtableRequestContext } from '@/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AirtableRateLimiter } from '@/rate-limiter'

function context(attempt = 0): AirtableRequestContext {
  return {
    requestId: `req-${attempt}`,
    baseId: 'app123',
    method: 'GET',
    url: 'https://example.com/v0/app123/Tasks',
    attempt,
  }
}

describe('airtableRateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('validates rate limiter options', () => {
    expect(() => new AirtableRateLimiter({ requestsPerSecond: 0 }))
      .toThrow('AirtableRateLimiter: requestsPerSecond must be greater than 0')
    expect(() => new AirtableRateLimiter({ requestsPerSecond: Number.NaN }))
      .toThrow('AirtableRateLimiter: requestsPerSecond must be greater than 0')
    expect(() => new AirtableRateLimiter({ maxConcurrent: 0 }))
      .toThrow('AirtableRateLimiter: maxConcurrent must be a positive integer')
    expect(() => new AirtableRateLimiter({ maxConcurrent: 1.5 }))
      .toThrow('AirtableRateLimiter: maxConcurrent must be a positive integer')
  })

  it('spaces request starts and emits delay events', async () => {
    let now = 0
    const delays: number[] = []
    const onDelay = vi.fn()
    const limiter = new AirtableRateLimiter({
      requestsPerSecond: 2,
      maxConcurrent: 1,
      now: () => now,
      sleep: async (ms) => {
        delays.push(ms)
        now += ms
      },
      onDelay,
    })

    const starts: string[] = []
    const first = limiter.schedule(async () => {
      starts.push('first')
      return 'first'
    }, context(0))
    const second = limiter.schedule(async () => {
      starts.push('second')
      return 'second'
    }, context(1))

    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second'])

    expect(starts).toEqual(['first', 'second'])
    expect(delays).toEqual([500])
    expect(onDelay).toHaveBeenCalledWith(expect.objectContaining({
      attempt: 1,
      delayMs: 500,
    }))
  })

  it('propagates scheduled task failures', async () => {
    const limiter = new AirtableRateLimiter()
    const error = new Error('task failed')

    await expect(
      limiter.schedule(async () => {
        throw error
      }, context()),
    ).rejects.toBe(error)
  })

  it('uses the default timer-based sleep when no custom sleep is provided', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const limiter = new AirtableRateLimiter({
      requestsPerSecond: 1,
      maxConcurrent: 1,
      now: Date.now,
    })

    await expect(limiter.schedule(async () => 'first', context(0))).resolves.toBe('first')
    const second = limiter.schedule(async () => 'second', context(1))

    await vi.advanceTimersByTimeAsync(999)
    await expect(Promise.race([second, Promise.resolve('pending')])).resolves.toBe('pending')

    await vi.advanceTimersByTimeAsync(1)
    await expect(second).resolves.toBe('second')
  })

  it('ignores re-entrant drain calls while already draining', async () => {
    let now = 0
    const releaseSleeps: Array<() => void> = []
    const sleep = vi.fn(async (ms: number) => {
      now += ms
      await new Promise<void>((resolve) => {
        releaseSleeps.push(resolve)
      })
    })
    const limiter = new AirtableRateLimiter({
      requestsPerSecond: 1,
      maxConcurrent: 1,
      now: () => now,
      sleep,
    })

    await expect(limiter.schedule(async () => 'first', context(0))).resolves.toBe('first')
    const second = limiter.schedule(async () => 'second', context(1))
    const third = limiter.schedule(async () => 'third', context(2))

    expect(sleep).toHaveBeenCalledTimes(1)
    releaseSleeps.shift()?.()
    await vi.waitFor(() => {
      expect(sleep).toHaveBeenCalledTimes(2)
    })
    releaseSleeps.shift()?.()

    await expect(Promise.all([second, third])).resolves.toEqual(['second', 'third'])
  })

  it('keeps onDelay failures from breaking the queue', async () => {
    let now = 0
    const limiter = new AirtableRateLimiter({
      requestsPerSecond: 1,
      maxConcurrent: 1,
      now: () => now,
      sleep: async (ms) => {
        now += ms
      },
      onDelay() {
        throw new Error('metrics failed')
      },
    })

    const first = limiter.schedule(async () => 'first', context(0))
    const second = limiter.schedule(async () => 'second', context(1))

    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second'])
  })
})
