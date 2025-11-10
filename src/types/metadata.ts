/**
 * Basic information about a base returned by the "List bases" endpoint.
 *
 * See Airtable "List bases" Web API docs.
 */
export interface AirtableBaseSummary {
  /**
   * Base ID, e.g. "appXXXXXXXXXXXXXX".
   */
  id: string

  /**
   * Human-readable name of the base as shown in the Airtable UI.
   */
  name: string

  /**
   * Permission level of the current token for this base,
   * e.g. "editor", "creator", "read" etc.
   */
  permissionLevel: string

  /**
   * Future-compatible catch-all for additional fields.
   */
  [key: string]: unknown
}

/**
 * Query parameters for "List bases" endpoint.
 *
 * You normally only need to pass the `offset` returned
 * from a previous page.
 */
export interface ListBasesParams {
  /**
   * Pagination cursor returned from a previous call to listBases.
   */
  offset?: string
}

/**
 * Response shape for one page of "List bases".
 */
export interface ListBasesResult {
  bases: AirtableBaseSummary[]
  /**
   * When present, you can pass this `offset` to fetch the next page.
   */
  offset?: string
}

/**
 * Schema for a single field in the "Get base schema" / Table model.
 *
 * This is intentionally lightweight but future-compatible.
 */
export interface AirtableFieldSchema {
  /**
   * Field ID, e.g. "fldXXXXXXXXXXXXXX".
   */
  id: string

  /**
   * Field type, e.g. "singleLineText", "number", "singleSelect", ...
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
   * Type-specific options, as documented in Airtable "Field model".
   * For example, select options, precision, etc.
   */
  options?: Record<string, unknown>

  /**
   * Future-compatible catch-all for additional fields.
   */
  [key: string]: unknown
}

/**
 * Schema for a single view in the "Get base schema" / View model.
 */
export interface AirtableViewSchema {
  /**
   * View ID, e.g. "viwXXXXXXXXXXXXXX".
   */
  id: string

  /**
   * View type, e.g. "grid", "calendar", "form", ...
   */
  type: string

  /**
   * Human-readable view name.
   */
  name: string

  /**
   * Future-compatible catch-all for additional fields.
   */
  [key: string]: unknown
}

/**
 * Schema for a single table in "Get base schema".
 */
export interface AirtableTableSchema {
  /**
   * Table ID, e.g. "tblXXXXXXXXXXXXXX".
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
   * Future-compatible catch-all for additional fields.
   */
  [key: string]: unknown
}

/**
 * Schema for all tables in a base, as returned by "Get base schema".
 */
export interface AirtableBaseSchema {
  tables: AirtableTableSchema[]

  /**
   * Future-compatible catch-all for additional fields.
   */
  [key: string]: unknown
}

/**
 * Metadata for a single view, as returned by "Get view metadata".
 *
 * In practice this has the same core shape as AirtableViewSchema,
 * but may include additional fields depending on the view type.
 */
export type AirtableViewMetadata = AirtableViewSchema
