import type {
  AirtableBase,
  AirtableClientOptions,
  AirtableGlobalConfig,
  AirtableQuery,
  AirtableTable,
  GetRecordParams,
  ListRecordsParams,
} from '@/types'
import { AirtableClient } from '@/client'

// -----------------------------------------------------------------------------
// Implementation helpers
// -----------------------------------------------------------------------------

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
}

/**
 * Process-wide configuration used by the top-level `Airtable` singleton.
 */
const globalConfig: InternalGlobalConfig = {}

/**
 * Create a query object for `base(table).select(...)`.
 *
 * The returned object exposes:
 * - `AirtableQuery.all` — fetch all pages via `listAllRecords`
 * - `AirtableQuery.firstPage` — fetch a single page via `listRecords`
 *
 * @typeParam TFields - Shape of the `fields` object for records in this table.
 *
 * @param client - High-level `AirtableClient` bound to a base.
 * @param tableIdOrName - Table ID or table name.
 * @param params - Record listing parameters (same as `ListRecordsParams` but without `offset`).
 *
 * @returns A lightweight query object.
 *
 * @example
 * ```ts
 * const base = Airtable.base<MyFields>(baseId)
 * const query = base('Tasks').select({ view: 'Grid view', maxRecords: 100 })
 *
 * const all = await query.all()
 * const firstPage = await query.firstPage()
 * ```
 */
function createQuery<TFields>(
  client: AirtableClient<TFields>,
  tableIdOrName: string,
  params?: Omit<ListRecordsParams, 'offset'>,
): AirtableQuery<TFields> {
  return {
    all: () =>
      client.records.listAllRecords<TFields>(tableIdOrName, params),
    firstPage: async () => {
      const res = await client.records.listRecords<TFields>(
        tableIdOrName,
        params as ListRecordsParams | undefined,
      )
      return res.records
    },
  }
}

/**
 * Create a table wrapper for `base(tableName)`.
 *
 * The returned object exposes the most common table-level helpers:
 *
 * - `select().all()` / `select().firstPage()`
 * - `find(recordId, params?)`
 * - `create(records, options?)`
 * - `update(records, options?)`
 * - `updateRecord(recordId, fields, options?)`
 * - `destroy(recordId)`
 * - `destroyMany(recordIds)`
 *
 * All methods are thin delegations to `AirtableClient.records`.
 *
 * @typeParam TFields - Shape of the `fields` object for records in this table.
 *
 * @param client - High-level `AirtableClient` bound to a base.
 * @param tableIdOrName - Table ID or table name.
 *
 * @returns A table wrapper implementing `AirtableTable`.
 *
 * @example
 * ```ts
 * const base = Airtable.base<MyFields>(baseId)
 * const tasks = base('Tasks')
 *
 * const created = await tasks.create([{ fields: { Name: 'New task' } }])
 * const found = await tasks.find(created.records[0].id)
 * await tasks.destroy(found.id)
 * ```
 */
function createTable<TFields>(
  client: AirtableClient<TFields>,
  tableIdOrName: string,
): AirtableTable<TFields> {
  return {
    select: (params?: Omit<ListRecordsParams, 'offset'>) =>
      createQuery<TFields>(client, tableIdOrName, params),

    find: (recordId: string, params?: GetRecordParams) =>
      client.records.getRecord<TFields>(tableIdOrName, recordId, params),

    create: (records, options) =>
      client.records.createRecords<TFields>(tableIdOrName, records, options),

    update: (records, options) =>
      client.records.updateRecords<TFields>(tableIdOrName, records, options),

    updateRecord: (recordId, fields, options) =>
      client.records.updateRecord<TFields>(tableIdOrName, recordId, fields, options),

    destroy: (recordId: string) =>
      client.records.deleteRecord(tableIdOrName, recordId),

    destroyMany: (recordIds: string[]) =>
      client.records.deleteRecords(tableIdOrName, recordIds),
  }
}

/**
 * Create a "base function" like `Airtable.base(baseId)`.
 *
 * The returned function is callable — `base('Table')` — and also carries
 * metadata:
 *
 * - `base.id` — the base id
 * - `base.client` — the underlying `AirtableClient` instance
 *
 * @typeParam TDefaultFields - Default fields shape for all tables accessed
 *   through this base. You can still override it at call sites via generics
 *   on the underlying `AirtableClient` APIs, if needed.
 *
 * @param opts - Airtable client options, including `apiKey` and `baseId`.
 *
 * @returns A `AirtableBase` function for the given base.
 */
function createBase<TDefaultFields>(
  opts: AirtableClientOptions,
): AirtableBase<TDefaultFields> {
  const client = new AirtableClient<TDefaultFields>(opts)
  const baseId = opts.baseId

  const baseFn = ((tableIdOrName: string) =>
    createTable<TDefaultFields>(client, tableIdOrName)) as AirtableBase<TDefaultFields>

  Object.defineProperty(baseFn, 'id', {
    value: baseId,
    enumerable: true,
  })

  Object.defineProperty(baseFn, 'client', {
    value: client,
    enumerable: true,
  })

  return baseFn
}

// -----------------------------------------------------------------------------
// Public Airtable singleton
// -----------------------------------------------------------------------------

/**
 * Global Airtable facade, mimicking the official `airtable.js` API:
 *
 * - `AirtableGlobal.configure` — set global defaults (API key, endpoint, etc.)
 * - `AirtableGlobal.base` — create a function bound to a specific base
 *
 * Typical usage:
 *
 * @example
 * ```ts
 * import Airtable from 'ts-airtable'
 *
 * Airtable.configure({
 *   apiKey: process.env.AIRTABLE_API_KEY!,
 * })
 *
 * type Task = { Name: string; Status?: 'Todo' | 'Doing' | 'Done' }
 *
 * const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!)
 *
 * const records = await base('Tasks')
 *   .select({ view: 'Grid view' })
 *   .all()
 *
 * console.log(records[0].fields.Name)
 * ```
 */
class AirtableGlobal {
  /**
   * Configure global defaults for subsequent `Airtable.base(...)` calls.
   *
   * You must at least provide `apiKey` at some point before calling
   * `AirtableGlobal.base`. Other options are optional and will fall
   * back to sensible defaults from `AirtableClientOptions`.
   *
   * You can call this multiple times; later calls overwrite individual
   * properties but leave others intact.
   *
   * @param config - Global configuration minus `baseId`.
   *   - `apiKey` (required before calling `base`)
   *   - `endpointUrl` (optional)
   *   - `fetch` (optional)
   *   - `maxRetries` (optional)
   *   - `retryInitialDelayMs` (optional)
   *   - `retryOnStatuses` (optional)
   *
   * @example
   * ```ts
   * Airtable.configure({
   *   apiKey: process.env.AIRTABLE_API_KEY!,
   *   endpointUrl: 'https://api.airtable.com',
   *   maxRetries: 3,
   * })
   * ```
   */
  configure(config: AirtableGlobalConfig): void {
    if (config.apiKey)
      globalConfig.apiKey = config.apiKey
    if (config.endpointUrl)
      globalConfig.endpointUrl = config.endpointUrl
    if (config.fetch)
      globalConfig.fetch = config.fetch
    if (config.maxRetries != null)
      globalConfig.maxRetries = config.maxRetries
    if (config.retryInitialDelayMs != null) {
      globalConfig.retryInitialDelayMs = config.retryInitialDelayMs
    }
    if (config.retryOnStatuses) {
      globalConfig.retryOnStatuses = config.retryOnStatuses
    }
  }

  /**
   * Create a base handle bound to the given base id.
   *
   * This uses configuration previously provided via `configure`.
   * At minimum, an API key must have been configured.
   *
   * @typeParam TDefaultFields - Default fields shape for tables in this base.
   *
   * @param baseId - Airtable base ID (e.g. `"appXXXXXXXXXXXXXX"`).
   *
   * @returns A `AirtableBase` function that can be called with a
   *   table ID or name: `base('Tasks')`.
   *
   * @throws Error - If `baseId` is empty or if `apiKey` has not been
   *   configured yet.
   *
   * @example
   * ```ts
   * Airtable.configure({
   *   apiKey: process.env.AIRTABLE_API_KEY!,
   * })
   *
   * const base = Airtable.base<MyFields>(process.env.AIRTABLE_BASE_ID!)
   * const records = await base('Tasks').select({ view: 'Grid view' }).all()
   * ```
   */
  base<TDefaultFields = Record<string, unknown>>(
    baseId: string,
  ): AirtableBase<TDefaultFields> {
    if (!baseId) {
      throw new Error('Airtable.base: baseId is required')
    }
    if (!globalConfig.apiKey) {
      throw new Error(
        'Airtable.base: apiKey must be configured via Airtable.configure(...)',
      )
    }

    const options: AirtableClientOptions = {
      apiKey: globalConfig.apiKey,
      baseId,
      endpointUrl: globalConfig.endpointUrl,
      fetch: globalConfig.fetch,
      maxRetries: globalConfig.maxRetries,
      retryInitialDelayMs: globalConfig.retryInitialDelayMs,
      retryOnStatuses: globalConfig.retryOnStatuses,
    }

    return createBase<TDefaultFields>(options)
  }
}

/**
 * Top-level Airtable singleton:
 *
 * - `Airtable.configure(...)`
 * - `Airtable.base(baseId)`
 *
 * This is the main entry point for the "sugar" API. For more granular
 * control, you can use `AirtableClient` directly.
 */
export const Airtable: AirtableGlobal = new AirtableGlobal()

export default Airtable
