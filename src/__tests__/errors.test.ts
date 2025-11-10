import type { AirtableErrorResponseBody } from '@/errors'
import { describe, expect, it } from 'vitest'
import { AirtableError, isAirtableError } from '@/errors'

describe('airtableError', () => {
  it('uses string error payload as both type and message', () => {
    const payload: AirtableErrorResponseBody = {
      error: 'AUTHENTICATION_REQUIRED',
      extra: 'foo',
    }

    const err = new AirtableError(401, payload)

    expect(err).toBeInstanceOf(AirtableError)
    expect(err.status).toBe(401)
    expect(err.type).toBe('AUTHENTICATION_REQUIRED')
    expect(err.message).toBe('AUTHENTICATION_REQUIRED')
    expect(err.payload).toBe(payload)
  })

  it('falls back to a generic message when payload is missing', () => {
    const err = new AirtableError(500)

    expect(err.status).toBe(500)
    expect(err.type).toBeUndefined()
    expect(err.payload).toBeUndefined()
    expect(err.message).toBe('Airtable API request failed with status 500')
  })
})

describe('isAirtableError', () => {
  it('returns true for AirtableError instances', () => {
    const err = new AirtableError(400, {
      error: { type: 'INVALID_REQUEST', message: 'Bad' },
    })
    expect(isAirtableError(err)).toBe(true)
  })

  it('returns false for non AirtableError values', () => {
    expect(isAirtableError(new Error('x'))).toBe(false)
    expect(isAirtableError({ status: 400 })).toBe(false)
    expect(isAirtableError(null)).toBe(false)
    expect(isAirtableError(undefined)).toBe(false)
  })
})
