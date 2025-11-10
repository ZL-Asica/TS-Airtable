---
title: API Reference
---

# API Reference

This section documents the main exports from **ts-airtable**.

> The reference is intentionally light – most users can get by with the
> façade (`Airtable`) and the `AirtableClient` high-level docs.

## Default export: `Airtable`

```ts
import Airtable from 'ts-airtable'
```

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

## `AirtableClient`

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

Composition:

- `client.records` – records CRUD & listing
- `client.metadata` – bases & schema metadata
- `client.webhooks` – base-level webhooks

Detailed guides for each area:

- [Records API](/guide/records)
- [Metadata API](/guide/metadata)
- [Webhooks](/guide/webhooks)

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

### `isAirtableError(err)`

Type guard:

```ts
if (isAirtableError(error)) {
  console.error(error.status, error.type, error.message)
}
```
