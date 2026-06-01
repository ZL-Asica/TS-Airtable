import type {
  AirtableBase,
  AirtableClientOptions,
  AirtableFieldSet,
  AirtableGlobalConfig,
  AirtableQuery,
  AirtableTable,
  GetRecordParams,
  ListRecordsParams,
} from '@/types'
import { AirtableClient } from '@/client'
import { globalConfig } from './global-config'

// -----------------------------------------------------------------------------
// Implementation helpers
// -----------------------------------------------------------------------------

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
function createQuery<TFields extends AirtableFieldSet>(
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
function createTable<TFields extends AirtableFieldSet>(
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

    update: ((records, options) =>
      client.records.updateRecords(
        tableIdOrName,
        records as never,
        options as never,
      )) as AirtableTable<TFields>['update'],

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
 * @returns An {@link AirtableBase} function for the given base.
 */
function createBase<
  TDefaultFields extends AirtableFieldSet,
>(
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

type AirtableBaseOptions = Partial<Omit<AirtableClientOptions, 'apiKey' | 'baseId'>>

function hasOwnOption<T extends object, K extends string>(
  value: T | undefined,
  key: K,
): value is T & Record<K, unknown> {
  return value != null && Reflect.ownKeys(value).includes(key)
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
 * interface Task {
 *   Name: string
 *   Status?: 'Todo' | 'Doing' | 'Done'
 * }
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
   *   - `apiVersion` (optional) – send `X-Airtable-API-Version`
   *   - `endpointUrl` (optional)
   *   - `fetch` (optional)
   *   - `noRetryIfRateLimited` (optional)
   *   - `maxRetries` (optional)
   *   - `retryInitialDelayMs` (optional)
   *   - `retryOnStatuses` (optional)
   *   - `recordsCache` (optional) – shared records cache configuration,
   *     see `AirtableRecordsCacheOptions`
   *   - `observability` (optional) – request lifecycle hooks for logs/metrics
   *   - `requestScheduler` (optional) – custom scheduler for each HTTP attempt
   *   - `rateLimiter` (optional) – built-in per-process request limiter
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
    if (config.apiKey) {
      globalConfig.apiKey = config.apiKey
    }
    if (config.apiVersion) {
      globalConfig.apiVersion = config.apiVersion
    }
    if (config.customHeaders) {
      globalConfig.customHeaders = config.customHeaders
    }
    if (config.endpointUrl) {
      globalConfig.endpointUrl = config.endpointUrl
    }
    if (config.fetch) {
      globalConfig.fetch = config.fetch
    }
    if (config.noRetryIfRateLimited != null) {
      globalConfig.noRetryIfRateLimited = config.noRetryIfRateLimited
    }
    if (config.maxRetries != null) {
      globalConfig.maxRetries = config.maxRetries
    }
    if (config.retryInitialDelayMs != null) {
      globalConfig.retryInitialDelayMs = config.retryInitialDelayMs
    }
    if (config.retryOnStatuses) {
      globalConfig.retryOnStatuses = config.retryOnStatuses
    }
    if (config.recordsCache) {
      globalConfig.recordsCache = config.recordsCache
    }
    if (config.observability) {
      globalConfig.observability = config.observability
    }
    if (hasOwnOption(config, 'requestScheduler')) {
      globalConfig.requestScheduler = config.requestScheduler
      if (config.requestScheduler) {
        globalConfig.rateLimiter = undefined
      }
    }
    if (hasOwnOption(config, 'rateLimiter')) {
      globalConfig.rateLimiter = config.rateLimiter
      if (config.rateLimiter) {
        globalConfig.requestScheduler = undefined
      }
    }
  }

  /**
   * Create a base handle bound to the given base id.
   *
   * This uses configuration previously provided via {@link AirtableGlobal.configure}.
   * At minimum, an API key must have been configured.
   *
   * You can optionally provide per-base overrides for
   * {@link AirtableClientOptions} fields that are not `apiKey` or `baseId`.
   * When both global config and per-base overrides are present,
   * **per-base overrides win**.
   *
   * In particular for caching:
   *
   * - `Airtable.configure({ recordsCache: ... })` sets a **default** records
   *   cache that will be used for all bases created via `Airtable.base(...)`.
   * - `Airtable.base(baseId, { recordsCache: ... })` lets you override that
   *   cache configuration for a specific base (or enable caching only for
   *   that base).
   *
   * @typeParam TDefaultFields - Default fields shape for tables in this base.
   *   Defaults to {@link AirtableFieldSet}.
   *
   * @param baseId - Airtable base ID (e.g. `"appXXXXXXXXXXXXXX"`).
   * @param overrides - Optional per-base overrides for {@link AirtableClientOptions}.
   *   - `recordsCache` – per-base caching settings for `client.records`.
   *   - `observability` – per-base request lifecycle hooks.
   *   - `requestScheduler` – per-base scheduler for each HTTP attempt.
   *   - `rateLimiter` – per-base built-in limiter configuration.
   *
   * @returns An {@link AirtableBase} function that can be called with a
   *   table ID or name: `base('Tasks')`.
   *
   * @throws Error - If `baseId` is empty or if `apiKey` has not been
   *   configured yet via {@link AirtableGlobal.configure}.
   *
   * @example
   * ```ts
   * // Global defaults (no caching)
   * Airtable.configure({
   *   apiKey: process.env.AIRTABLE_API_KEY!,
   * })
   *
   * const base = Airtable.base<MyFields>(process.env.AIRTABLE_BASE_ID!)
   * const records = await base('Tasks').select({ view: 'Grid view' }).all()
   * ```
   *
   * @example
   * ```ts
   * // Global caching config for all bases
   * Airtable.configure({
   *   apiKey: process.env.AIRTABLE_API_KEY!,
   *   recordsCache: {
   *     store: sharedStore,
   *     defaultTtlMs: 30_000,
   *   },
   * })
   *
   * // Override caching for a single base: different TTL / store
   * const base = Airtable.base<MyFields>(process.env.AIRTABLE_BASE_ID!, {
   *   recordsCache: {
   *     store: perBaseStore,
   *     defaultTtlMs: 5_000,
   *   },
   * })
   *
   * const tasks = await base('Tasks').select({ view: 'Grid view' }).all()
   * ```
   */
  base<
    TDefaultFields extends AirtableFieldSet = AirtableFieldSet,
  >(
    baseId: string,
    overrides?: AirtableBaseOptions,
  ): AirtableBase<TDefaultFields> {
    if (!baseId) {
      throw new Error('Airtable.base: baseId is required')
    }
    if (!globalConfig.apiKey) {
      throw new Error(
        'Airtable.base: apiKey must be configured via Airtable.configure(...)',
      )
    }

    const hasRequestSchedulerOverride = hasOwnOption(overrides, 'requestScheduler')
    const hasRateLimiterOverride = hasOwnOption(overrides, 'rateLimiter')

    const options: AirtableClientOptions = {
      apiKey: globalConfig.apiKey,
      baseId,
      apiVersion: globalConfig.apiVersion,
      customHeaders: globalConfig.customHeaders,
      endpointUrl: globalConfig.endpointUrl,
      fetch: globalConfig.fetch,
      noRetryIfRateLimited: globalConfig.noRetryIfRateLimited,
      maxRetries: globalConfig.maxRetries,
      retryInitialDelayMs: globalConfig.retryInitialDelayMs,
      retryOnStatuses: globalConfig.retryOnStatuses,
      recordsCache: overrides?.recordsCache ?? globalConfig.recordsCache,
      observability: overrides?.observability ?? globalConfig.observability,
      requestScheduler: hasRequestSchedulerOverride
        ? overrides.requestScheduler
        : hasRateLimiterOverride
          ? undefined
          : globalConfig.requestScheduler,
      rateLimiter: hasRateLimiterOverride
        ? overrides.rateLimiter
        : hasRequestSchedulerOverride
          ? undefined
          : globalConfig.rateLimiter,
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
