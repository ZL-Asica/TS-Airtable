# AirtableSortParameter

Defined in: [types/records.ts:393](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L393)

Strongly typed sort parameter that uses `keyof TFields` for the field name.

This mirrors the `SortParameter<TFields>` type from the official `airtable`
package, but is defined in terms of [SortDirection](../Type Aliases/SortDirection.md).

## Type Parameters

### TFields

`TFields`

Field set shape whose keys are valid sort fields.

## Properties

### field

> **field**: keyof `TFields`

Defined in: [types/records.ts:397](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L397)

Field name (or ID) to sort by, constrained to keys of [TFields](#tfields).

***

### direction?

> `optional` **direction?**: [`SortDirection`](../Type Aliases/SortDirection.md)

Defined in: [types/records.ts:402](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L402)

Sort direction (`"asc"` or `"desc"`). Defaults to `"asc"`.
