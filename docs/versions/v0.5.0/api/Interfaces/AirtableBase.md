# AirtableBase()

Defined in: [types/airtable.ts:356](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/airtable.ts#L356)

A base handle returned by `Airtable.base(baseId)`.

It behaves like:

- A callable function:
  - `base('TableName')` → [AirtableTable](AirtableTable.md)
- An object exposing:
  - `id`: the base ID
  - `client`: the underlying [AirtableClient](../Classes/AirtableClient.md) bound to that base

This mirrors the API of the official airtable.js library while still
providing strong TypeScript types for records.

## Example

```ts
import Airtable from 'ts-airtable'

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
})

const base = Airtable.base<{ Name: string }>('appXXXXXXXXXXXXXX')

const tasks = await base('Tasks')
  .select({ view: 'Open tasks' })
  .all()

console.log(tasks[0].fields.Name)

// You can also access the underlying client:
const client = base.client
const page = await client.records.listRecords('Tasks', { pageSize: 50 })
```

## Type Parameters

### TDefaultFields

`TDefaultFields` *extends* [`AirtableFieldSet`](AirtableFieldSet.md) = [`AirtableFieldSet`](AirtableFieldSet.md)

Default `fields` shape for tables accessed
through this base when you don't provide a more specific generic at call
sites. Defaults to [AirtableFieldSet](AirtableFieldSet.md).

> **AirtableBase**(`tableIdOrName`): [`AirtableTable`](AirtableTable.md)\<`TDefaultFields`\>

Defined in: [types/airtable.ts:364](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/airtable.ts#L364)

Returns a table wrapper for the specified table ID or name.

## Parameters

### tableIdOrName

`string`

Airtable table ID or table name as shown in the UI.

## Returns

[`AirtableTable`](AirtableTable.md)\<`TDefaultFields`\>

An [AirtableTable](AirtableTable.md) bound to this base and table.

## Properties

### id

> `readonly` **id**: `string`

Defined in: [types/airtable.ts:369](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/airtable.ts#L369)

Base ID this object is bound to (e.g. `"appXXXXXXXXXXXXXX"`).

***

### client

> `readonly` **client**: [`AirtableClient`](../Classes/AirtableClient.md)\<`TDefaultFields`\>

Defined in: [types/airtable.ts:377](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/airtable.ts#L377)

Underlying high-level client for this base.

This is the same client you would get by constructing
`new AirtableClient({ baseId, ...config })` manually.
