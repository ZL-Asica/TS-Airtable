---
title: Getting Started
description: Learn how to get started with Airtable TS, a tiny, fetch-based client for the Airtable Web API.
---

# Getting Started

Airtable TS is a tiny, fetch-based client for the Airtable Web API, with:

- Airtable.js-style façade: `Airtable.configure(...)` + `Airtable.base(...)`
- A low-level `AirtableClient` with records, metadata and webhooks
- Optional, pluggable in-process **record caching**
- First-class TypeScript, built-in retry support and production request hooks

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
  // rateLimiter?: true | { requestsPerSecond?: number, maxConcurrent?: number }
  // maxRetries?: number
  // retryInitialDelayMs?: number
  // retryOnStatuses?: number[]
  // observability?: AirtableObservabilityHooks
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
  // apiVersion?: '0.4.0' // optional X-Airtable-API-Version header
  // endpointUrl?: string
  // fetch?: typeof fetch
  // rateLimiter?: true | { requestsPerSecond?: number, maxConcurrent?: number }
  // noRetryIfRateLimited?: boolean
  // maxRetries?: number
  // retryInitialDelayMs?: number
  // retryOnStatuses?: number[]
  // observability?: AirtableObservabilityHooks
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

## Request robustness

- `listRecords` uses Airtable's regular GET endpoint while the generated URL is
  within Airtable's documented URL length limit. Longer requests automatically
  use the read-only `POST /listRecords` fallback. For that fallback,
  `timeZone` and `userLocale` stay in the query string while list options move
  into the JSON request body.
- Retryable HTTP statuses default to `[429, 500, 502, 503, 504]`. Rate limits
  are retried by default, and `Retry-After` is respected when Airtable sends it.
- Transient network errors are retried for GET/HEAD requests and the
  `POST /listRecords` fallback. Mutation requests are not replayed after a
  network failure to avoid duplicate writes.
- `apiVersion`, when provided, is sent as `X-Airtable-API-Version` for
  compatibility with the official client. Request paths continue to use
  Airtable's v0 HTTP API, and compatibility headers are not added to query
  parameters.

### Rate limiting and scheduling

For single-process apps, `rateLimiter: true` enables the built-in
`AirtableRateLimiter`. Its defaults match Airtable's common per-base rate limit:
5 request attempts per second and up to 5 concurrent attempts.

```ts
const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  rateLimiter: true,
})
```

For shared queues, distributed deployments, circuit breakers or tracing, pass a
custom `requestScheduler`. The scheduler receives one request context and a
callback that performs exactly one HTTP attempt.

```ts
import type { AirtableRequestScheduler } from 'ts-airtable'

const scheduler: AirtableRequestScheduler = {
  async schedule(run, context) {
    console.log('Scheduling Airtable request', context.requestId, context.url)
    return run()
  },
}

const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  requestScheduler: scheduler,
})
```

Use either `rateLimiter` or `requestScheduler`, not both.

### Observability hooks

`observability` hooks let you connect request lifecycle events to logs, metrics,
or tracing without wrapping `fetch` yourself. Events omit API keys, request
bodies and request headers. URLs can still contain Airtable query values such as
formulas, view names, field names, and offsets; redact them before writing to
shared logs when needed.

```ts
const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  observability: {
    onRequestEnd: event => console.info('Airtable status', event.status),
    onRetry: event => console.warn('Retrying Airtable request', event.delayMs),
    onError: event => console.error('Airtable request failed', event.error),
  },
})
```

Hook errors are swallowed. Logging and metrics code should never turn a working
Airtable request into a failed one.

## Optional caching (quick overview)

Record caching for reads (`listRecords`, `listAllRecords`, `iterateRecords`, `getRecord`) is **opt-in**.

- Configure via `recordsCache`:
  - `Airtable.configure({ recordsCache })`
  - `Airtable.base(baseId, { recordsCache })`
  - `new AirtableClient({ ..., recordsCache })`

- A built-in `InMemoryCacheStore` is provided for simple in-process caching.

For a full guide (key strategy, invalidation, custom stores, best practices), see the dedicated [Caching](./features/caching.md) page.

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

`payload` preserves Airtable JSON error bodies when available. If a proxy or
mock returns JSON-shaped error text without a JSON content type, the client
still attempts to recover the Airtable error payload. Malformed error bodies are
reported as `AirtableError` with the HTTP status instead of leaking JSON parser
errors from failed API responses.

## What’s next?

- 🔎 Learn more about the [**records API**](./records.md): listing, pagination & batching
- 🧱 Explore [**metadata**](./metadata.md): bases, tables, fields and views
- 🔔 Set up [**webhooks**](./webhooks.md) for reactive workflows
- 🧊 Dive into [**caching**](./caching.md): how record caching works and when to use it
- 📚 Browse the [**full API reference**](../api/index.md) for all types and helpers

## LICENSE

This is an unofficial community library and is not endorsed, sponsored, or affiliated with Airtable. Airtable is a registered trademark of Formagrid Inc.

This project is licensed under the [MIT License](https://www.github.com/ZL-Asica/TS-Airtable/LICENSE).
