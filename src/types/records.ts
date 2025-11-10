import type { AirtableFieldSet } from './field-values'

/**
 * Generic Airtable record wrapper.
 *
 * @typeParam TFields - Shape of the `fields` object for this record.
 *   By default this is `AirtableFieldSet` (see {@link AirtableFieldSet}).
 *
 * @example
 * ```ts
 * type Task = { Name: string; Done?: boolean }
 *
 * const record: AirtableRecord<Task> = {
 *   id: 'rec123',
 *   createdTime: '2024-10-01T10:00:00.000Z',
 *   fields: { Name: 'Buy milk', Done: false },
 * }
 * ```
 *
 * @example
 * ```ts
 * import type { AirtableFieldSet, AirtableAttachment } from 'ts-airtable'
 *
 * interface TaskFields extends AirtableFieldSet {
 *   Name: string
 *   Attachments?: readonly AirtableAttachment[]
 * }
 *
 * const record: AirtableRecord<TaskFields> = ...
 * ```
 */
export interface AirtableRecord<TFields = AirtableFieldSet> {
  /**
   * Airtable record ID (e.g. `"recXXXXXXXXXXXXXX"`).
   */
  id: string

  /**
   * Creation time of the record as an ISO-8601 string.
   * This field may be omitted if not requested.
   */
  createdTime?: string

  /**
   * Arbitrary structured data stored in the record's fields.
   */
  fields: TFields
}

/**
 * Sorting direction in query parameters.
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Sort specification for a single field when listing records.
 *
 * @example
 * ```ts
 * const sort: SortSpec[] = [
 *   { field: 'Status', direction: 'asc' },
 *   { field: 'CreatedAt', direction: 'desc' },
 * ]
 * ```
 */
export interface SortSpec {
  /**
   * Field name or field ID to sort by.
   */
  field: string

  /**
   * Sort direction (`"asc"` or `"desc"`).
   * Defaults to `"asc"` when omitted.
   */
  direction?: SortDirection
}

/**
 * Available `cellFormat` values for some Airtable endpoints.
 *
 * - `"json"`: structured JSON fields
 * - `"string"`: formatted values as strings
 */
export type CellFormat = 'json' | 'string'

/**
 * Query parameters for the **"List records"** endpoint.
 *
 * These map closely to Airtable's documented query string parameters.
 */
export interface ListRecordsParams {
  /**
   * Maximum total number of records to return.
   *
   * Note: when using `client.records.listAllRecords(...)`, this limit is
   * enforced at the client side by stopping pagination early.
   */
  maxRecords?: number

  /**
   * Maximum number of records per page (1–100).
   *
   * Airtable defaults to 100 if not specified.
   */
  pageSize?: number

  /**
   * Pagination cursor returned from a previous page.
   *
   * You usually do not need to set this manually; use
   * `client.records.listAllRecords(...)` or `client.records.iterateRecords(...)`
   * to handle pagination automatically.
   */
  offset?: string

  /**
   * View name or ID. When provided, the returned records are constrained
   * to that view's configuration and filter.
   */
  view?: string

  /**
   * List of field names or IDs to include in the response.
   *
   * If omitted, all fields in the table may be returned.
   */
  fields?: string[]

  /**
   * Airtable formula used to filter rows (e.g. `"Status = 'Done'"`).
   */
  filterByFormula?: string

  /**
   * Sort specification for one or more fields.
   */
  sort?: SortSpec[]

  /**
   * Format in which cell values should be returned.
   */
  cellFormat?: CellFormat

  /**
   * Time zone ID to use when formatting date/time fields.
   */
  timeZone?: string

  /**
   * Locale identifier to use when formatting values for display.
   */
  userLocale?: string

  /**
   * When `true`, fields in the response are keyed by field ID rather than name.
   */
  returnFieldsByFieldId?: boolean
}

/**
 * Response shape for one page of **"List records"**.
 *
 * @typeParam TFields - Shape of the `fields` object for records in this page.
 */
export interface ListRecordsResult<TFields> {
  /**
   * Records returned in this page.
   */
  records: AirtableRecord<TFields>[]

  /**
   * Pagination cursor. When present, you can pass it as `offset` in the
   * next request to fetch the following page.
   */
  offset?: string
}

/**
 * Query parameters for the **"Retrieve a record"** endpoint.
 *
 * These parameters control how field values are formatted.
 */
export interface GetRecordParams {
  /**
   * Format in which cell values should be returned.
   */
  cellFormat?: CellFormat

  /**
   * Time zone ID to use when formatting date/time fields.
   */
  timeZone?: string

  /**
   * Locale identifier to use when formatting values for display.
   */
  userLocale?: string

  /**
   * When `true`, fields in the response are keyed by field ID rather than name.
   */
  returnFieldsByFieldId?: boolean
}

/**
 * Input shape for creating records.
 *
 * @typeParam TFields - Shape of the `fields` object to create.
 *
 * @example
 * ```ts
 * await client.records.createRecords('Tasks', [
 *   { fields: { Name: 'New task', Status: 'Todo' } },
 * ])
 * ```
 */
export interface CreateRecordInput<TFields> {
  /**
   * Fields to set on the new record.
   */
  fields: TFields
}

/**
 * Options for creating records.
 */
export interface CreateRecordsOptions {
  /**
   * When `true`, Airtable will attempt to coerce provided values into
   * the correct field types.
   *
   * For example, a string may be cast into a date field if it matches
   * the expected format.
   */
  typecast?: boolean

  /**
   * When `true`, fields in the response are keyed by field ID rather than name.
   */
  returnFieldsByFieldId?: boolean
}

/**
 * Response shape for create-records operations.
 *
 * @typeParam TFields - Shape of the `fields` object for created records.
 */
export interface CreateRecordsResult<TFields> {
  /**
   * List of records created in this operation.
   */
  records: AirtableRecord<TFields>[]
}

/**
 * Input shape for updating records in batch.
 *
 * @typeParam TFields - Shape of the `fields` object to update.
 *
 * @example
 * ```ts
 * await client.records.updateRecords('Tasks', [
 *   { id: 'rec1', fields: { Status: 'Done' } },
 * ])
 * ```
 */
export interface UpdateRecordInput<TFields> {
  /**
   * Record ID to update (e.g. `"recXXXXXXXXXXXXXX"`).
   */
  id: string

  /**
   * Partial fields to update. Only the provided keys will be modified.
   */
  fields: Partial<TFields>
}

/**
 * Upsert configuration used with `performUpsert`.
 *
 * This tells Airtable which fields should be considered as "external keys"
 * for detecting existing records to be updated instead of created.
 */
export interface PerformUpsertOptions {
  /**
   * Field names or field IDs to use as external keys.
   *
   * Must contain between 1 and 3 entries (see Airtable docs).
   * Values are matched exactly when determining whether to update or create.
   */
  fieldsToMergeOn: string[]
}

/**
 * Options for batch update / upsert operations.
 */
export interface UpdateRecordsOptions {
  /**
   * When `true`, Airtable will attempt to coerce provided values into
   * the correct field types.
   */
  typecast?: boolean

  /**
   * Upsert configuration specifying which fields should be treated as
   * external keys when matching existing records.
   */
  performUpsert?: PerformUpsertOptions

  /**
   * When `true`, fields in the response are keyed by field ID rather than name.
   */
  returnFieldsByFieldId?: boolean
}

/**
 * Response shape for batch update / upsert operations.
 *
 * @typeParam TFields - Shape of the `fields` object for updated/created records.
 */
export interface UpdateRecordsResult<TFields> {
  /**
   * For regular updates, this is the main array of processed records.
   * For upserts, this may contain all created and updated records.
   */
  records: AirtableRecord<TFields>[]

  /**
   * Subset of `records` that were updated during an upsert operation.
   * Only present when `performUpsert` is used.
   */
  updatedRecords?: AirtableRecord<TFields>[]

  /**
   * Subset of `records` that were created during an upsert operation.
   * Only present when `performUpsert` is used.
   */
  createdRecords?: AirtableRecord<TFields>[]
}

/**
 * Response shape for batch delete operations.
 */
export interface DeleteRecordsResult {
  /**
   * Per-record deletion status.
   *
   * Airtable reports whether each requested record was successfully deleted.
   */
  records: Array<{
    /**
     * Record ID that was targeted by the delete operation.
     */
    id: string
    /**
     * Indicates whether the record was successfully deleted.
     */
    deleted: boolean
  }>
}

/**
 * Strongly typed sort parameter that uses `keyof TFields` for the field name.
 *
 * This mirrors the `SortParameter<TFields>` type from the official `airtable`
 * package, but is defined in terms of {@link SortDirection}.
 *
 * @typeParam TFields - Field set shape whose keys are valid sort fields.
 */
export interface AirtableSortParameter<TFields> {
  /**
   * Field name (or ID) to sort by, constrained to keys of {@link TFields}.
   */
  field: keyof TFields

  /**
   * Sort direction (`"asc"` or `"desc"`). Defaults to `"asc"`.
   */
  direction?: SortDirection
}

/**
 * Generic, strongly typed variant of {@link ListRecordsParams}.
 *
 * This mirrors the `QueryParams<TFields>` type from the official `airtable`
 * package by:
 *
 * - using `keyof TFields` for `fields`
 * - using {@link AirtableSortParameter} for `sort`
 *
 * All other properties map directly to {@link ListRecordsParams}.
 *
 * @typeParam TFields - Field set shape whose keys are valid field names.
 */
export interface AirtableQueryParams<TFields>
  extends Omit<ListRecordsParams, 'fields' | 'sort'> {
  /**
   * Subset of `TFields` keys to include in the response.
   */
  fields?: (keyof TFields)[]

  /**
   * Sort specification using keys of `TFields`.
   */
  sort?: AirtableSortParameter<TFields>[]

  /**
   * Extra properties kept for compatibility with the official `airtable`
   * client. They are accepted at the type level but are not interpreted
   * by this library.
   */
  method?: string
  recordMetadata?: string[]
}

/**
 * Record shape used in some higher level helpers, compatible with the
 * `RecordData<TFields>` type from the official client.
 *
 * It is essentially an {@link AirtableRecord} plus an optional
 * `commentCount` property.
 *
 * @typeParam TFields - Shape of the `fields` object for this record.
 */
export interface AirtableRecordData<TFields> extends AirtableRecord<TFields> {
  /**
   * Optional number of comments associated with this record, when returned
   * by endpoints that include comment metadata.
   */
  commentCount?: number
}
