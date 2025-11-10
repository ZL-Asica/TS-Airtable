import type { AirtableClient } from '@/client'
import type {
  AirtableClientOptions,
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
 * This is essentially AirtableClientOptions without `baseId`,
 * because the base id is provided later via Airtable.base().
 */
export type AirtableGlobalConfig = Omit<AirtableClientOptions, 'baseId'>

/**
 * Query object returned by table.select().
 *
 * You can call .all() to fetch all pages, or .firstPage() for a single page.
 */
export interface AirtableQuery<TFields> {
  /**
   * Fetch all records for this query across all pages.
   */
  all: () => Promise<AirtableRecord<TFields>[]>

  /**
   * Fetch only the first page of records.
   */
  firstPage: () => Promise<AirtableRecord<TFields>[]>
}

/**
 * Table wrapper returned by base('TableName').
 *
 * It exposes the most commonly used table-level helpers:
 * - select().all() / select().firstPage()
 * - find
 * - create / update / updateRecord
 * - destroy / destroyMany
 */
export interface AirtableTable<TFields> {
  /**
   * Start a query against this table.
   *
   * @param params - Same as ListRecordsParams but without `offset`.
   */
  select: (params?: Omit<ListRecordsParams, 'offset'>) => AirtableQuery<TFields>

  /**
   * Retrieve a single record by id.
   */
  find: (recordId: string, params?: GetRecordParams) => Promise<AirtableRecord<TFields>>

  /**
   * Create one or more records in this table.
   */
  create: (
    records: CreateRecordInput<TFields>[],
    options?: CreateRecordsOptions,
  ) => Promise<CreateRecordsResult<TFields>>

  /**
   * Batch update / upsert records in this table.
   */
  update: (
    records: UpdateRecordInput<TFields>[],
    options?: UpdateRecordsOptions,
  ) => Promise<UpdateRecordsResult<TFields>>

  /**
   * Update a single record by id.
   */
  updateRecord: (
    recordId: string,
    fields: Partial<TFields>,
    options?: Omit<UpdateRecordsOptions, 'performUpsert'>,
  ) => Promise<AirtableRecord<TFields>>

  /**
   * Delete a single record by id.
   */
  destroy: (recordId: string) => Promise<{ id: string, deleted: boolean }>

  /**
   * Delete multiple records by id.
   */
  destroyMany: (recordIds: string[]) => Promise<DeleteRecordsResult>
}

/**
 * A base handle returned by Airtable.base(baseId).
 *
 * It is both:
 * - a callable function: base('TableName') => AirtableTable<TFields>
 * - and an object with `id` and the underlying AirtableClient instance.
 */
export interface AirtableBase<TDefaultFields> {
  (tableIdOrName: string): AirtableTable<TDefaultFields>

  /**
   * Base id this object is bound to.
   */
  readonly id: string

  /**
   * Underlying high-level client for this base.
   */
  readonly client: AirtableClient<TDefaultFields>
}
