import type { AirtableErrorResponseBody } from '@/types'

/**
 * Error type thrown by {@link AirtableClient} for non-successful responses.
 *
 * Wraps the HTTP status code, a machine-readable error type (when available),
 * and the original error payload returned by Airtable.
 *
 * @example
 * ```ts
 * try {
 *   const records = await client.listRecords('Tasks')
 * } catch (err) {
 *   if (err instanceof AirtableError) {
 *     console.error('Request failed', err.status, err.type, err.message)
 *   }
 * }
 * ```
 */
export class AirtableError extends Error {
  /**
   * HTTP status code of the failed response (e.g. 400, 401, 404, 500).
   */
  public readonly status: number

  /**
   * Optional machine-readable error type, when provided by the API.
   * For example: `"INVALID_REQUEST_UNKNOWN"`, `"AUTHENTICATION_REQUIRED"`.
   */
  public readonly type?: string

  /**
   * Raw error payload returned by Airtable, if any.
   */
  public readonly payload?: AirtableErrorResponseBody

  /**
   * Create an {@link AirtableError} from a status code and optional payload.
   *
   * If the payload contains a structured `error` object, the error message
   * is taken from `payload.error.message`. Otherwise a generic message with
   * the status code is used.
   *
   * @param status - HTTP status code returned by the API.
   * @param payload - Optional error payload decoded from the response body.
   */
  constructor(status: number, payload?: AirtableErrorResponseBody) {
    const { type, message }
      = typeof payload?.error === 'string'
        ? {
            type: payload.error,
            message: payload.error,
          }
        : {
            type: payload?.error?.type,
            message: payload?.error?.message,
          }

    super(message || `Airtable API request failed with status ${status}`)
    this.name = 'AirtableError'
    this.status = status
    this.type = type
    this.payload = payload
  }
}

/**
 * Type guard to detect {@link AirtableError} instances.
 *
 * Useful when catching errors from {@link AirtableClient} and you want to
 * distinguish network/API errors from other exceptions in your application.
 *
 * @param err - Arbitrary value that may or may not be an {@link AirtableError}.
 *
 * @returns `true` if `err` is an instance of {@link AirtableError}, otherwise `false`.
 *
 * @example
 * ```ts
 * try {
 *   await client.listRecords('Tasks')
 * } catch (error) {
 *   if (isAirtableError(error)) {
 *     console.error('Airtable error', error.status, error.type)
 *   } else {
 *     console.error('Unexpected error', error)
 *   }
 * }
 * ```
 */
export function isAirtableError(err: unknown): err is AirtableError {
  return err instanceof AirtableError
}
