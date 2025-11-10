import type { AirtableCoreClient } from './core'
import type {
  AirtableBaseSchema,
  AirtableBaseSummary,
  AirtableTableSchema,
  AirtableViewMetadata,
  ListBasesParams,
  ListBasesResult,
} from '@/types'

/**
 * Metadata API client: list bases, base schema, table schema, view metadata.
 *
 * Composed into `AirtableClient` as `client.metadata`.
 */
export class AirtableMetadataClient {
  constructor(private readonly core: AirtableCoreClient) {}

  /**
   * List bases accessible by the current API key / token.
   *
   * Thin wrapper around the "List bases" metadata endpoint.
   * This is useful when you want to build UI that lets a user
   * pick a base, or implement your own "base picker".
   *
   * @param params Optional pagination options (mainly `offset`).
   * @returns A single page of bases and an optional `offset`
   *          for fetching the next page.
   *
   * @example
   * ```ts
   * const meta = await client.metadata.listBases()
   * for (const base of meta.bases) {
   *   console.log(base.id, base.name, base.permissionLevel)
   * }
   * ```
   */
  async listBases(params?: ListBasesParams): Promise<ListBasesResult> {
    const search = new URLSearchParams()
    if (params?.offset) {
      search.set('offset', params.offset)
    }

    const url = this.core.buildMetaUrl('/bases', search)
    return this.core.requestJson<ListBasesResult>(url, { method: 'GET' })
  }

  /**
   * Convenience helper that walks all pages of `listBases`
   * and returns a flat array of all bases.
   *
   * This will keep requesting pages until the API stops
   * returning an `offset` cursor.
   *
   * @returns All bases visible to the current token.
   *
   * @example
   * ```ts
   * const bases = await client.metadata.listAllBases()
   * const first = bases[0]
   * ```
   */
  async listAllBases(): Promise<AirtableBaseSummary[]> {
    const all: AirtableBaseSummary[] = []
    let offset: string | undefined

    do {
      const page = await this.listBases(offset ? { offset } : undefined)
      all.push(...page.bases)
      offset = page.offset
    } while (offset)

    return all
  }

  /**
   * Fetch schema (tables, fields, views) for a base using
   * the "Get base schema" metadata endpoint.
   *
   * By default this uses the base bound to this client, but
   * you can also pass a different `baseId` if your token has
   * access to multiple bases.
   *
   * @param baseId Optional base ID. Defaults to the client's `baseId`.
   * @returns Base-wide schema: tables, fields and views.
   *
   * @example
   * ```ts
   * const schema = await client.metadata.getBaseSchema()
   * const table = schema.tables[0]
   * console.log(table.name, table.fields.length)
   * ```
   */
  async getBaseSchema(baseId?: string): Promise<AirtableBaseSchema> {
    const effectiveBaseId = baseId ?? this.core.baseId
    if (!effectiveBaseId) {
      throw new Error('AirtableMetadataClient: baseId is required for getBaseSchema')
    }

    const encodedBaseId = encodeURIComponent(effectiveBaseId)
    const url = this.core.buildMetaUrl(`/bases/${encodedBaseId}/tables`)
    return this.core.requestJson<AirtableBaseSchema>(url, { method: 'GET' })
  }

  /**
   * Convenience helper to fetch the schema for a single table
   * by ID or by name.
   *
   * Internally this calls `getBaseSchema` and then finds the
   * matching table, so it costs one full schema request.
   *
   * @param tableIdOrName Table ID (`tblXXXX`) or table name.
   * @param baseId Optional base ID. Defaults to the client's `baseId`.
   * @returns The matching table schema, or `undefined` if not found.
   *
   * @example
   * ```ts
   * const projects = await client.metadata.getTableSchema('Projects')
   * if (projects) {
   *   console.log(projects.fields.map(f => f.name))
   * }
   * ```
   */
  async getTableSchema(
    tableIdOrName: string,
    baseId?: string,
  ): Promise<AirtableTableSchema | undefined> {
    const schema = await this.getBaseSchema(baseId)
    return schema.tables.find(
      table => table.id === tableIdOrName || table.name === tableIdOrName,
    )
  }

  /**
   * Fetch metadata for a single view using the "Get view metadata"
   * endpoint.
   *
   * You can use either the view ID or name. If `baseId` is not
   * provided, the client-level `baseId` will be used.
   *
   * @param viewIdOrName View ID (`viwXXXX`) or view name.
   * @param baseId Optional base ID. Defaults to the client's `baseId`.
   * @returns View metadata, including type and name.
   *
   * @example
   * ```ts
   * const view = await client.metadata.getViewMetadata('All tasks')
   * console.log(view.id, view.type)
   * ```
   */
  async getViewMetadata(
    viewIdOrName: string,
    baseId?: string,
  ): Promise<AirtableViewMetadata> {
    const effectiveBaseId = baseId ?? this.core.baseId
    if (!effectiveBaseId) {
      throw new Error('AirtableMetadataClient: baseId is required for getViewMetadata')
    }

    const encodedBaseId = encodeURIComponent(effectiveBaseId)
    const encodedView = encodeURIComponent(viewIdOrName)
    const url = this.core.buildMetaUrl(`/bases/${encodedBaseId}/views/${encodedView}`)

    return this.core.requestJson<AirtableViewMetadata>(url, { method: 'GET' })
  }
}
