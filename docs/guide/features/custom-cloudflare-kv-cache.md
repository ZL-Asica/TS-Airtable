---
title: Custom cache store example (Cloudflare KV)
description: Learn how to plug Cloudflare KV into Airtable TS as a custom cache store for list/get operations.
---

# Custom cache store example (Cloudflare KV)

This page shows how to wire **Cloudflare KV** into Airtable TS as a custom
`AirtableCacheStore` implementation.

If you haven’t read it yet, you may want to skim the main [Caching](./caching.md) page first.

## 1. The `AirtableCacheStore` interface (recap)

Record caching in Airtable TS is driven by a small interface:

```ts
export interface AirtableCacheStore {
  get: <T = unknown>(key: string) => T | undefined | Promise<T | undefined>
  set: <T = unknown>(
    key: string,
    value: T,
    ttlMs?: number,
  ) => void | Promise<void>
  delete?: (key: string) => void | Promise<void>
  deleteByPrefix?: (prefix: string) => void | Promise<void>
}
```

- `get` / `set` are required.
- `delete` / `deleteByPrefix` are optional, but `deleteByPrefix` is strongly recommended
  if you want **automatic mutation-driven invalidation** to work (create/update/delete).

On top of this, you configure caching via `recordsCache`:

```ts
interface AirtableRecordsCacheOptions {
  store: AirtableCacheStore
  defaultTtlMs?: number
  methods?: {
    listRecords?: boolean
    listAllRecords?: boolean
    getRecord?: boolean
  }
  onError?: (error: unknown, ctx: AirtableRecordsCacheOnErrorContext) => void
  failOnCacheError?: boolean
}
```

## 2. Cloudflare KV basics

In a Cloudflare Worker / Pages Function you typically have:

- An `Env` binding that contains one or more `KVNamespace` instances
- Methods like `kv.get(key)`, `kv.put(key, value, options)`, `kv.delete(key)`
- The ability to **list** keys with a given prefix via `kv.list({ prefix })`

We’ll use that to:

- Store records as JSON strings
- Honor the TTL that Airtable TS passes in (`ttlMs`)
- Implement **prefix-based invalidation** using `list({ prefix })` + `delete(key)`

> ⚠️ **Note on limits & cost:**
> `deleteByPrefix` is implemented using `kv.list({ prefix })`, which is an extra API call and
> may list multiple keys. For small / moderate cache sizes this is usually fine. For very
> large caches, consider your quota and performance requirements.

## 3. Implementing `AirtableCacheStore` with Cloudflare KV

First, define your environment bindings and a `CloudflareKvStore` class.

```ts
// src/cloudflare-kv-store.ts
import type { AirtableCacheStore } from 'ts-airtable'

/**
 * Your Cloudflare Worker / Pages environment shape.
 *
 * Make sure `AIRTABLE_CACHE` is bound to a KV namespace in your wrangler.toml:
 *
 * [[kv_namespaces]]
 * binding = "AIRTABLE_CACHE"
 * id = "..."
 */
export interface Env {
  AIRTABLE_CACHE: KVNamespace
}

/**
 * Cloudflare KV-backed implementation of AirtableCacheStore.
 *
 * Values are serialized as JSON strings. TTL is honored via KV's `expirationTtl`
 * option when provided by Airtable TS.
 */
export class CloudflareKvStore implements AirtableCacheStore {
  constructor(private readonly kv: KVNamespace) {}

  /**
   * Read a value from KV and JSON-deserialize it.
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const raw = await this.kv.get(key)
    if (raw == null) return undefined

    try {
      return JSON.parse(raw) as T
    } catch {
      // If something goes wrong, treat as a cache miss.
      return undefined
    }
  }

  /**
   * Serialize and store a value in KV.
   *
   * If `ttlMs` is provided, it is converted to seconds for KV's `expirationTtl`.
   */
  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    const payload = JSON.stringify(value)
    const options: KVNamespacePutOptions = {}

    if (typeof ttlMs === 'number' && Number.isFinite(ttMs)) {
      // KV expects seconds; clamp at minimum 1 second
      const ttlSeconds = Math.max(1, Math.floor(ttMs / 1000))
      options.expirationTtl = ttlSeconds
    }

    await this.kv.put(key, payload, options)
  }

  /**
   * Delete a single key from KV.
   */
  async delete(key: string): Promise<void> {
    await this.kv.delete(key)
  }

  /**
   * Delete all keys that start with the given prefix.
   *
   * Implementation uses KV.list({ prefix }) and then deletes each key.
   * This is O(n) in the number of matching keys and counts towards your
   * KV list & write quotas.
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    let cursor: string | undefined

    do {
      const res = await this.kv.list({ prefix, cursor })
      // Delete in parallel; for very large sets you might want to chunk this
      await Promise.all(res.keys.map((k) => this.kv.delete(k.name)))
      cursor = res.list_complete ? undefined : res.cursor
    } while (cursor)
  }
}
```

### Notes

- The store is **stateless**: you construct it with `new CloudflareKvStore(env.AIRTABLE_CACHE)`.
- It can be reused across multiple Airtable clients / bases within the same Worker invocation.
- `deleteByPrefix` uses pagination via `cursor` to handle many keys.

## 4. Wiring it into `AirtableClient` (Workers)

Here’s a minimal Worker that uses the Cloudflare KV store for record caching:

```ts
// src/worker.ts
import type { Env } from './cloudflare-kv-store'
import { AirtableClient } from 'ts-airtable'
import { CloudflareKvStore } from './cloudflare-kv-store'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cacheStore = new CloudflareKvStore(env.AIRTABLE_CACHE)

    const client = new AirtableClient<Task>({
      apiKey: env.AIRTABLE_API_KEY,
      baseId: env.AIRTABLE_BASE_ID,
      recordsCache: {
        store: cacheStore,
        defaultTtlMs: 30_000, // cache list/get results for 30s
        methods: {
          listRecords: true,
          listAllRecords: true,
          getRecord: true,
        },
        onError(error, ctx) {
          // Optional observability hook – your logging here
          console.warn('[Airtable records cache error]', ctx, error)
        },
        failOnCacheError: false, // do not break main API calls on cache failure
      },
    })

    const page = await client.records.listRecords('Tasks', {
      view: 'Grid view',
      pageSize: 50,
    })

    return new Response(
      JSON.stringify(
        page.records.map((r) => ({ id: r.id, fields: r.fields })),
        null,
        2,
      ),
      { headers: { 'content-type': 'application/json' } },
    )
  },
} satisfies ExportedHandler<Env>
```

### What gets cached in this setup?

With the `methods` above:

- All `listRecords('Tasks', { view: 'Grid view', pageSize: 50 })` calls within TTL
  will be served from KV when possible.
- `listAllRecords` / `iterateRecords` also benefit, as they use `listRecords` under the hood.
- `getRecord(table, recordId, params?)` can also be cached if you call it.

Mutations (`createRecords`, `updateRecords`, `deleteRecords`, `updateRecord`, `deleteRecord`)
will trigger **prefix-based invalidation** via `deleteByPrefix`, which we implemented on top of KV.

## 5. Wiring it into the façade (`Airtable.configure` / `Airtable.base`)

You can also plug the same store into the high-level façade API:

```ts
// src/worker-facade.ts
import type { Env } from './cloudflare-kv-store'
import Airtable from 'ts-airtable'
import { CloudflareKvStore } from './cloudflare-kv-store'

interface Task {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cacheStore = new CloudflareKvStore(env.AIRTABLE_CACHE)

    Airtable.configure({
      apiKey: env.AIRTABLE_API_KEY,
      recordsCache: {
        store: cacheStore,
        defaultTtlMs: 30_000,
      },
    })

    const base = Airtable.base<Task>(env.AIRTABLE_BASE_ID)

    const records = await base('Tasks')
      .select({ view: 'Grid view', pageSize: 50 })
      .all()

    return new Response(
      JSON.stringify(
        records.map((r) => ({ id: r.id, fields: r.fields })),
        null,
        2,
      ),
      { headers: { 'content-type': 'application/json' } },
    )
  },
} satisfies ExportedHandler<Env>
```

You can still override caching per base:

```ts
const base = Airtable.base<Task>(env.AIRTABLE_BASE_ID, {
  recordsCache: {
    store: cacheStore,
    defaultTtlMs: 5_000,
  },
})
```

## 6. Tips & best practices

A few practical tips when using Cloudflare KV as a cache store:

- **Be mindful of `deleteByPrefix` cost**
  It uses `kv.list({ prefix })` which is powerful but not free. If you are doing very
  frequent writes, consider whether you really need aggressive invalidation or if TTL is enough.

- **Choose sensible TTLs**
  KV is great for cached API responses, but you probably don’t want multi-hour TTLs for
  highly dynamic Airtable bases. Start with something like 5–60 seconds and adjust.

- **Error handling strategy**
  - Default behavior (`failOnCacheError: false`) means “cache is best-effort”.
  - Set `failOnCacheError: true` if you want cache failures to **break** your API call
    (and be caught by your outer try/catch).

- **Multiple bases / multi-tenant setups**
  The cache keys produced by Airtable TS already include `baseId` in their prefix, so you
  can safely reuse the same KV namespace for multiple bases as long as you use the library’s
  built-in key helpers.

If you want a lighter-weight option and don’t need cross-region persistence, also check the
built-in [InMemoryCacheStore](./caching.md#built-in-inmemorycachestore) which is fully
edge-compatible and requires no external services.
