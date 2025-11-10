---
title: Getting Started
description: Learn how to get started with Airtable TS, a tiny, fetch-based client for the Airtable Web API.
---

# Getting Started

Airtable TS is a tiny, fetch-based client for the Airtable Web API, with:

- Airtable.js-style façade: `Airtable.configure(...)` + `Airtable.base(...)`
- A low-level `AirtableClient` with records, metadata and webhooks
- Optional, pluggable in-process **record caching**
- First-class TypeScript & built-in retry support

## Installation

```bash
pnpm add ts-airtable
# or
npm install ts-airtable
# or
yarn add ts-airtable
# or
bun add ts-airtable
# or deno
deno add npm:ts-airtable
```

### Runtime requirements

- **Node 18+** (recommended) – uses the built-in `fetch`
- **Node < 18** – pass your own `fetch` implementation (e.g. `undici`, `node-fetch`) via options

## Option A: Airtable.js-style façade

If you’ve used the official `airtable.js` client before, this will feel familiar.

```ts
import Airtable from 'ts-airtable'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

// 1. Configure global defaults
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
  // endpointUrl?: 'https://api.airtable.com'
  // fetch?: typeof fetch
  // maxRetries?: number
  // retryInitialDelayMs?: number
  // retryOnStatuses?: number[]
})

// 2. Create a base handle
const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!)

// 3. Use base(tableName) to get a table helper

// List all records in a view
const records = await base('Tasks').select({ view: 'Grid view' }).all()

console.log(records[0].fields.Name)

// First page only
const firstPage = await base('Tasks').select({ pageSize: 50 }).firstPage()

// Single record
const rec = await base('Tasks').find('recXXXXXXXXXXXXXX')

// Create
await base('Tasks').create([{ fields: { Name: 'Write docs', Status: 'Todo' } }])

// Update
await base('Tasks').update([{ id: 'rec1', fields: { Status: 'Done' } }])

// Delete
await base('Tasks').destroy('rec1')
await base('Tasks').destroyMany(['rec2', 'rec3'])
```

### Façade API shape (quick overview)

```ts
Airtable.configure({
  apiKey: string,
  endpointUrl?: string,
  fetch?: typeof fetch,
  maxRetries?: number,
  retryInitialDelayMs?: number,
  retryOnStatuses?: number[],
})

const base = Airtable.base<MyFields>(baseId)

// base is a function: base(tableName) -> table helper
base.id     // baseId
base.client // underlying AirtableClient instance

const table = base('Table name')

table.select(params?).all()
table.select(params?).firstPage()
table.find(recordId, params?)
table.create(records, options?)
table.update(records, options?)
table.updateRecord(recordId, fields, options?)
table.destroy(recordId)
table.destroyMany(recordIds)
```

If you only need to do **record listing + create / update / delete**, the façade is all you need.

## Option B: Low-level `AirtableClient`

When you need to work with **metadata**, **webhooks**, or want more direct control over configuration, the low-level client is more direct.

```ts
import { AirtableClient } from 'ts-airtable'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  // endpointUrl?: string
  // fetch?: typeof fetch
  // maxRetries?: number
  // retryInitialDelayMs?: number
  // retryOnStatuses?: number[]
})

// Records API
const page = await client.records.listRecords('Tasks', {
  view: 'Grid view',
  pageSize: 50,
})

for (const record of page.records) {
  console.log(record.id, record.fields.Name)
}

// Metadata API
const schema = await client.metadata.getBaseSchema()
console.log(schema.tables.map((t) => t.name))

// Webhooks API
const webhooks = await client.webhooks.listWebhooks()
console.log(webhooks.webhooks.length)
```

### Client composition

- `client.records` – list / get / create / update / delete / upsert
- `client.metadata` – bases, base schema, table & view metadata
- `client.webhooks` – create / list / refresh / delete, plus payload listing

## Optional caching (quick overview)

Record caching for reads (`listRecords`, `listAllRecords`, `iterateRecords`, `getRecord`) is **opt-in**.

- Configure via `recordsCache`:
  - `Airtable.configure({ recordsCache })`
  - `Airtable.base(baseId, { recordsCache })`
  - `new AirtableClient({ ..., recordsCache })`

- A built-in `InMemoryCacheStore` is provided for simple in-process caching.

For a full guide (key strategy, invalidation, custom stores, best practices), see the dedicated [Caching](./caching.md) page.

## Error handling

All non-2xx responses are thrown as `AirtableError`:

```ts
import { AirtableError, isAirtableError } from 'ts-airtable'

try {
  await client.records.listRecords('Tasks')
} catch (err) {
  if (isAirtableError(err)) {
    console.error('Airtable error', err.status, err.type, err.message)
  } else {
    console.error('Unexpected error', err)
  }
}
```

`AirtableError` extends the built-in `Error` class and includes additional properties:

```ts
class AirtableError extends Error {
  status: number
  type?: string
  payload?: AirtableErrorResponseBody
}
```

## What’s next?

- 🔎 Learn more about the [**records API**](./records.md): listing, pagination & batching
- 🧱 Explore [**metadata**](./metadata.md): bases, tables, fields and views
- 🔔 Set up [**webhooks**](./webhooks.md) for reactive workflows
- 🧊 Dive into [**caching**](./caching.md): how record caching works and when to use it
- 📚 Browse the [**full API reference**](../api/index.md) for all types and helpers

## LICENSE

This is an unofficial community library and is not endorsed, sponsored, or affiliated with Airtable. Airtable is a registered trademark of Formagrid Inc.

This project is licensed under the [MIT License](https://www.github.com/ZL-Asica/TS-Airtable/LICENSE).
