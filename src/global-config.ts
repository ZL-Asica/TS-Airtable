import type { AirtableRecordsCacheOptions } from '@/types'

/**
 * Internal storage for global configuration used by the Airtable singleton.
 *
 * This is intentionally not exported; users should configure the client via
 * `AirtableGlobal.configure` instead of mutating globals directly.
 */
interface InternalGlobalConfig {
  apiKey?: string
  endpointUrl?: string
  fetch?: typeof fetch
  maxRetries?: number
  retryInitialDelayMs?: number
  retryOnStatuses?: number[]

  /**
   * Shared records cache configuration for all bases created via
   * `Airtable.base(...)`.
   *
   * If set, every `AirtableClient` constructed through the global
   * singleton will receive this `recordsCache` in its options.
   */
  recordsCache?: AirtableRecordsCacheOptions
}

/**
 * Process-wide configuration used by the top-level `Airtable` singleton.
 */
export const globalConfig: InternalGlobalConfig = {}
