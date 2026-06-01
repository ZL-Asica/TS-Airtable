import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AIRTABLE_WEBHOOK_CONTENT_MAC_HEADER,
  AirtableWebhookVerificationError,
  computeAirtableWebhookSignature,
  getAirtableWebhookContentMac,
  parseAirtableWebhookNotification,
  verifyAirtableWebhookNotification,
  verifyAirtableWebhookSignature,
} from '@/webhook-verification'

const macSecretBase64 = 'c2VjcmV0LXdlYmhvb2sta2V5'
const body = JSON.stringify({
  base: { id: 'appXXXXXXXXXXXXXX' },
  webhook: { id: 'achXXXXXXXXXXXXXX' },
  timestamp: '2026-06-01T00:00:00.000Z',
})

describe('webhook verification helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('extracts Airtable content MAC headers case-insensitively', () => {
    expect(getAirtableWebhookContentMac(new Headers({
      [AIRTABLE_WEBHOOK_CONTENT_MAC_HEADER]: 'hmac-sha256=abc123',
    }))).toBe('hmac-sha256=abc123')
    expect(getAirtableWebhookContentMac(new Headers())).toBeUndefined()

    expect(getAirtableWebhookContentMac({
      'x-airtable-content-mac': 'hmac-sha256=def456',
    })).toBe('hmac-sha256=def456')

    expect(getAirtableWebhookContentMac({
      'x-airtable-content-mac': undefined,
    })).toBeUndefined()
    expect(getAirtableWebhookContentMac({})).toBeUndefined()
  })

  it('computes and verifies Airtable webhook signatures', async () => {
    const signature = await computeAirtableWebhookSignature({
      body,
      macSecretBase64,
    })

    expect(signature).toMatch(/^hmac-sha256=[0-9a-f]+$/)
    await expect(verifyAirtableWebhookSignature({
      body,
      macSecretBase64,
      signature,
    })).resolves.toBe(true)
    await expect(verifyAirtableWebhookSignature({
      body,
      macSecretBase64,
      signature: signature.replace(/.$/, '0'),
    })).resolves.toBe(false)
    await expect(verifyAirtableWebhookSignature({
      body,
      macSecretBase64,
      signature: `${signature}00`,
    })).resolves.toBe(false)
  })

  it('accepts raw hex signatures and ArrayBufferView bodies', async () => {
    const bytes = new TextEncoder().encode(body)
    const signature = await computeAirtableWebhookSignature({
      body: bytes.buffer,
      macSecretBase64,
    })
    const rawHex = signature.replace('hmac-sha256=', '')

    await expect(verifyAirtableWebhookSignature({
      body: bytes.subarray(0),
      macSecretBase64,
      signature: rawHex,
    })).resolves.toBe(true)
  })

  it('returns false for missing or malformed signatures', async () => {
    await expect(verifyAirtableWebhookSignature({
      body,
      macSecretBase64,
      signature: undefined,
    })).resolves.toBe(false)
    await expect(verifyAirtableWebhookSignature({
      body,
      macSecretBase64,
      signature: 'sha256=abc',
    })).resolves.toBe(false)
    await expect(verifyAirtableWebhookSignature({
      body,
      macSecretBase64,
      signature: 'hmac-sha256=abc',
    })).resolves.toBe(false)
  })

  it('parses and verifies webhook notifications', async () => {
    const signature = await computeAirtableWebhookSignature({
      body,
      macSecretBase64,
    })

    await expect(verifyAirtableWebhookNotification({
      body,
      macSecretBase64,
      signature,
    })).resolves.toEqual({
      base: { id: 'appXXXXXXXXXXXXXX' },
      webhook: { id: 'achXXXXXXXXXXXXXX' },
      timestamp: '2026-06-01T00:00:00.000Z',
    })

    expect(parseAirtableWebhookNotification(JSON.stringify({
      base: { id: 'appNoTimestamp' },
      webhook: { id: 'achNoTimestamp' },
    }))).toEqual({
      base: { id: 'appNoTimestamp' },
      webhook: { id: 'achNoTimestamp' },
    })
  })

  it('throws verification errors for bad notifications', async () => {
    const invalidBody = JSON.stringify({ base: { id: 'app' } })
    const signature = await computeAirtableWebhookSignature({
      body: invalidBody,
      macSecretBase64,
    })

    expect(() => parseAirtableWebhookNotification('not json'))
      .toThrow(AirtableWebhookVerificationError)
    expect(() => parseAirtableWebhookNotification('null'))
      .toThrow('Airtable webhook notification body is missing base.id or webhook.id.')
    expect(() => parseAirtableWebhookNotification(invalidBody))
      .toThrow('Airtable webhook notification body is missing base.id or webhook.id.')
    await expect(verifyAirtableWebhookNotification({
      body: invalidBody,
      macSecretBase64,
      signature: 'hmac-sha256=00',
    })).rejects.toThrow('Airtable webhook signature verification failed.')
    await expect(verifyAirtableWebhookNotification({
      body: invalidBody,
      macSecretBase64,
      signature,
    })).rejects.toThrow('Airtable webhook notification body is missing base.id or webhook.id.')
  })

  it('throws when signing prerequisites are missing', async () => {
    await expect(computeAirtableWebhookSignature({
      body,
      macSecretBase64: '',
    })).rejects.toThrow('Airtable webhook macSecretBase64 is required.')

    await expect(computeAirtableWebhookSignature({
      body,
      macSecretBase64,
      crypto: {} as Crypto,
    })).rejects.toThrow('Airtable webhook verification requires Web Crypto support.')
  })

  it('throws when base64 decoding is unavailable', async () => {
    vi.stubGlobal('atob', undefined)

    await expect(computeAirtableWebhookSignature({
      body,
      macSecretBase64,
    })).rejects.toThrow('Airtable webhook verification requires a base64 decoder.')
  })
})
