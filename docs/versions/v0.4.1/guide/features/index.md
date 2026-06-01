---
title: Features overview
description: Optional and advanced features built on top of the core Airtable TS client, such as record caching.
---

# Features

This section covers **optional** and **advanced** features built on top of the core Airtable TS client.

The core usage is:

- How to talk to Airtable (records / metadata / webhooks)
- How to configure the client (API key, base, fetch, retries)

Features in this section are **extra capabilities** you can turn on when you need them — they’re not required to use the library.

## Currently available

### Record caching

> Docs: [Caching](./caching.md)

Optional response caching for read operations:

- `listRecords`
- `listAllRecords`
- `iterateRecords` (first page)
- `getRecord`

Highlights:

- Pluggable `AirtableCacheStore` interface
- Built-in `InMemoryCacheStore` (LRU + TTL) for in-process caching
- Automatic invalidation on mutations when `deleteByPrefix` is implemented
- Configurable via:
  - `Airtable.configure({ recordsCache })`
  - `Airtable.base(baseId, { recordsCache })`
  - `new AirtableClient({ ..., recordsCache })`

If you just want a quick win (and no extra dependencies), start with the built-in in-memory store.
For details and best practices, see [Caching](./caching.md).

## How features are configured

Most features are enabled via **client options**:

- Globally (for the façade):

  ```ts
  Airtable.configure({
    apiKey: process.env.AIRTABLE_API_KEY!,
    // ...common options
    // recordsCache?: AirtableRecordsCacheOptions
  })
  ```

- Per-base overrides (facade):

  ```ts
  const base = Airtable.base<MyFields>(process.env.AIRTABLE_BASE_ID!, {
    // e.g. base-specific records cache
    // recordsCache?: AirtableRecordsCacheOptions
  })
  ```

- Directly on the low-level client:

  ```ts
  const client = new AirtableClient<MyFields>({
    apiKey: process.env.AIRTABLE_API_KEY!,
    baseId: process.env.AIRTABLE_BASE_ID!,
    // recordsCache?: AirtableRecordsCacheOptions
  })
  ```

The idea is consistent: **core API first, features opt-in**.

## Where to go next

- ✅ New to the library? Start with [Getting Started](../getting-started.md)
- 📄 Want to work with data? See the [Records API](../records.md)
- 🧊 Need better performance / fewer API calls? Dive into [Caching](./caching.md)
- 🧱 Need schemas & table info? Check out [Metadata](../metadata.md)
- 🔔 Need reactive workflows? See [Webhooks](../webhooks.md)
