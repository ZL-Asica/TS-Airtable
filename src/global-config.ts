import type { AirtableGlobalConfig } from '@/types'

/**
 * Internal storage for global configuration used by the Airtable singleton.
 *
 * This is intentionally not exported; users should configure the client via
 * `AirtableGlobal.configure` instead of mutating globals directly.
 */
interface InternalGlobalConfig extends Partial<AirtableGlobalConfig> {}

/**
 * Process-wide configuration used by the top-level `Airtable` singleton.
 */
export const globalConfig: InternalGlobalConfig = {}
