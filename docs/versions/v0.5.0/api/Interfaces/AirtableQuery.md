# AirtableQuery

Defined in: [types/airtable.ts:71](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/airtable.ts#L71)

Query object returned by `table.select()`.

This mirrors the classic airtable.js `select()` API:

- `select(params)` returns an immutable query object.
- You then call `.all()` to fetch all pages, or `.firstPage()` to only fetch
  the first page of results.

The underlying implementation uses the high-level [AirtableClient](../Classes/AirtableClient.md)
list APIs under the hood and respects all the filtering, sorting and view
parameters passed to `select()`.

## Type Parameters

### TFields

`TFields` = [`AirtableFieldSet`](AirtableFieldSet.md)

Shape of the `fields` object on each record. This is
usually an object type mapping field names to their values.

## Properties

### all

> **all**: () => `Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>[]\>

Defined in: [types/airtable.ts:92](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/airtable.ts#L92)

Fetch **all** records for this query across all pages.

This method will internally follow Airtable's pagination until there are
no more pages to fetch, and then concatenate all resulting records into a
single array.

Be cautious when using this on very large tables: you might pull a lot of
data into memory at once.

#### Returns

`Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>[]\>

A promise that resolves to an array of [AirtableRecord](AirtableRecord.md)
for the given query.

#### Example

```ts
const records = await base('Tasks')
  .select({ view: 'Open tasks' })
  .all()
```

***

### firstPage

> **firstPage**: () => `Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>[]\>

Defined in: [types/airtable.ts:113](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/airtable.ts#L113)

Fetch only the **first page** of records for this query.

This corresponds to the first page returned by Airtable's list API for the
given parameters. Use this when:

- You only care about a small subset of records.
- You want more control over manual pagination.

#### Returns

`Promise`\<[`AirtableRecord`](AirtableRecord.md)\<`TFields`\>[]\>

A promise that resolves to an array of [AirtableRecord](AirtableRecord.md)
representing the first page of results.

#### Example

```ts
const firstPage = await base('Tasks')
  .select({ maxRecords: 100 })
  .firstPage()
```
