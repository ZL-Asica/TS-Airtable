import type { AirtableCoreClient } from './core'
import type {
  AirtableRecord,
  CreateRecordInput,
  CreateRecordsOptions,
  CreateRecordsResult,
  DeleteRecordsResult,
  GetRecordParams,
  ListRecordsParams,
  ListRecordsResult,
  UpdateRecordInput,
  UpdateRecordsOptions,
  UpdateRecordsResult,
} from '@/types'
import { MAX_RECORDS_PER_BATCH } from './core'

/**
 * Records API client: list / get / create / update / delete / upsert.
 *
 * This class is composed into `AirtableClient` as `client.records`.
 */
export class AirtableRecordsClient<TDefaultFields = Record<string, unknown>> {
  constructor(private readonly core: AirtableCoreClient) {}

  /**
   * List records from a table (single page).
   *
   * This is a thin wrapper around Airtable's **"List records"** endpoint.
   * If you want to automatically pull all pages, use `client.records.listAllRecords(...)` or `client.records.iterateRecords(...)`.
   *
   * @typeParam TFields - Shape of record fields for this call.
   *   Defaults to `TDefaultFields` specified on the client.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param params - Query parameters such as `view`, `maxRecords`, `filterByFormula`, etc.
   *
   * @returns A single page of records and an optional `offset` cursor.
   *
   * @throws `AirtableError` - If the request fails with a non-2xx status.
   *
   * @example
   * ```ts
   * const page = await client.listRecords('Tasks', {
   *   view: 'Grid view',
   *   pageSize: 50,
   * })
   *
   * for (const record of page.records) {
   *   console.log(record.id, record.fields.Name)
   * }
   * ```
   */
  async listRecords<TFields = TDefaultFields>(
    tableIdOrName: string,
    params?: ListRecordsParams,
  ): Promise<ListRecordsResult<TFields>> {
    const url = this.core.buildTableUrl(
      tableIdOrName,
      undefined,
      this.core.buildListQuery(params),
    )
    return this.core.requestJson<ListRecordsResult<TFields>>(url, { method: 'GET' })
  }

  /**
   * List all records across pages.
   *
   * Internally uses `client.records.listRecords(...)` and follows the returned `offset`
   * cursor until exhaustion, or until `maxRecords` is reached.
   *
   * @typeParam TFields - Shape of record fields for this call.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param params - Same as `client.records.ListRecordsParams` but without `offset`.
   *   You can still specify `maxRecords` to limit the total number
   *   of records returned.
   *
   * @returns An array containing all fetched records.
   *
   * @throws `AirtableError` - If any underlying request fails.
   *
   * @example
   * ```ts
   * const all = await client.listAllRecords('Tasks', {
   *   view: 'Grid view',
   *   maxRecords: 500,
   * })
   * console.log(all.length)
   * ```
   */
  async listAllRecords<TFields = TDefaultFields>(
    tableIdOrName: string,
    params?: Omit<ListRecordsParams, 'offset'>,
  ): Promise<AirtableRecord<TFields>[]> {
    const all: AirtableRecord<TFields>[] = []

    // Do not read offset from params — callers are not supposed to pass it.
    let offset: string | undefined
    const maxRecords = params?.maxRecords

    do {
      const pageParams: ListRecordsParams = {
        ...(params as ListRecordsParams ?? {}),
        offset,
      }

      const page = await this.listRecords<TFields>(tableIdOrName, pageParams)

      all.push(...page.records)

      if (maxRecords != null && all.length >= maxRecords) {
        return all.slice(0, maxRecords)
      }

      offset = page.offset
    } while (offset)

    return all
  }

  /**
   * Iterate over records as an async generator.
   *
   * This is a streaming-style alternative to `client.records.listAllRecords(...)` that
   * can be used to process large tables without loading everything into
   * memory at once.
   *
   * @typeParam TFields - Shape of record fields for this call.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param params - Same as `client.records.ListRecordsParams` but without `offset`.
   *   You can still specify `maxRecords` to stop early.
   *
   * @returns Async generator yielding `AirtableRecord` objects.
   *
   * @throws `AirtableError` - If any underlying request fails.
   *
   * @example
   * ```ts
   * for await (const record of client.iterateRecords('Tasks', { pageSize: 100 })) {
   *   console.log(record.id, record.fields.Name)
   * }
   * ```
   */
  async* iterateRecords<TFields = TDefaultFields>(
    tableIdOrName: string,
    params?: Omit<ListRecordsParams, 'offset'>,
  ): AsyncGenerator<AirtableRecord<TFields>, void, void> {
    let offset: string | undefined
    const maxRecords = params?.maxRecords
    let yielded = 0

    do {
      const pageParams: ListRecordsParams = {
        ...(params as ListRecordsParams ?? {}),
        offset,
      }

      const page = await this.listRecords<TFields>(tableIdOrName, pageParams)

      for (const record of page.records) {
        yield record
        yielded += 1
        if (maxRecords != null && yielded >= maxRecords) {
          return
        }
      }

      offset = page.offset
    } while (offset)
  }

  /**
   * Retrieve a single record by ID.
   *
   * @typeParam TFields - Shape of record fields for this call.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param recordId - Airtable record ID (e.g. `"recXXXXXXXXXXXXXX"`).
   * @param params - Optional display parameters for cell format and locale.
   *
   * @returns The requested record.
   *
   * @throws `AirtableError` - If the record does not exist, or if the request fails.
   *
   * @example
   * ```ts
   * const rec = await client.getRecord('Tasks', 'rec123')
   * console.log(rec.fields.Name)
   * ```
   */
  async getRecord<TFields = TDefaultFields>(
    tableIdOrName: string,
    recordId: string,
    params?: GetRecordParams,
  ): Promise<AirtableRecord<TFields>> {
    const url = this.core.buildTableUrl(
      tableIdOrName,
      recordId,
      this.core.buildGetQuery(params),
    )
    return this.core.requestJson<AirtableRecord<TFields>>(url, { method: 'GET' })
  }

  /**
   * Create one or more records.
   *
   * The Airtable API accepts up to `MAX_RECORDS_PER_BATCH` records
   * per request. This method automatically splits large arrays into
   * multiple batches and flattens the responses.
   *
   * @typeParam TFields - Shape of record fields for this call.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param records - Records to create, each with a `fields` object.
   * @param options - Creation options such as `typecast` and `returnFieldsByFieldId`.
   *
   * @returns A flat list of created records.
   *
   * @throws `AirtableError` - If any batch fails.
   *
   * @example
   * ```ts
   * await client.createRecords('Tasks', [
   *   { fields: { Name: 'Task A' } },
   *   { fields: { Name: 'Task B', Status: 'Todo' } },
   * ])
   * ```
   */
  async createRecords<TFields = TDefaultFields>(
    tableIdOrName: string,
    records: CreateRecordInput<TFields>[],
    options?: CreateRecordsOptions,
  ): Promise<CreateRecordsResult<TFields>> {
    if (!records.length) {
      return { records: [] }
    }

    const created: AirtableRecord<TFields>[] = []
    const query = this.core.buildReturnFieldsQuery(options?.returnFieldsByFieldId)

    for (let i = 0; i < records.length; i += MAX_RECORDS_PER_BATCH) {
      const batch = records.slice(i, i + MAX_RECORDS_PER_BATCH)
      const url = this.core.buildTableUrl(tableIdOrName, undefined, query)

      const body: Record<string, unknown> = { records: batch }
      if (options?.typecast !== undefined) {
        body.typecast = options.typecast
      }

      const resp = await this.core.requestJson<CreateRecordsResult<TFields>>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      created.push(...resp.records)
    }

    return { records: created }
  }

  /**
   * Batch update or upsert records.
   *
   * This uses `PATCH` on the table endpoint and supports Airtable's
   * **performUpsert** option. Requests are automatically split into
   * batches of `MAX_RECORDS_PER_BATCH` records.
   *
   * @typeParam TFields - Shape of record fields for this call.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param records - Records to update (each must include an `id`).
   * @param options - Update options such as `typecast`, `performUpsert`
   *   and `returnFieldsByFieldId`.
   *
   * @returns A `UpdateRecordsResult` that includes:
   *   - `records`: all processed records
   *   - `createdRecords` and `updatedRecords` when `performUpsert` is used
   *
   * @throws `AirtableError` - If any batch fails.
   *
   * @example
   * ```ts
   * await client.updateRecords('Tasks', [
   *   { id: 'rec1', fields: { Status: 'Doing' } },
   *   { id: 'rec2', fields: { Status: 'Done' } },
   * ])
   * ```
   */
  async updateRecords<TFields = TDefaultFields>(
    tableIdOrName: string,
    records: UpdateRecordInput<TFields>[],
    options?: UpdateRecordsOptions,
  ): Promise<UpdateRecordsResult<TFields>> {
    if (!records.length) {
      return { records: [] }
    }

    const allRecords: AirtableRecord<TFields>[] = []
    const createdViaUpsert: AirtableRecord<TFields>[] = []
    const updatedViaUpsert: AirtableRecord<TFields>[] = []
    const query = this.core.buildReturnFieldsQuery(options?.returnFieldsByFieldId)

    for (let i = 0; i < records.length; i += MAX_RECORDS_PER_BATCH) {
      const batch = records.slice(i, i + MAX_RECORDS_PER_BATCH)
      const url = this.core.buildTableUrl(tableIdOrName, undefined, query)

      const body: Record<string, unknown> = { records: batch }
      if (options?.typecast !== undefined) {
        body.typecast = options.typecast
      }
      if (options?.performUpsert) {
        body.performUpsert = options.performUpsert
      }

      const resp = await this.core.requestJson<UpdateRecordsResult<TFields>>(url, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      if (resp.records) {
        allRecords.push(...resp.records)
      }
      if (resp.updatedRecords) {
        updatedViaUpsert.push(...resp.updatedRecords)
      }
      if (resp.createdRecords) {
        createdViaUpsert.push(...resp.createdRecords)
      }
    }

    const result: UpdateRecordsResult<TFields> = { records: allRecords }
    if (createdViaUpsert.length) {
      result.createdRecords = createdViaUpsert
    }
    if (updatedViaUpsert.length) {
      result.updatedRecords = updatedViaUpsert
    }

    return result
  }

  /**
   * Update a single record by ID.
   *
   * This is a convenience wrapper around `PATCH /{table}/{recordId}`.
   *
   * @typeParam TFields - Shape of record fields for this call.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param recordId - Airtable record ID.
   * @param fields - Partial set of fields to update.
   * @param options - Subset of `client.records.UpdateRecordsOptions` without `performUpsert`.
   *
   * @returns The updated record.
   *
   * @throws `AirtableError` - If the update fails.
   */
  async updateRecord<TFields = TDefaultFields>(
    tableIdOrName: string,
    recordId: string,
    fields: Partial<TFields>,
    options?: Omit<UpdateRecordsOptions, 'performUpsert'>,
  ): Promise<AirtableRecord<TFields>> {
    const url = this.core.buildTableUrl(
      tableIdOrName,
      recordId,
      this.core.buildReturnFieldsQuery(options?.returnFieldsByFieldId),
    )

    const body: Record<string, unknown> = { fields }
    if (options?.typecast !== undefined) {
      body.typecast = options.typecast
    }

    return this.core.requestJson<AirtableRecord<TFields>>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  /**
   * Delete a single record by ID.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param recordId - Airtable record ID.
   *
   * @returns An object containing the record ID and a `deleted` flag.
   *
   * @throws `AirtableError` - If the deletion fails.
   */
  async deleteRecord(
    tableIdOrName: string,
    recordId: string,
  ): Promise<{ id: string, deleted: boolean }> {
    const url = this.core.buildTableUrl(tableIdOrName, recordId)
    return this.core.requestJson<{ id: string, deleted: boolean }>(url, {
      method: 'DELETE',
    })
  }

  /**
   * Delete multiple records in batches.
   *
   * This method uses the table-level `DELETE` endpoint and encodes
   * record IDs as `records[]=recXXXX`. Requests are automatically
   * split into batches of `MAX_RECORDS_PER_BATCH`.
   *
   * @param tableIdOrName - Table ID or table name.
   * @param recordIds - List of record IDs to delete.
   *
   * @returns A `DeleteRecordsResult` with per-record deletion status.
   *
   * @throws `AirtableError` - If any batch fails.
   *
   * @example
   * ```ts
   * await client.deleteRecords('Tasks', ['rec1', 'rec2'])
   * ```
   */
  async deleteRecords(
    tableIdOrName: string,
    recordIds: string[],
  ): Promise<DeleteRecordsResult> {
    if (!recordIds.length) {
      return { records: [] }
    }

    const deleted: DeleteRecordsResult['records'] = []

    for (let i = 0; i < recordIds.length; i += MAX_RECORDS_PER_BATCH) {
      const batch = recordIds.slice(i, i + MAX_RECORDS_PER_BATCH)

      const params = new URLSearchParams()
      for (const id of batch) {
        // Airtable expects records[]=recXXXX
        params.append('records[]', id)
      }

      const url = this.core.buildTableUrl(tableIdOrName, undefined, params)
      const resp = await this.core.requestJson<DeleteRecordsResult>(url, {
        method: 'DELETE',
      })
      deleted.push(...resp.records)
    }

    return { records: deleted }
  }
}
