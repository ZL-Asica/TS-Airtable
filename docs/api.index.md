---
title: API Reference
description: A guided map of the main ts-airtable exports, request options, response shapes, and generated type reference.
outline: deep
---

# API Reference

Use this page as a map before jumping into the generated type pages. The
library has two public layers:

- the default `Airtable` facade for Airtable.js-style application code
- the `AirtableClient` class for direct records, metadata, webhooks, retries,
  and caching control

If you are learning the package for the first time, start with the
[Getting Started guide](/guide/getting-started). If you already know which
export you need, use the sidebar groups on this page.

## Which API Should I Use?

| Goal | Recommended API | Guide |
| --- | --- | --- |
| Keep an Airtable.js-like shape | `Airtable.configure()` and `Airtable.base()` | [Getting Started](/guide/getting-started) |
| List, paginate, create, update, delete, or upsert records | `AirtableClient.records` | [Records API](/guide/records) |
| Inspect bases, tables, fields, and views | `AirtableClient.metadata` | [Metadata](/guide/metadata) |
| Create webhooks and read webhook payloads | `AirtableClient.webhooks` | [Webhooks](/guide/webhooks) |
| Add read caching or attachment transforms | `AirtableRecordsCacheOptions` and `AirtableCacheStore` | [Caching](/guide/features/caching) |
| Handle API failures reliably | `AirtableError` and `isAirtableError()` | [Errors](#errors) |

## Default Facade: `Airtable`

```ts
import Airtable from 'ts-airtable'
```

The facade is the shortest path when you want the familiar
`Airtable.configure(...); Airtable.base(...)(tableName)` workflow.

### `Airtable.configure(config)`

```ts
Airtable.configure({
  apiKey: string,              // required
  endpointUrl?: string,
  fetch?: typeof fetch,
  maxRetries?: number,
  retryInitialDelayMs?: number,
  retryOnStatuses?: number[],
})
```

Common options:

| Option | Purpose |
| --- | --- |
| `apiKey` | Personal access token used for Airtable requests. |
| `endpointUrl` | Override for proxies, mocks, or compatible Airtable endpoints. |
| `fetch` | Custom fetch implementation for tests or non-standard runtimes. |
| `maxRetries` | Retry count for retryable HTTP failures. |
| `retryInitialDelayMs` | Initial retry delay before exponential backoff. |
| `retryOnStatuses` | Additional HTTP status codes to retry. |

### `Airtable.base<TFields>(baseId)`

```ts
const base = Airtable.base<MyFields>('appXXXXXXXXXXXXXX')

base.id // base id
base.client // underlying AirtableClient instance

const table = base('Table name')
```

Table helpers:

- `table.select(params?).all()`
- `table.select(params?).firstPage()`
- `table.find(recordId, params?)`
- `table.create(records, options?)`
- `table.update(records, options?)`
- `table.updateRecord(recordId, fields, options?)`
- `table.destroy(recordId)`
- `table.destroyMany(recordIds)`

## Low-Level Client: `AirtableClient`

```ts
import { AirtableClient } from 'ts-airtable'

const client = new AirtableClient<MyFields>({
  apiKey: string,
  baseId: string,
  endpointUrl?: string,
  fetch?: typeof fetch,
  maxRetries?: number,
  retryInitialDelayMs?: number,
  retryOnStatuses?: number[],
})
```

The low-level client exposes the Airtable Web API domains directly:

| Property | Use it for |
| --- | --- |
| `client.records` | Record listing, pagination, CRUD, batch mutations, upserts, and cache-aware reads. |
| `client.metadata` | Listing bases and fetching table, field, and view schema. |
| `client.webhooks` | Creating, listing, deleting, and reading Airtable webhook payloads. |

## Records Types

Records are generic over your field shape. A typical table-specific type looks
like this:

```ts
interface TaskFields {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
  Assignee?: string[]
}

const task = await client.records.getRecord<TaskFields>({
  tableIdOrName: 'Tasks',
  recordId: 'recXXXXXXXXXXXXXX',
})

task.fields.Name
```

Frequently used record types:

| Type | When to use it |
| --- | --- |
| [`AirtableRecord<TFields>`](/api/Interfaces/AirtableRecord) | A full Airtable record with `id`, `createdTime`, and `fields`. |
| [`ListRecordsParams<TFields>`](/api/Interfaces/ListRecordsParams) | Query options for listing records. |
| [`ListRecordsResult<TFields>`](/api/Interfaces/ListRecordsResult) | One page of records plus the Airtable pagination offset. |
| [`CreateRecordInput<TFields>`](/api/Interfaces/CreateRecordInput) | One record payload for create requests. |
| [`UpdateRecordInput<TFields>`](/api/Interfaces/UpdateRecordInput) | One record payload for update requests. |
| [`UpsertRecordInput<TFields>`](/api/Interfaces/UpsertRecordInput) | One record payload for performUpsert requests. |
| [`PerformUpsertOptions`](/api/Interfaces/PerformUpsertOptions) | Merge fields and typecast options for upserts. |

## Query Options

Most record listing options follow Airtable's Web API names:

```ts
await client.records.listRecords<TaskFields>({
  tableIdOrName: 'Tasks',
  view: 'Grid view',
  filterByFormula: "{Status} = 'Todo'",
  sort: [{ field: 'Created', direction: 'desc' }],
  pageSize: 50,
})
```

Related types:

- [`AirtableQuery<TFields>`](/api/Interfaces/AirtableQuery)
- [`AirtableQueryParams<TFields>`](/api/Interfaces/AirtableQueryParams)
- [`AirtableSortParameter<TFields>`](/api/Interfaces/AirtableSortParameter)
- [`SortSpec`](/api/Interfaces/SortSpec)

## Metadata And Webhooks

The metadata and webhook APIs intentionally stay close to Airtable response
shapes so you can map the docs to Airtable's API reference.

| Domain | Main response types |
| --- | --- |
| Bases | [`ListBasesResult`](/api/Interfaces/ListBasesResult), [`AirtableBaseSummary`](/api/Interfaces/AirtableBaseSummary) |
| Table schema | [`AirtableBaseSchema`](/api/Interfaces/AirtableBaseSchema), [`AirtableTableSchema`](/api/Interfaces/AirtableTableSchema) |
| Field schema | [`AirtableFieldSchema`](/api/Interfaces/AirtableFieldSchema), [`AirtableViewSchema`](/api/Interfaces/AirtableViewSchema) |
| Webhooks | [`AirtableWebhook`](/api/Interfaces/AirtableWebhook), [`AirtableWebhookPayload`](/api/Interfaces/AirtableWebhookPayload) |

## Errors

```ts
import { AirtableError, isAirtableError } from 'ts-airtable'
```

### `AirtableError`

Thrown for all non-2xx HTTP responses.

```ts
class AirtableError extends Error {
  status: number
  type?: string
  payload?: AirtableErrorResponseBody
}
```

`payload` stores the parsed Airtable error body when the response is JSON. The
client also accepts slightly imperfect mock or proxy payloads when extracting
the error type and message.

### `isAirtableError(err)`

Type guard:

```ts
if (isAirtableError(error)) {
  console.error(error.status, error.type, error.message)
}
```

## Caching And Attachments

Record reads can use an optional cache store. Start with
[`AirtableRecordsCacheOptions`](/api/Interfaces/AirtableRecordsCacheOptions)
for the public options, then implement [`AirtableCacheStore`](/api/Interfaces/AirtableCacheStore)
when you need a custom backing store.

The built-in [`InMemoryCacheStore`](/api/Classes/InMemoryCacheStore) is useful
for tests, demos, and local processes. For production shared caches, see the
[Cloudflare KV cache store example](/guide/features/custom-cloudflare-kv-cache).

Attachment-related types:

- [`AirtableAttachment`](/api/Interfaces/AirtableAttachment)
- [`AirtableThumbnail`](/api/Interfaces/AirtableThumbnail)
- [`AirtableAttachmentCacheContext`](/api/Interfaces/AirtableAttachmentCacheContext)

## Compatibility Aliases

The package exports a small set of aliases for code that prefers Airtable.js
names:

| Alias | Points to |
| --- | --- |
| [`Base`](/api/Type%20Aliases/Base) | Airtable base facade |
| [`Table`](/api/Type%20Aliases/Table) | Table facade returned by `base(tableName)` |
| [`Record`](/api/Type%20Aliases/Record) | Airtable record shape |
| [`Records`](/api/Type%20Aliases/Records) | Array of Airtable records |
| [`FieldSet`](/api/Type%20Aliases/FieldSet) | Field map type |
| [`Query`](/api/Type%20Aliases/Query) | Facade query builder |
| [`SelectOptions`](/api/Type%20Aliases/SelectOptions) | Facade select options |

## Generated Reference

The sidebar links to generated pages for the exported classes, functions,
interfaces, variables, and type aliases. Those pages are best for checking exact
property names and generic signatures after you already know the area you are
working in.
