/**
 * Represents a single thumbnail rendition of an attachment image.
 *
 * Airtable automatically generates multiple thumbnail sizes for image
 * attachments (e.g. small / large / full). Each rendition has its own
 * URL and dimensions.
 *
 * This matches the shape exported by the official `airtable` package.
 */
export interface AirtableThumbnail {
  /**
   * Public URL of this thumbnail rendition.
   */
  url: string

  /**
   * Width of the thumbnail image in pixels.
   */
  width: number

  /**
   * Height of the thumbnail image in pixels.
   */
  height: number
}

/**
 * Attachment object used by Airtable for fields of type `"attachment"`.
 *
 * For image attachments, Airtable also provides pre-generated thumbnails
 * under the `thumbnails` property. Non-image attachments (e.g. PDFs) may
 * omit `thumbnails`.
 *
 * This interface intentionally mirrors the shape used by the official
 * `airtable` package.
 */
export interface AirtableAttachment {
  /**
   * Unique identifier of the attachment in Airtable.
   */
  id: string

  /**
   * Direct URL for downloading / viewing the attachment.
   */
  url: string

  /**
   * Original filename of the uploaded attachment.
   */
  filename: string

  /**
   * File size in bytes.
   */
  size: number

  /**
   * MIME type of the attachment (e.g. `"image/png"`, `"application/pdf"`).
   */
  type: string

  /**
   * Optional set of thumbnail renditions for image attachments.
   *
   * - `small` – smallest rendition (fastest to load)
   * - `large` – larger rendition suitable for previews
   * - `full` – usually matches the original image dimensions
   */
  thumbnails?: {
    small: AirtableThumbnail
    large: AirtableThumbnail
    full: AirtableThumbnail
  }
}

/**
 * Collaborator object used by fields of type `"collaborator"`.
 *
 * This matches the shape exported by the official `airtable` package and
 * is typically used for:
 *
 * - single collaborator fields
 * - multi-collaborator / users fields (as arrays of collaborators)
 */
export interface AirtableCollaborator {
  /**
   * Unique identifier of the collaborator in Airtable.
   */
  id: string

  /**
   * Email address of the collaborator.
   */
  email: string

  /**
   * Display name of the collaborator.
   */
  name: string
}

/**
 * Broad runtime value shape for Airtable cells.
 *
 * Airtable can return primitives, `null`, arrays from lookup/rollup fields,
 * attachment/collaborator objects, and other structured field-specific
 * objects such as barcode values.
 */
export type AirtableFieldValue
  = | undefined
    | null
    | string
    | number
    | boolean
    | AirtableAttachment
    | AirtableCollaborator
    | AirtableThumbnail
    | Record<string, unknown>
    | readonly unknown[]

/**
 * Generic, loosely-typed field set compatible with the official
 * `airtable` package's `FieldSet` type.
 *
 * Each key represents a field name, and its value represents the
 * **runtime shape** of that field as returned by the Airtable API.
 *
 * It is intentionally broad and covers:
 *
 * - primitive scalar values:
 *   - `string`  – text, single line, rich text, dates (as ISO strings), etc.
 *   - `number`  – numeric fields
 *   - `boolean` – checkbox fields
 * - null / empty-ish values
 * - structured field-specific objects
 * - arrays from linked records, multi-selects, attachments, lookups and rollups
 *
 * This type is mainly useful as a **base** or fallback shape when
 * migrating from the official `airtable` client or when you don't want
 * to fully model your schema.
 *
 * In most real-world code you will want to **extend** it and narrow
 * specific fields:
 *
 * @example Narrowing specific fields while keeping a flexible base
 * ```ts
 * import type {
 *   AirtableFieldSet,
 *   AirtableAttachment,
 * } from 'ts-airtable'
 *
 * interface TaskFields extends AirtableFieldSet {
 *   Name: string
 *   Status?: 'Todo' | 'Doing' | 'Done'
 *   Attachments?: readonly AirtableAttachment[]
 * }
 *
 * const base = Airtable.base<TaskFields>(process.env.AIRTABLE_BASE_ID!)
 * const records = await base('Tasks').select().all()
 *
 * // `records[0].fields.Attachments` now has a strongly typed shape
 * ```
 */
export interface AirtableFieldSet {
  /**
   * Field name → runtime cell value mapping.
   *
   * Keys are field names exactly as they appear in Airtable. Values are
   * intentionally broad to cover the common Airtable cell types. For a
   * stricter schema, create your own interface that extends this one.
   */
  [key: string]: AirtableFieldValue
}
