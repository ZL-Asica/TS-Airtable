---
title: Records API
description: Learn how to use the Records API in Airtable TS to list, create, update, and delete records.
---

# Records API

The **records API** is where you’ll spend most of your time: listing, creating, updating and deleting records.

You can use it via:

- the façade: `Airtable.base(...)(tableName)`
- the low-level client: `client.records`

Caching for reads (`listRecords`, `listAllRecords`, `iterateRecords`, `getRecord`) is **optional**.
This page focuses on the core API; for caching details, see [Caching](./caching.md).

## Listing records

### Single page

**Façade:**

```ts
const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!)

const records = await base('Tasks')
  .select({
    view: 'Grid view',
    pageSize: 50,
  })
  .firstPage()

for (const record of records) {
  console.log(record.id, record.fields.Name)
}
```

**Low-level client:**

```ts
const page = await client.records.listRecords<Task>('Tasks', {
  view: 'Grid view',
  pageSize: 50,
})

for (const record of page.records) {
  console.log(record.id, record.fields.Name)
}
```

`ListRecordsParams` (simplified):

```ts
interface ListRecordsParams {
  maxRecords?: number
  pageSize?: number
  offset?: string
  view?: string
  fields?: string[]
  filterByFormula?: string
  sort?: { field: string; direction?: 'asc' | 'desc' }[]
  cellFormat?: 'json' | 'string'
  timeZone?: string
  userLocale?: string
  returnFieldsByFieldId?: boolean
}
```

### Auto-pagination: `listAllRecords`

Fetch **all records** (respecting `maxRecords` if provided).

```ts
const all = await client.records.listAllRecords<Task>('Tasks', {
  view: 'Grid view',
  maxRecords: 500, // optional cap
})

console.log('Total records:', all.length)
```

> ℹ️ `listAllRecords` keeps calling `listRecords` until there is no `offset` or `maxRecords` is reached.

### Streaming: `iterateRecords`

Use an async iterator when the table may be large and you don’t want everything in memory at once.

```ts
for await (const record of client.records.iterateRecords<Task>('Tasks', {
  pageSize: 100,
})) {
  console.log(record.id, record.fields.Name)
}
```

You can still pass `maxRecords` to stop early.

## Getting a single record

**Façade:**

```ts
const record = await base('Tasks').find('recXXXXXXXXXXXXXX')
// record: AirtableRecord<Task>
```

**Low-level:**

```ts
const record = await client.records.getRecord<Task>(
  'Tasks',
  'recXXXXXXXXXXXXXX',
  {
    cellFormat: 'json',
    timeZone: 'America/Chicago',
  },
)
```

## Creating records

The Airtable API accepts **max 10 records per request**.
`createRecords` automatically splits into batches.

**Façade:**

```ts
await base('Tasks').create(
  [
    { fields: { Name: 'Write docs', Status: 'Todo' } },
    { fields: { Name: 'Ship release', Status: 'Doing' } },
  ],
  {
    typecast: true,
  },
)
```

**Low-level:**

```ts
await client.records.createRecords<Task>(
  'Tasks',
  [
    { fields: { Name: 'Task A' } },
    { fields: { Name: 'Task B', Status: 'Todo' } },
  ],
  {
    typecast: true,
    returnFieldsByFieldId: false,
  },
)
```

## Updating records in batch

### Normal batch update

**Façade:**

```ts
await base('Tasks').update([
  { id: 'rec1', fields: { Status: 'Doing' } },
  { id: 'rec2', fields: { Status: 'Done' } },
])
```

**Low-level:**

```ts
await client.records.updateRecords<Task>(
  'Tasks',
  [
    { id: 'rec1', fields: { Status: 'Doing' } },
    { id: 'rec2', fields: { Status: 'Done' } },
  ],
  {
    typecast: true,
  },
)
```

### Upsert with `performUpsert`

```ts
await client.records.updateRecords<Task>(
  'Tasks',
  [
    {
      id: 'rec-ignored-when-upsert',
      fields: { 'External ID': '42', Status: 'Done' },
    },
  ],
  {
    performUpsert: {
      fieldsToMergeOn: ['External ID'],
    },
  },
)
```

Depending on whether a record with that external key exists, the API will:

- **update** it (and report in `updatedRecords`)
- or **create** a new one (and report in `createdRecords`)

## Updating a single record

**Low-level:**

```ts
const updated = await client.records.updateRecord<Task>(
  'Tasks',
  'rec123',
  { Status: 'Done' },
  { typecast: true },
)

console.log(updated.fields.Status)
```

Façade equivalent:

```ts
await base('Tasks').updateRecord('rec123', { Status: 'Done' })
```

## Deleting records

### Single record

**Low-level:**

```ts
await client.records.deleteRecord('Tasks', 'rec123')
// { id: 'rec123', deleted: true }
```

Façade:

```ts
await base('Tasks').destroy('rec123')
```

### Multiple records (batched)

**Low-level:**

```ts
await client.records.deleteRecords('Tasks', ['rec1', 'rec2', 'rec3'])
```

Façade:

```ts
await base('Tasks').destroyMany(['rec1', 'rec2', 'rec3'])
```

> Internally, IDs are sent as `records[]=recXXXX` in batches of 10.

## Optional caching (overview)

The Records API supports **optional response caching** for read operations:

- `listRecords`
- `listAllRecords`
- `iterateRecords` (first page)
- `getRecord`

Caching is configured via the `recordsCache` option:

- For the façade:
  - `Airtable.configure({ recordsCache })`
  - `Airtable.base(baseId, { recordsCache })` (per-base overrides)

- For the low-level client:
  - `new AirtableClient({ ..., recordsCache })`

A simple built-in store `InMemoryCacheStore` is provided, so you can enable caching without extra dependencies:

```ts
import Airtable, { InMemoryCacheStore } from 'ts-airtable'

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
  recordsCache: {
    store: new InMemoryCacheStore(),
    defaultTtlMs: 30_000,
  },
})

const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!)
const records = await base('Tasks').select({ view: 'Grid view' }).all()
```

If your tables contain **attachment fields** (images, PDFs, etc.), you can also plug in an attachment transformer on the cache store:

- Implement `transformAttachment(attachment, ctx)` on your `AirtableCacheStore`.
- The Records API will call it for every attachment object **before** results are cached and returned.
- The built-in `InMemoryCacheStore` includes a simple, ID-based memoization helper you can extend (e.g. to re-host files and replace short-lived Airtable URLs with your own).

For a full guide to:

- how keys are generated,
- how invalidation works,
- how attachment transformation fits into caching,
- how to plug in Redis / KV,
- and when you should (or shouldn’t) use caching,

see the dedicated [Caching](./caching.md) page.
