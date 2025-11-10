/**
 * Raw error payload returned by Airtable API when a request fails.
 *
 * This is a loose representation of the JSON error body. It is intentionally
 * permissive so the client does not break when Airtable introduces new fields.
 *
 * @example
 * ```jsonc
 * {
 *   "error": {
 *     "type": "INVALID_REQUEST_UNKNOWN",
 *     "message": "The requested resource could not be found"
 *   }
 * }
 * ```
 */
export interface AirtableErrorResponseBody {
  /**
   * Error details, either as a string or an object with `type` and `message`.
   *
   * When present as an object, `type` is a short error code and `message`
   * is a human-readable description.
   */
  error?:
    | string
    | {
      /**
       * Short machine-friendly error type identifier.
       * For example: `"INVALID_REQUEST_UNKNOWN"`, `"AUTHENTICATION_REQUIRED"`.
       */
      type?: string
      /**
       * Human-readable error message.
       */
      message?: string
      /**
       * Additional error-specific fields that Airtable might include.
       */
      [key: string]: unknown
    }

  /**
   * Any additional fields returned by the API that are not yet modeled.
   * This keeps the type forward-compatible with future API changes.
   */
  [key: string]: unknown
}
