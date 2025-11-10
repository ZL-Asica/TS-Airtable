/**
 * @module types
 *
 * Exports all type definitions for the Airtable TS library.
 */

import type {
  AirtableBase,
  AirtableQuery,
  AirtableTable,
} from './airtable'
import type {
  AirtableAttachment,
  AirtableCollaborator,
  AirtableFieldSet,
  AirtableThumbnail,
} from './field-values'
import type {
  AirtableQueryParams,
  AirtableRecord,
  AirtableRecordData,
  AirtableSortParameter,
} from './records'
import type { AirtableError } from '@/errors'

export * from './airtable'
export * from './cache-store'
export * from './client'
export * from './errors'
export * from './field-values'
export * from './metadata'
export * from './records'
export * from './webhook'
export { AirtableError } from '@/errors'

/**
 * Short alias for {@link AirtableBase}, matching the official `airtable` type name.
 *
 * In most new code we recommend using `AirtableBase`, but `Base` is provided
 * for easier migration from `airtable`.
 */
export type Base = AirtableBase

/**
 * Short alias for {@link AirtableError}, matching the official `airtable` type name.
 *
 * Note: this shadows the global `Error` type only within the `ts-airtable`
 * import namespace. It does not modify the global `Error`.
 */
export type Error = AirtableError

/**
 * Compatibility aliases matching the official `airtable` package.
 *
 * These names are kept short on purpose so that migrating code can often
 * switch from:
 *
 *   import { FieldSet, Record } from 'airtable'
 *
 * to:
 *
 *   import { FieldSet, Record } from 'ts-airtable'
 *
 * with minimal changes.
 */
export type FieldSet = AirtableFieldSet
export type Collaborator = AirtableCollaborator
export type Attachment = AirtableAttachment
export type Thumbnail = AirtableThumbnail

export type Table<TFields extends AirtableFieldSet> = AirtableTable<TFields>
export type Query<TFields extends AirtableFieldSet> = AirtableQuery<TFields>

/**
 * Single record wrapper, compatible with the official `Record<TFields>` type.
 */
export type Record<TFields extends AirtableFieldSet> = AirtableRecord<TFields>

/**
 * Record + metadata, compatible with the official `RecordData<TFields>` type.
 */
export type RecordData<TFields extends AirtableFieldSet> = AirtableRecordData<TFields>

/**
 * Readonly list of records, compatible with the official `Records<TFields>` type.
 */
export type Records<TFields extends AirtableFieldSet> = ReadonlyArray<Record<TFields>>

/**
 * Generic sort parameter, compatible with the official
 * `SortParameter<TFields>` type.
 */
export type SortParameter<TFields> = AirtableSortParameter<TFields>

/**
 * Generic query options type, compatible with the official
 * `QueryParams<TFields>` type.
 */
export type QueryParams<TFields> = AirtableQueryParams<TFields>

/**
 * Select options type, compatible with the official
 * `SelectOptions<TFields>` alias.
 *
 * In the official client this is essentially the same as `QueryParams<TFields>`,
 * so we mirror that here.
 */
export type SelectOptions<TFields extends AirtableFieldSet> = AirtableQueryParams<TFields>
