/**
 * Basic information about a base returned by the **"List bases"** metadata endpoint.
 *
 * See Airtable Web API docs: "List bases".
 */
export interface AirtableBaseSummary {
  /**
   * Base ID, e.g. `"appXXXXXXXXXXXXXX"`.
   */
  id: string

  /**
   * Human-readable name of the base as shown in the Airtable UI.
   */
  name: string

  /**
   * Permission level of the current token for this base,
   * e.g. `"read"`, `"editor"`, `"creator"`, etc.
   */
  permissionLevel: string

  /**
   * Future-compatible bag of additional properties.
   *
   * Airtable may add more fields over time; they will appear here as `unknown`.
   * If you need stricter typing, intersect this interface with your own type.
   */
  [key: string]: unknown
}

/**
 * Query parameters for the **"List bases"** metadata endpoint.
 *
 * You normally only need to pass the `offset` returned
 * from a previous page.
 */
export interface ListBasesParams {
  /**
   * Pagination cursor returned from a previous call to `listBases`.
   */
  offset?: string
}

/**
 * Response shape for a single page of **"List bases"**.
 */
export interface ListBasesResult {
  /**
   * Bases visible to the current token for this page.
   */
  bases: AirtableBaseSummary[]

  /**
   * When present, you can pass this `offset` to fetch the next page.
   */
  offset?: string
}

/**
 * Schema for a single field in the **"Get base schema"** field model.
 *
 * This is intentionally lightweight and keeps `options` as a loose
 * `Record<string, unknown>` so it remains future-compatible with Airtable
 * adding more field types / configuration.
 */
export interface AirtableFieldSchema {
  /**
   * Field ID, e.g. `"fldXXXXXXXXXXXXXX"`.
   */
  id: string

  /**
   * Field type, e.g. `"singleLineText"`, `"number"`, `"singleSelect"`, ...
   */
  type: string

  /**
   * Human-readable field name.
   */
  name: string

  /**
   * Optional description configured in Airtable.
   */
  description?: string

  /**
   * Type-specific options, as documented in Airtable's "Field model".
   *
   * Examples:
   * - select options
   * - number precision
   * - date/time format
   */
  options?: Record<string, unknown>

  /**
   * Future-compatible bag of additional properties.
   */
  [key: string]: unknown
}

/**
 * Schema for a single view in the **"Get base schema"** view model.
 */
export interface AirtableViewSchema {
  /**
   * View ID, e.g. `"viwXXXXXXXXXXXXXX"`.
   */
  id: string

  /**
   * View type, e.g. `"grid"`, `"calendar"`, `"form"`, ...
   */
  type: string

  /**
   * Human-readable view name.
   */
  name: string

  /**
   * Future-compatible bag of additional properties.
   */
  [key: string]: unknown
}

/**
 * Schema for a single table in **"Get base schema"**.
 */
export interface AirtableTableSchema {
  /**
   * Table ID, e.g. `"tblXXXXXXXXXXXXXX"`.
   */
  id: string

  /**
   * ID of the primary field for this table.
   */
  primaryFieldId: string

  /**
   * Human-readable table name.
   */
  name: string

  /**
   * Optional description configured in Airtable.
   */
  description?: string

  /**
   * All fields in this table.
   */
  fields: AirtableFieldSchema[]

  /**
   * All views defined on this table.
   */
  views: AirtableViewSchema[]

  /**
   * Future-compatible bag of additional properties.
   */
  [key: string]: unknown
}

/**
 * Schema for all tables in a base, as returned by **"Get base schema"**.
 */
export interface AirtableBaseSchema {
  /**
   * Tables defined in the base.
   */
  tables: AirtableTableSchema[]

  /**
   * Future-compatible bag of additional properties.
   */
  [key: string]: unknown
}

/**
 * Metadata for a single view, as returned by **"Get view metadata"**.
 *
 * In practice this has the same core shape as {@link AirtableViewSchema},
 * but may include additional fields depending on the view type.
 */
export type AirtableViewMetadata = AirtableViewSchema
