import type { AirtableClient } from '@/client'
import type {
  AirtableClientOptions,
  AirtableFieldSet,
  AirtableRecord,
  CreateRecordInput,
  CreateRecordsOptions,
  CreateRecordsResult,
  DeleteRecordsResult,
  GetRecordParams,
  ListRecordsParams,
  UpdateRecordInput,
  UpdateRecordsOptions,
  UpdateRecordsResult,
} from '@/types'

// -----------------------------------------------------------------------------
// Types for the "Airtable.configure / Airtable.base / base(table).select().all()"
// style API, similar to official airtable.js
// -----------------------------------------------------------------------------

/**
 * Global configuration for the top-level Airtable singleton.
 *
 * This is essentially {@link AirtableClientOptions} without `baseId`, because
 * the base ID is provided later via `Airtable.base(baseId)`.
 *
 * Typical flow:
 *
 * 1. Call `Airtable.configure(config)` with an {@link AirtableGlobalConfig}.
 * 2. Call `const base = Airtable.base('appXXXXXXXXXXXXXX')`.
 * 3. Use `base('Table').select().all()` etc.
 *
 * @example
 * ```ts
 * import Airtable from 'ts-airtable'
 *
 * Airtable.configure({
 *   apiKey: process.env.AIRTABLE_API_KEY!,
 *   endpointUrl: 'https://api.airtable.com', // optional override
 *   fetch: customFetch,                      // optional
 *   recordsCache: {
 *     // optional global records cache
 *     defaultTtlMs: 30_000,
 *   },
 * })
 *
 * const base = Airtable.base<{ Name: string }>('appXXXXXXXXXXXXXX')
 * const records = await base('Contacts').select({ maxRecords: 50 }).all()
 * ```
 */
export type AirtableGlobalConfig = Omit<AirtableClientOptions, 'baseId'>

/**
 * Query object returned by `table.select()`.
 *
 * This mirrors the classic airtable.js `select()` API:
 *
 * - `select(params)` returns an immutable query object.
 * - You then call `.all()` to fetch all pages, or `.firstPage()` to only fetch
 *   the first page of results.
 *
 * The underlying implementation uses the high-level {@link AirtableClient}
 * list APIs under the hood and respects all the filtering, sorting and view
 * parameters passed to `select()`.
 *
 * @typeParam TFields - Shape of the `fields` object on each record. This is
 * usually an object type mapping field names to their values.
 */
export interface AirtableQuery<TFields = AirtableFieldSet> {
  /**
   * Fetch **all** records for this query across all pages.
   *
   * This method will internally follow Airtable's pagination until there are
   * no more pages to fetch, and then concatenate all resulting records into a
   * single array.
   *
   * Be cautious when using this on very large tables: you might pull a lot of
   * data into memory at once.
   *
   * @returns A promise that resolves to an array of {@link AirtableRecord}
   * for the given query.
   *
   * @example
   * ```ts
   * const records = await base('Tasks')
   *   .select({ view: 'Open tasks' })
   *   .all()
   * ```
   */
  all: () => Promise<AirtableRecord<TFields>[]>

  /**
   * Fetch only the **first page** of records for this query.
   *
   * This corresponds to the first page returned by Airtable's list API for the
   * given parameters. Use this when:
   *
   * - You only care about a small subset of records.
   * - You want more control over manual pagination.
   *
   * @returns A promise that resolves to an array of {@link AirtableRecord}
   * representing the first page of results.
   *
   * @example
   * ```ts
   * const firstPage = await base('Tasks')
   *   .select({ maxRecords: 100 })
   *   .firstPage()
   * ```
   */
  firstPage: () => Promise<AirtableRecord<TFields>[]>
}

/**
 * Table wrapper returned by `base('TableName')`.
 *
 * It exposes the most commonly used table-level helpers, mirroring the
 * airtable.js style API:
 *
 * - `select().all()` / `select().firstPage()`
 * - `find`
 * - `create` / `update` / `updateRecord`
 * - `destroy` / `destroyMany`
 *
 * Each method uses the generic type parameter `TFields` to type the `fields`
 * property on returned records.
 *
 * @typeParam TFields - Shape of the `fields` object on each record in this table.
 */
export interface AirtableTable<TFields = AirtableFieldSet> {
  /**
   * Start a query against this table.
   *
   * This is the entry point for the `select().all()` / `select().firstPage()`
   * pattern. The returned {@link AirtableQuery} is immutable; calling `all()`
   * or `firstPage()` reuses the same query parameters.
   *
   * @param params - Query options for listing records. This is the same as
   * {@link ListRecordsParams} but without the `offset` field, because offset
   * is managed internally by `.all()` / `.firstPage()`.
   *
   * @returns An {@link AirtableQuery} that can be used to fetch records.
   *
   * @example
   * ```ts
   * const query = base('Tasks').select({
   *   view: 'Open tasks',
   *   maxRecords: 100,
   * })
   *
   * const records = await query.all()
   * ```
   */
  select: (params?: Omit<ListRecordsParams, 'offset'>) => AirtableQuery<TFields>

  /**
   * Retrieve a single record by ID.
   *
   * This corresponds to the `table.find(recordId, params?)` pattern from
   * airtable.js and uses the underlying `getRecord` API.
   *
   * If the record does not exist or Airtable returns a non-2xx status,
   * the promise rejects with an error.
   *
   * @param recordId - Airtable record ID (e.g. `"recXXXXXXXXXXXXXX"`).
   * @param params - Optional parameters controlling which fields to fetch,
   *   cell format, etc. See {@link GetRecordParams}.
   *
   * @returns A promise that resolves to the requested {@link AirtableRecord}.
   *
   * @example
   * ```ts
   * const record = await base('Tasks').find('recXXXXXXXXXXXXXX')
   * console.log(record.fields.Name)
   * ```
   */
  find: (recordId: string, params?: GetRecordParams) => Promise<AirtableRecord<TFields>>

  /**
   * Create one or more records in this table.
   *
   * This corresponds to `table.create(records, options?)` and uses the
   * underlying `createRecords` API. The `records` array contains objects
   * describing the fields for each new record.
   *
   * @param records - Array of records to create. Each item provides a `fields`
   *   object matching `TFields`. See {@link CreateRecordInput}.
   * @param options - Optional creation options such as `typecast`. See
   *   {@link CreateRecordsOptions}.
   *
   * @returns A promise that resolves to the creation result containing the
   *   newly created records. See {@link CreateRecordsResult}.
   *
   * @example
   * ```ts
   * const result = await base('Tasks').create([
   *   { fields: { Name: 'Buy milk', Done: false } },
   *   { fields: { Name: 'Write docs', Done: false } },
   * ])
   *
   * console.log(result.records[0].id)
   * ```
   */
  create: (
    records: CreateRecordInput<TFields>[],
    options?: CreateRecordsOptions,
  ) => Promise<CreateRecordsResult<TFields>>

  /**
   * Batch update or upsert records in this table.
   *
   * This corresponds to `table.update(records, options?)` and uses the
   * underlying `updateRecords` API. Each record in `records` must contain
   * an `id` and the fields to update.
   *
   * Depending on {@link UpdateRecordsOptions.performUpsert}, this may perform
   * pure updates (by ID) or upserts based on external IDs.
   *
   * @param records - Array of update inputs. See {@link UpdateRecordInput}.
   * @param options - Optional update/upsert options. See
   *   {@link UpdateRecordsOptions}.
   *
   * @returns A promise that resolves to the update result. See
   *   {@link UpdateRecordsResult}.
   *
   * @example
   * ```ts
   * const result = await base('Tasks').update([
   *   { id: 'recXXXXXXXXXXXXXX', fields: { Done: true } },
   * ])
   * ```
   */
  update: (
    records: UpdateRecordInput<TFields>[],
    options?: UpdateRecordsOptions,
  ) => Promise<UpdateRecordsResult<TFields>>

  /**
   * Update a single record by ID.
   *
   * This is a convenience wrapper around the batch {@link AirtableTable.update}
   * method and corresponds to `table.update(recordId, fields, options?)` in
   * airtable.js.
   *
   * @param recordId - Airtable record ID to update.
   * @param fields - Partial `TFields` object containing only the fields you
   *   want to change.
   * @param options - Optional update options, excluding `performUpsert` since
   *   this helper is strictly ID-based. See {@link UpdateRecordsOptions}.
   *
   * @returns A promise that resolves to the updated {@link AirtableRecord}.
   *
   * @example
   * ```ts
   * const updated = await base('Tasks').updateRecord('recXXXXXXXXXXXXXX', {
   *   Done: true,
   * })
   * ```
   */
  updateRecord: (
    recordId: string,
    fields: Partial<TFields>,
    options?: Omit<UpdateRecordsOptions, 'performUpsert'>,
  ) => Promise<AirtableRecord<TFields>>

  /**
   * Delete a single record by ID.
   *
   * This corresponds to `table.destroy(recordId)` in airtable.js and uses the
   * underlying delete-records API with a single ID.
   *
   * @param recordId - Airtable record ID to delete.
   *
   * @returns A promise that resolves to a small result object containing the
   *   deleted record ID and a `deleted` flag.
   *
   * @example
   * ```ts
   * const res = await base('Tasks').destroy('recXXXXXXXXXXXXXX')
   * console.log(res.deleted) // true
   * ```
   */
  destroy: (recordId: string) => Promise<{ id: string, deleted: boolean }>

  /**
   * Delete multiple records by ID.
   *
   * This corresponds to `table.destroy(recordIds)` in airtable.js and uses the
   * underlying batch delete API.
   *
   * @param recordIds - Array of Airtable record IDs to delete.
   *
   * @returns A promise that resolves to a {@link DeleteRecordsResult} describing
   *   which records were deleted.
   *
   * @example
   * ```ts
   * const res = await base('Tasks').destroyMany([
   *   'recAAA...',
   *   'recBBB...',
   * ])
   * ```
   */
  destroyMany: (recordIds: string[]) => Promise<DeleteRecordsResult>
}

/**
 * A base handle returned by `Airtable.base(baseId)`.
 *
 * It behaves like:
 *
 * - A callable function:
 *   - `base('TableName')` → {@link AirtableTable}
 * - An object exposing:
 *   - `id`: the base ID
 *   - `client`: the underlying {@link AirtableClient} bound to that base
 *
 * This mirrors the API of the official airtable.js library while still
 * providing strong TypeScript types for records.
 *
 * @typeParam TDefaultFields - Default `fields` shape for tables accessed
 * through this base when you don't provide a more specific generic at call
 * sites. Defaults to {@link AirtableFieldSet}.
 *
 * @example
 * ```ts
 * import Airtable from 'ts-airtable'
 *
 * Airtable.configure({
 *   apiKey: process.env.AIRTABLE_API_KEY!,
 * })
 *
 * const base = Airtable.base<{ Name: string }>('appXXXXXXXXXXXXXX')
 *
 * const tasks = await base('Tasks')
 *   .select({ view: 'Open tasks' })
 *   .all()
 *
 * console.log(tasks[0].fields.Name)
 *
 * // You can also access the underlying client:
 * const client = base.client
 * const page = await client.records.listRecords('Tasks', { pageSize: 50 })
 * ```
 */
export interface AirtableBase<TDefaultFields extends AirtableFieldSet = AirtableFieldSet> {
  /**
   * Returns a table wrapper for the specified table ID or name.
   *
   * @param tableIdOrName - Airtable table ID or table name as shown in the UI.
   *
   * @returns An {@link AirtableTable} bound to this base and table.
   */
  (tableIdOrName: string): AirtableTable<TDefaultFields>

  /**
   * Base ID this object is bound to (e.g. `"appXXXXXXXXXXXXXX"`).
   */
  readonly id: string

  /**
   * Underlying high-level client for this base.
   *
   * This is the same client you would get by constructing
   * `new AirtableClient({ baseId, ...config })` manually.
   */
  readonly client: AirtableClient<TDefaultFields>
}
