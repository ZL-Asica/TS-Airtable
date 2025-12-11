---
title: Custom cache store example (Cloudflare KV)
description: Learn how to plug Cloudflare KV into Airtable TS as a custom cache store for list/get operations.
---

# Custom cache store example (Cloudflare KV)

This page shows how to wire **Cloudflare KV** into Airtable TS as a custom `AirtableCacheStore` implementation, and how to optionally use **Cloudflare R2** to cache Airtable attachments (files, images) and replace short-lived URLs with longer-lived ones you control.

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

  /**
   * Optional hook for transforming Airtable attachments before they are
   * cached and returned to the caller.
   *
   * If provided, the Records API will call this for each attachment object
   * it finds in `listRecords` / `listAllRecords` / `iterateRecords` /
   * `getRecord` responses.
   */
  transformAttachment?: (
    attachment: AirtableAttachment,
    ctx: AirtableAttachmentCacheContext,
  ) => AirtableAttachment | Promise<AirtableAttachment>
}
```

- `get` / `set` are required.
- `delete` / `deleteByPrefix` are optional, but `deleteByPrefix` is strongly recommended
  if you want **automatic mutation-driven invalidation** to work (create/update/delete).
  - `transformAttachment` is optional and only matters if your base uses **attachment fields**.
  It is a good place to:

  - re-host files to your own storage (S3 / R2 / etc.),
  - and/or replace Airtable’s short-lived URLs with your own stable URLs.

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

In the next section we start with **KV-only** caching for records. Later we’ll extend
the same idea to handle **attachments via R2**.

## 3. Implementing `AirtableCacheStore` with Cloudflare KV

First, define your environment bindings and a `CloudflareKvStore` class.

```ts
// src/cloudflare-kv-store.ts
import type {
  AirtableAttachment,
  AirtableAttachmentCacheContext,
  AirtableCacheStore,
} from 'ts-airtable'

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

    if (typeof ttlMs === 'number' && Number.isFinite(ttlMs)) {
      // KV expects seconds; clamp at minimum 1 second
      const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000))
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
      await Promise.all(res.keys.map(k => this.kv.delete(k.name)))
      cursor = res.list_complete ? undefined : res.cursor
    } while (cursor)
  }

  /**
   * Optional attachment hook – here we simply return the original attachment
   * unchanged. You can omit this method entirely if you don't care about
   * attachment URLs.
   */
  async transformAttachment(
    attachment: AirtableAttachment,
    _ctx: AirtableAttachmentCacheContext,
  ): Promise<AirtableAttachment> {
    return attachment
  }
}
```

### Notes

- The store is **stateless**: you construct it with `new CloudflareKvStore(env.AIRTABLE_CACHE)`.
- It can be reused across multiple Airtable clients / bases within the same Worker invocation.
- `deleteByPrefix` uses pagination via `cursor` to handle many keys.
- `transformAttachment` is included here for completeness, but in this simple KV-only store
  it does not change anything.

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
  async fetch(_request: Request, env: Env): Promise<Response> {
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
        page.records.map(r => ({ id: r.id, fields: r.fields })),
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
  async fetch(_request: Request, env: Env): Promise<Response> {
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
        records.map(r => ({ id: r.id, fields: r.fields })),
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

## 6. Optional: attachment caching with Cloudflare R2

Airtable attachment URLs are **short-lived signed URLs**. If you enable caching for records, you may still end up with attachment URLs that expire quickly.

To address this, you can:

1. Download each attachment from Airtable once.
2. Upload it into **Cloudflare R2**.
3. Replace the Airtable URL with a stable URL you control.
4. Remember the mapping per `attachment.id` so you don’t re-upload the same file.

A simple way to do this is to extend your cache store to also know about an R2 bucket and implement `transformAttachment`.

### Env with KV + R2

In your `Env` you might have:

```ts
export interface Env {
  AIRTABLE_CACHE: KVNamespace
  ATTACHMENTS_BUCKET: R2Bucket
  ATTACHMENTS_PUBLIC_BASE_URL: string // e.g. 'https://cdn.example.com/airtable'
}
```

Make sure `ATTACHMENTS_BUCKET` is bound in `wrangler.toml` as an R2 bucket, and `ATTACHMENTS_PUBLIC_BASE_URL` points to whatever domain/path serves objects from that bucket (CDN, custom domain, public bucket URL, etc.).

### KV + R2-backed store with `transformAttachment`

```ts
// src/cloudflare-kv-r2-store.ts
import type {
  AirtableAttachment,
  AirtableAttachmentCacheContext,
  AirtableCacheStore,
} from 'ts-airtable'

/**
 * KV + R2-backed cache store:
 * - KV is used for normal record caching (list/get).
 * - R2 is used as a durable store for Airtable attachments.
 * - KV also stores a small JSON mapping attachment.id -> stable R2 URL
 *   so we don't reupload the same attachment over and over.
 */
export class CloudflareKvAndR2Store implements AirtableCacheStore {
  constructor(
    private readonly kv: KVNamespace,
    private readonly bucket: R2Bucket,
    private readonly publicBaseUrl: string,
  ) {}

  // ---------- Standard record caching (same as CloudflareKvStore) ----------

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const raw = await this.kv.get(key)
    if (raw == null) return undefined

    try {
      return JSON.parse(raw) as T
    } catch {
      return undefined
    }
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    const payload = JSON.stringify(value)
    const options: KVNamespacePutOptions = {}

    if (typeof ttlMs === 'number' && Number.isFinite(ttlMs)) {
      const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000))
      options.expirationTtl = ttlSeconds
    }

    await this.kv.put(key, payload, options)
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key)
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    let cursor: string | undefined

    do {
      const res = await this.kv.list({ prefix, cursor })
      await Promise.all(res.keys.map(k => this.kv.delete(k.name)))
      cursor = res.list_complete ? undefined : res.cursor
    } while (cursor)
  }

  // ---------- Attachment transformation using R2 ----------

  /**
   * Transform Airtable attachments by:
   * 1. Checking KV for an existing mapping attachment.id -> stable URL.
   * 2. If missing:
   *    - Download from Airtable's short-lived URL.
   *    - Upload into R2 under a deterministic key.
   *    - Store the new public URL in KV for future use.
   * 3. Return an attachment object whose `url` points at R2 instead of Airtable.
   */
  async transformAttachment(
    attachment: AirtableAttachment,
    ctx: AirtableAttachmentCacheContext,
  ): Promise<AirtableAttachment> {
    const mapKey = `attachment:${attachment.id}`

    // 1) Check KV for an existing mapping
    const cached = await this.kv.get(mapKey, { type: 'json' }).catch(() => null) as
      | { url: string }
      | null

    if (cached?.url) {
      return { ...attachment, url: cached.url }
    }

    // 2) No mapping yet → download from Airtable
    const resp = await fetch(attachment.url)
    if (!resp.ok) {
      // In practice you may want better error handling / logging here.
      // Falling back to the original attachment keeps things usable.
      return attachment
    }

    const data = await resp.arrayBuffer()

    // Build a reasonably descriptive R2 object key
    const safeFilename = encodeURIComponent(attachment.filename ?? 'file')
    const objectKey = [
      ctx.baseId,
      ctx.tableIdOrName,
      ctx.recordId ?? 'unknown-record',
      ctx.fieldName ?? 'unknown-field',
      `${attachment.id}-${safeFilename}`,
    ].join('/')

    // Upload into R2
    await this.bucket.put(objectKey, data, {
      httpMetadata: {
        contentType: attachment.type,
      },
    })

    // Construct a public URL – this depends on how you expose the bucket
    const publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`

    // Store mapping in KV so next time we skip re-upload
    await this.kv.put(mapKey, JSON.stringify({ url: publicUrl }), {
      // Optional TTL for the mapping itself; you can omit this to keep it forever
      expirationTtl: 60 * 60 * 24 * 7, // 7 days
    })

    // 3) Return a new attachment pointing at R2
    return {
      ...attachment,
      url: publicUrl,
    }
  }
}
```

This class can completely replace the earlier `CloudflareKvStore` if you want attachment handling in the same place. For purely record-only caching you can still use the simpler KV-only version.

### Using the KV + R2 store in a Worker

```ts
// src/worker-r2.ts
import type { Env } from './env' // includes AIRTABLE_CACHE, ATTACHMENTS_BUCKET, ATTACHMENTS_PUBLIC_BASE_URL
import { AirtableClient } from 'ts-airtable'
import { CloudflareKvAndR2Store } from './cloudflare-kv-r2-store'

interface Task {
  Name: string
  Screenshot?: { url: string }[]
}

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const cacheStore = new CloudflareKvAndR2Store(
      env.AIRTABLE_CACHE,
      env.ATTACHMENTS_BUCKET,
      env.ATTACHMENTS_PUBLIC_BASE_URL,
    )

    const client = new AirtableClient<Task>({
      apiKey: env.AIRTABLE_API_KEY,
      baseId: env.AIRTABLE_BASE_ID,
      recordsCache: {
        store: cacheStore,
        defaultTtlMs: 30_000,
      },
    })

    const page = await client.records.listRecords('Tasks', {
      view: 'Grid view',
      pageSize: 10,
    })

    // Any attachment fields in `page.records` will now have `url` pointing
    // at your R2 bucket instead of Airtable's short-lived URL.
    return new Response(JSON.stringify(page, null, 2), {
      headers: { 'content-type': 'application/json' },
    })
  },
} satisfies ExportedHandler<Env>
```

## 7. Tips & best practices

A few practical tips when using Cloudflare KV (and optionally R2) as a cache store:

- **Be mindful of `deleteByPrefix` cost**
  It uses `kv.list({ prefix })` which is powerful but not free. If you are doing very frequent writes, consider whether you really need aggressive invalidation or if TTL is enough.

- **Choose sensible TTLs**
  KV is great for cached API responses, but you probably don’t want multi-hour TTLs for highly dynamic Airtable bases. Start with something like 5–60 seconds and adjust.

- **Attachment strategy**

  - Use `transformAttachment` only if you actually need longer-lived URLs or your own storage domain. Otherwise you can skip it.
  - When you do use it, memoize by `attachment.id` (as in the example) to avoid repeatedly downloading and re-uploading the same file.

- **Error handling strategy**

  - Default behavior (`failOnCacheError: false`) means “cache is best-effort”.
  - Set `failOnCacheError: true` if you want cache failures to **break** your API call (and be caught by your outer try/catch).

- **Multiple bases / multi-tenant setups**
  The cache keys produced by Airtable TS already include `baseId` in their prefix, so you can safely reuse the same KV namespace and R2 bucket for multiple bases as long as you keep those prefixes in your object keys.

If you want a lighter-weight option and don’t need cross-region persistence, also check the built-in [InMemoryCacheStore](./caching.md#using-the-built-in-inmemorycachestore), which is edge-compatible and requires no external services.
