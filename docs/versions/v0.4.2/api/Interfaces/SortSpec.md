# SortSpec

Defined in: [types/records.ts:66](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L66)

Sort specification for a single field when listing records.

## Example

```ts
const sort: SortSpec[] = [
  { field: 'Status', direction: 'asc' },
  { field: 'CreatedAt', direction: 'desc' },
]
```

## Properties

### field

> **field**: `string`

Defined in: [types/records.ts:70](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L70)

Field name or field ID to sort by.

***

### direction?

> `optional` **direction?**: [`SortDirection`](../Type Aliases/SortDirection.md)

Defined in: [types/records.ts:76](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L76)

Sort direction (`"asc"` or `"desc"`).
Defaults to `"asc"` when omitted.
