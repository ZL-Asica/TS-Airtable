/**
 * Header used by Airtable webhook notifications to carry the HMAC signature.
 */
export const AIRTABLE_WEBHOOK_CONTENT_MAC_HEADER = 'X-Airtable-Content-MAC'

/**
 * Signature scheme prefix used by Airtable webhook notifications.
 */
export const AIRTABLE_WEBHOOK_SIGNATURE_SCHEME = 'hmac-sha256'

/**
 * Raw request body accepted by the webhook verification helpers.
 *
 * Always pass the exact raw body bytes received by your HTTP server. Parsing
 * JSON and then stringifying it again will usually change whitespace or key
 * ordering and make signature verification fail.
 */
export type AirtableWebhookRawBody = string | ArrayBuffer | ArrayBufferView

/**
 * Minimal shape of the webhook notification ping sent to your
 * `notificationUrl`.
 *
 * The ping only identifies the base and webhook. Fetch the actual changes via
 * `client.webhooks.listWebhookPayloads(...)`.
 */
export interface AirtableWebhookNotification {
  /**
   * Base that changed.
   */
  base: {
    /**
     * Airtable base id, e.g. `"appXXXXXXXXXXXXXX"`.
     */
    id: string
  }

  /**
   * Webhook that received the notification.
   */
  webhook: {
    /**
     * Airtable webhook id, e.g. `"achXXXXXXXXXXXXXX"`.
     */
    id: string
  }

  /**
   * Airtable notification timestamp, when present.
   */
  timestamp?: string
}

/**
 * Headers object accepted by {@link getAirtableWebhookContentMac}.
 */
export type AirtableWebhookHeaders
  = | Headers
    | Record<string, string | number | boolean | null | undefined>

/**
 * Options for computing an Airtable webhook signature.
 */
export interface ComputeAirtableWebhookSignatureOptions {
  /**
   * Raw request body bytes or string exactly as received.
   */
  body: AirtableWebhookRawBody

  /**
   * `macSecretBase64` returned by Airtable when the webhook was created.
   */
  macSecretBase64: string

  /**
   * Optional Web Crypto implementation for tests or non-standard runtimes.
   *
   * Defaults to `globalThis.crypto`.
   */
  crypto?: Pick<Crypto, 'subtle'>
}

/**
 * Options for verifying an Airtable webhook signature.
 */
export interface VerifyAirtableWebhookSignatureOptions extends ComputeAirtableWebhookSignatureOptions {
  /**
   * Signature from `X-Airtable-Content-MAC`.
   *
   * Both Airtable's `hmac-sha256=<hex>` format and a raw hex digest are
   * accepted.
   */
  signature: string | null | undefined
}

/**
 * Options for parsing and verifying an Airtable webhook notification.
 */
export interface VerifyAirtableWebhookNotificationOptions extends VerifyAirtableWebhookSignatureOptions {}

/**
 * Error thrown when webhook verification or notification parsing fails.
 */
export class AirtableWebhookVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AirtableWebhookVerificationError'
  }
}

/**
 * Read Airtable's webhook signature header from a `Headers` object or plain
 * header record.
 *
 * Header names are matched case-insensitively.
 */
export function getAirtableWebhookContentMac(
  headers: AirtableWebhookHeaders,
): string | undefined {
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get(AIRTABLE_WEBHOOK_CONTENT_MAC_HEADER) ?? undefined
  }

  const normalizedName = AIRTABLE_WEBHOOK_CONTENT_MAC_HEADER.toLowerCase()
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === normalizedName && value != null) {
      return String(value)
    }
  }

  return undefined
}

/**
 * Compute the expected Airtable webhook signature for a raw request body.
 *
 * The returned value includes Airtable's `hmac-sha256=` prefix, so it can be
 * compared directly to `X-Airtable-Content-MAC` or used in tests.
 */
export async function computeAirtableWebhookSignature(
  options: ComputeAirtableWebhookSignatureOptions,
): Promise<string> {
  const cryptoImpl = options.crypto ?? globalThis.crypto
  if (!cryptoImpl?.subtle) {
    throw new AirtableWebhookVerificationError(
      'Airtable webhook verification requires Web Crypto support.',
    )
  }

  const keyBytes = decodeBase64(options.macSecretBase64)
  const key = await cryptoImpl.subtle.importKey(
    'raw',
    toArrayBuffer(keyBytes),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await cryptoImpl.subtle.sign(
    'HMAC',
    key,
    toArrayBuffer(toBytes(options.body)),
  )

  return `${AIRTABLE_WEBHOOK_SIGNATURE_SCHEME}=${toHex(new Uint8Array(signature))}`
}

/**
 * Verify an Airtable webhook notification signature in constant time.
 *
 * Returns `false` for missing or malformed signatures. Throws only when the
 * runtime cannot perform HMAC-SHA256 verification.
 */
export async function verifyAirtableWebhookSignature(
  options: VerifyAirtableWebhookSignatureOptions,
): Promise<boolean> {
  const actual = normalizeSignature(options.signature)
  if (!actual)
    return false

  const expected = normalizeSignature(
    await computeAirtableWebhookSignature(options),
  )

  return expected ? constantTimeEqual(expected, actual) : false
}

/**
 * Parse a raw Airtable webhook notification body and validate the minimal
 * notification shape.
 */
export function parseAirtableWebhookNotification(
  body: AirtableWebhookRawBody,
): AirtableWebhookNotification {
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(toBytes(body))) as unknown
  }
  catch {
    throw new AirtableWebhookVerificationError(
      'Airtable webhook notification body must be valid JSON.',
    )
  }

  if (!isWebhookNotification(parsed)) {
    throw new AirtableWebhookVerificationError(
      'Airtable webhook notification body is missing base.id or webhook.id.',
    )
  }

  return parsed
}

/**
 * Verify the signature and parse the Airtable webhook notification body.
 *
 * Use this in request handlers when you have the raw body and the stored
 * `macSecretBase64` for the webhook.
 */
export async function verifyAirtableWebhookNotification(
  options: VerifyAirtableWebhookNotificationOptions,
): Promise<AirtableWebhookNotification> {
  const verified = await verifyAirtableWebhookSignature(options)
  if (!verified) {
    throw new AirtableWebhookVerificationError(
      'Airtable webhook signature verification failed.',
    )
  }

  return parseAirtableWebhookNotification(options.body)
}

function toBytes(body: AirtableWebhookRawBody): Uint8Array {
  if (typeof body === 'string') {
    return new TextEncoder().encode(body)
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }

  return new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
}

function decodeBase64(value: string): Uint8Array {
  if (!value) {
    throw new AirtableWebhookVerificationError(
      'Airtable webhook macSecretBase64 is required.',
    )
  }

  if (typeof atob === 'function') {
    return Uint8Array.from(atob(value), char => char.charCodeAt(0))
  }

  throw new AirtableWebhookVerificationError(
    'Airtable webhook verification requires a base64 decoder.',
  )
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function normalizeSignature(signature: string | null | undefined): string | undefined {
  if (!signature)
    return undefined

  const trimmed = signature.trim().toLowerCase()
  const prefix = `${AIRTABLE_WEBHOOK_SIGNATURE_SCHEME}=`
  const hex = trimmed.startsWith(prefix)
    ? trimmed.slice(prefix.length)
    : trimmed

  return /^[0-9a-f]+$/.test(hex) && hex.length % 2 === 0
    ? hex
    : undefined
}

function constantTimeEqual(expected: string, actual: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected)
  const actualBytes = new TextEncoder().encode(actual)
  const maxLength = Math.max(expectedBytes.length, actualBytes.length)
  let diff = expectedBytes.length ^ actualBytes.length

  for (let index = 0; index < maxLength; index++) {
    diff |= (expectedBytes[index] ?? 0) ^ (actualBytes[index] ?? 0)
  }

  return diff === 0
}

function isWebhookNotification(value: unknown): value is AirtableWebhookNotification {
  if (!value || typeof value !== 'object')
    return false

  const candidate = value as AirtableWebhookNotification
  return (
    typeof candidate.base?.id === 'string'
    && candidate.base.id.length > 0
    && typeof candidate.webhook?.id === 'string'
    && candidate.webhook.id.length > 0
    && (
      candidate.timestamp === undefined
      || typeof candidate.timestamp === 'string'
    )
  )
}
