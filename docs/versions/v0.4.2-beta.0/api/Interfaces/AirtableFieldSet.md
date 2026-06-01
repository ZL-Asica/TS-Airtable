# AirtableFieldSet

Defined in: [types/field-values.ts:165](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/field-values.ts#L165)

Generic, loosely-typed field set compatible with the official
`airtable` package's `FieldSet` type.

Each key represents a field name, and its value represents the
**runtime shape** of that field as returned by the Airtable API.

It is intentionally broad and covers:

- primitive scalar values:
  - `string`  – text, single line, rich text, dates (as ISO strings), etc.
  - `number`  – numeric fields
  - `boolean` – checkbox fields
- null / empty-ish values
- structured field-specific objects
- arrays from linked records, multi-selects, attachments, lookups and rollups

This type is mainly useful as a **base** or fallback shape when
migrating from the official `airtable` client or when you don't want
to fully model your schema.

In most real-world code you will want to **extend** it and narrow
specific fields:

## Example

```ts
import type {
  AirtableFieldSet,
  AirtableAttachment,
} from 'ts-airtable'

interface TaskFields extends AirtableFieldSet {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
  Attachments?: readonly AirtableAttachment[]
}

const base = Airtable.base<TaskFields>(process.env.AIRTABLE_BASE_ID!)
const records = await base('Tasks').select().all()

// `records[0].fields.Attachments` now has a strongly typed shape
```

## Indexable

> \[`key`: `string`\]: [`AirtableFieldValue`](../Type Aliases/AirtableFieldValue.md)

Field name → runtime cell value mapping.

Keys are field names exactly as they appear in Airtable. Values are
intentionally broad to cover the common Airtable cell types. For a
stricter schema, create your own interface that extends this one.
