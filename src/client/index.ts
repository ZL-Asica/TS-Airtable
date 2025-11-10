import type { AirtableClientOptions } from '@/types'
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
 * @example
 * ```ts
 * type Task = {
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
export class AirtableClient<TDefaultFields = Record<string, unknown>> {
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
    this.records = new AirtableRecordsClient<TDefaultFields>(this.core)
    this.metadata = new AirtableMetadataClient(this.core)
    this.webhooks = new AirtableWebhooksClient(this.core)
  }
}
