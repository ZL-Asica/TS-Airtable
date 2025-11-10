import type { AirtableClientOptions, AirtableFieldSet } from '@/types'
import { AirtableCoreClient } from './core'
import { AirtableMetadataClient } from './meta-client'
import { AirtableRecordsClient } from './records-client'
import { AirtableWebhooksClient } from './webhooks-client'

/**
 * High-level Airtable Web API client.
 *
 * Composed from:
 * - `AirtableRecordsClient` exposed as `client.records`
 * - `AirtableMetadataClient` exposed as `client.metadata`
 * - `AirtableWebhooksClient` exposed as `client.webhooks`
 *
 * @typeParam TDefaultFields - Default shape of the `fields` object for records
 *   when using `client.records.*` without specifying a more specific type.
 *   Defaults to {@link AirtableFieldSet}.
 *
 * @example
 * ```ts
 * import type { AirtableFieldSet } from 'ts-airtable'
 *
 * interface Task extends AirtableFieldSet {
 *   Name: string
 *   Status?: 'Todo' | 'Doing' | 'Done'
 * }
 *
 * const client = new AirtableClient<Task>({
 *   apiKey: process.env.AIRTABLE_TOKEN!,
 *   baseId: process.env.AIRTABLE_BASE_ID!,
 * })
 *
 * const page = await client.records.listRecords('Tasks', { pageSize: 50 })
 * console.log(page.records[0].fields.Name)
 * ```
 */
export class AirtableClient<
  TDefaultFields extends AirtableFieldSet = AirtableFieldSet,
> {
  /**
   * Low-level HTTP / retry / URL utilities.
   * Exposed in case advanced consumers want direct access.
   */
  readonly core: AirtableCoreClient

  /**
   * Records API (CRUD, pagination, upsert).
   */
  readonly records: AirtableRecordsClient<TDefaultFields>

  /**
   * Metadata API (bases, schema, views).
   */
  readonly metadata: AirtableMetadataClient

  /**
   * Webhooks API.
   */
  readonly webhooks: AirtableWebhooksClient

  constructor(options: AirtableClientOptions) {
    this.core = new AirtableCoreClient(options)
    this.records = new AirtableRecordsClient<TDefaultFields>(
      this.core,
      options.recordsCache,
    )
    this.metadata = new AirtableMetadataClient(this.core)
    this.webhooks = new AirtableWebhooksClient(this.core)
  }
}
