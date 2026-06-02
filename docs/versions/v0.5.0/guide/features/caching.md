---
title: Caching
description: Optional response caching for Airtable records, with pluggable stores and built-in in-memory cache.
---

# Caching

Airtable TS ships with **optional response caching** for the Records API.

Currently caching is supported for:

- `listRecords`
- `listAllRecords`
- `iterateRecords` (first page)
- `getRecord`

You can enable caching via:

- the façade: `Airtable.configure({ recordsCache })`, `Airtable.base(baseId, { recordsCache })`
- the low-level client: `new AirtableClient({ ..., recordsCache })`
- directly on `AirtableRecordsClient` (advanced)

## Core concepts

### Stores (`AirtableCacheStore`)

- Interface: `get`, `set`, `deleteByPrefix?`
- Built-in store: `InMemoryCacheStore` (LRU + TTL)
- Custom stores: Redis / KV / whatever
- Optional hook: `transformAttachment(attachment, ctx)` to post-process Airtable attachment objects before they are cached/returned

### Key strategy

- `listRecords` keys = baseId + table + stable params
- `getRecord` keys = baseId + table + recordId + stable params
- Prefix helpers:
  - `tablePrefix(...)` -> invalidate all list-style keys for a table
  - `recordPrefix(...)` -> invalidate all cached views of a record

### Invalidation

- Mutations auto-invalidate when `deleteByPrefix` is implemented:
  - table-level: `createRecords`, `updateRecords`, `deleteRecords`
  - record-level: `updateRecord`, `deleteRecord`
- If `deleteByPrefix` is missing -> mutations are still success, just may have stale data for a short time until TTL expires

### Error handling

- `onError(error, ctx)` hook
- `failOnCacheError` = `false` -> swallow cache errors
- `failOnCacheError` = `true` -> throw errors to let the caller be aware of cache issues

### Attachment transformation (`transformAttachment`)

If your base uses **attachment fields** (images, PDFs, etc.), you can optionally plug in an attachment transformer on the cache store:

- Add a `transformAttachment(attachment, ctx)` method to your `AirtableCacheStore`.
- The Records API will:
  - scan record fields returned by `listRecords` / `listAllRecords` / `iterateRecords` / `getRecord`,
  - detect attachment arrays,
  - call `transformAttachment` for each attachment object it finds,
  - and replace the attachment with whatever you return.
- Both the **cached copy** and the **API return value** will see the transformed attachment.

Typical use cases:

- Re-hosting files on your own storage (S3 / R2 / CDN).
- Replacing Airtable’s short-lived URLs with long-lived, stable URLs you control.
- Adding extra metadata to attachments (e.g. thumbnails, signed URLs).

The built-in `InMemoryCacheStore` ships with a simple, **ID-based memoization** implementation you can extend: it remembers transformations per `attachment.id` so you don’t repeat expensive work for the same file within one process.

## Using the built-in InMemoryCacheStore

```ts
import Airtable, { InMemoryCacheStore } from 'ts-airtable'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

const store = new InMemoryCacheStore(1000)

// Global default cache for all bases
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY!,
  recordsCache: {
    store,
    defaultTtlMs: 30_000,
    methods: {
      listRecords: true,
      listAllRecords: true,
      getRecord: true,
    },
  },
})

// Per-base override
const base = Airtable.base<Task>(process.env.AIRTABLE_BASE_ID!, {
  recordsCache: {
    store,
    defaultTtlMs: 5_000,
  },
})

const tasks = await base('Tasks').select({ view: 'Grid view' }).all()
```

If you want to customize attachment handling, you can either:

- subclass `InMemoryCacheStore` and override `transformAttachment`, or
- implement your own `AirtableCacheStore` with a custom `transformAttachment`.

A minimal example sketch:

```ts
import type {
  AirtableAttachment,
  AirtableAttachmentCacheContext,
} from 'ts-airtable'
import { InMemoryCacheStore } from 'ts-airtable'

class MyStore extends InMemoryCacheStore {
  override async transformAttachment(
    attachment: AirtableAttachment,
    ctx: AirtableAttachmentCacheContext,
  ): Promise<AirtableAttachment> {
    // TODO: re-host attachment.url to your own storage,
    // then return an updated attachment object.
    // You can still call `super.transformAttachment` if you
    // want to keep the built-in ID-based memoization.
    return attachment
  }
}
```

## Caching with AirtableClient

```ts
import { AirtableClient, InMemoryCacheStore } from 'ts-airtable'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  recordsCache: {
    store: new InMemoryCacheStore(),
    defaultTtlMs: 60_000,
    methods: {
      listRecords: true,
      listAllRecords: true,
      getRecord: true,
    },
    onError(error, ctx) {
      console.warn('[records cache error]', ctx, error)
    },
    failOnCacheError: false,
  },
})

const page = await client.records.listRecords('Tasks', { pageSize: 50 })
const rec = await client.records.getRecord('Tasks', 'recXXXXXXXXXXXXXX')
```

## Plugging in a custom store

```ts
import type { AirtableCacheStore } from 'ts-airtable'

const redisStore: AirtableCacheStore = {
  async get(key) {
    const raw = await redis.get(key)
    return raw ? JSON.parse(raw) : undefined
  },
  async set(key, value, ttlMs) {
    const payload = JSON.stringify(value)
    if (ttlMs != null) {
      await redis.set(key, payload, { PX: ttlMs })
    } else {
      await redis.set(key, payload)
    }
  },
  async deleteByPrefix(prefix) {
    // Implementation depends on your backend
    // e.g. SCAN + DEL, or an index, etc.
  },
  // Optional: transform attachments for this store
  async transformAttachment(attachment, ctx) {
    // e.g. download from attachment.url and upload to your own bucket
    // then return an attachment object with a stable URL
    return attachment
  },
}
```

## When should I use caching?

Caching is completely optional. Whether you *should* turn it on depends on your access patterns and consistency requirements.

### Good candidates for caching

You’ll usually benefit from caching when:

- **Reads are much more frequent than writes**

  - Dashboards polling the same views
  - Back-office tools with long-lived list views
  - Public pages that show Airtable-backed content

- **The same queries are repeated a lot**

  - `listRecords('Tasks', { view: 'Grid view' })` on every request
  - `getRecord('Settings', 'recXXXXXXXXXXXXXX')` on every page load
  - A couple of “hot” views that almost every user hits

- **You care about rate limits and latency**

  - Cutting down on identical calls helps avoid hitting Airtable’s API limits
  - Serving cached responses from memory / Redis is typically much faster than an HTTP roundtrip

- **Slightly stale data is acceptable**

  - “Near real-time” dashboards (e.g. 5–30 seconds is fine)
  - Analytics / reporting views
  - Public content that doesn’t change every second

In these cases, a modest TTL (e.g. 10–60 seconds) usually brings a good balance between freshness and performance.

### When to be careful or avoid caching

You should be more conservative with caching when:

- **You need strong, per-request freshness**

  - Flows where users must immediately see their own changes
  - Financial / mission-critical operations where stale data can cause incorrect decisions

- **You have very write-heavy workloads on the same data**

  - If a table is being updated constantly and every update matters, a cache will see more invalidations than hits
  - In those cases, cache may add complexity without much benefit

- **Your invalidation story is complicated**

  - If one write can affect many different queries that are hard to express as `deleteByPrefix(...)`
  - Or if you’re not implementing `deleteByPrefix` in a custom store and rely purely on TTL

- **You’re sharing a cache across tenants and keys are tricky**

  - Make sure your cache keys always encode base ID, table name and other scoping info
  - Never rely on “short” keys that could accidentally mix data from different bases / customers

If in doubt, you can start with caching **only “read-mostly” views** (e.g. list APIs) and leave everything else uncached.

### Practical recommendations

A few pragmatic defaults:

- **Start small**

  - Enable caching just for `getRecord` on “settings” / “config” tables, or a couple of hot list views.
  - Use `defaultTtlMs` around `5_000–30_000` for most apps.

- **Cache where it’s shared**

  - If you only use the façade, configure caching globally via `Airtable.configure({ recordsCache: ... })`.
  - If you use multiple bases with different traffic patterns, consider per-base overrides via `Airtable.base(baseId, { recordsCache })`.

- **Monitor first, tighten later**

  - Keep `failOnCacheError: false` while you’re experimenting, so cache issues don’t break your app.
  - Once you’re confident the cache store is stable, you can flip `failOnCacheError` to `true` in critical environments if you want errors to surface.

- **Prefer a shared store in multi-process setups**

  - `InMemoryCacheStore` is great for a single Node process (local dev, simple deployments).
  - For multi-instance / serverless setups, consider a shared store (Redis, KV, etc.) so all instances see the same cached data.

In short: turn caching on where it clearly reduces repeated reads and latency, keep TTLs modest, and lean on `deleteByPrefix` (and, where relevant, `transformAttachment`) when you can. For everything else, it’s perfectly fine to leave caching disabled.
