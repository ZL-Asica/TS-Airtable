# AirtableRecordsCacheOptions

Defined in: [types/cache-store.ts:325](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/cache-store.ts#L325)

Configuration options for the records-level cache used by the Airtable client.

An `AirtableRecordsCache` instance is responsible for caching the high-level
record operations exposed by the SDK, such as:

- `listRecords`
- `listAllRecords`
- `iterateRecords` (first page)
- `getRecord`

This options object allows you to:

- Plug in a custom backing store (e.g. Redis, Cloudflare KV).
- Change the default TTL for cached entries.
- Enable / disable caching for specific methods.

## Examples

```ts
// Use the default in-memory store with a 30-second TTL
const cache = new AirtableRecordsCache({
  defaultTtlMs: 30_000,
})
```

```ts
// Use a custom store and disable getRecord caching
const cache = new AirtableRecordsCache({
  store: myRedisStore,
  defaultTtlMs: 60_000,
  methods: {
    listRecords: true,
    listAllRecords: true,
    getRecord: false,
  },
})
```

## Properties

### store?

> `optional` **store?**: [`AirtableCacheStore`](AirtableCacheStore.md)

Defined in: [types/cache-store.ts:344](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/cache-store.ts#L344)

Underlying key–value store implementation.

If omitted, a default in-memory implementation will be used, which:

- Lives only within the current process/runtime.
- Is suitable for single-worker or development environments.

You can provide any implementation that conforms to
[AirtableCacheStore](AirtableCacheStore.md), including async ones.

#### Example

```ts
import { InMemoryCacheStore } from './in-memory-cache'

const cache = new AirtableRecordsCache({
  store: new InMemoryCacheStore(500),
})
```

***

### defaultTtlMs?

> `optional` **defaultTtlMs?**: `number`

Defined in: [types/cache-store.ts:362](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/cache-store.ts#L362)

Default time-to-live for cached entries (in milliseconds).

This TTL is applied when a cacheable operation is performed and the
specific call does not provide its own TTL. It affects:

- List operations (`listRecords`, `listAllRecords`, `iterateRecords` first page)
- Single-record operations (`getRecord`), if enabled in [AirtableRecordsCacheOptions.methods](#methods).

If omitted, the cache implementation may choose a sensible default
or store entries without expiration.

#### Example

```ts
// Cache for 30 seconds
const cache = new AirtableRecordsCache({ defaultTtlMs: 30_000 })
```

***

### failOnCacheError?

> `optional` **failOnCacheError?**: `boolean`

Defined in: [types/cache-store.ts:369](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/cache-store.ts#L369)

Throw an error when cache failed

Default false, no handle.

***

### onError?

> `optional` **onError?**: (`error`, `ctx`) => `void`

Defined in: [types/cache-store.ts:402](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/cache-store.ts#L402)

Optional callback invoked whenever a cache operation throws.

This is **purely observational**: it lets you log, trace, or collect
metrics about cache-layer failures without changing how the Airtable
client behaves by default.

The actual behavior on error is:

- `onError` (if provided) is called with:
  - the original `error` thrown by the cache store, and
  - a [AirtableRecordsCacheOnErrorContext](AirtableRecordsCacheOnErrorContext.md) describing the operation
    (`op`, `key`, `prefix`).
- If `failOnCacheError === true`, the error is then rethrown and will
  bubble up through the records API (e.g. `listRecords`, `getRecord`).
- Otherwise, the error is swallowed and the client behaves as if caching
  were disabled (i.e. cache miss / best-effort invalidation).

This callback is invoked from the internal helpers:

- `cacheGet`   → `op: "get"`
- `cacheSet`   → `op: "set"`
- `cacheDeleteByPrefix` → `op: "delete"`

#### Parameters

##### error

`unknown`

Error thrown by the underlying [AirtableCacheStore](AirtableCacheStore.md)
  during a `get`, `set`, or `deleteByPrefix` call.

##### ctx

[`AirtableRecordsCacheOnErrorContext`](AirtableRecordsCacheOnErrorContext.md)

Context about the cache operation being performed:
  - `ctx.op`: `"get" | "set" | "delete"`
  - `ctx.key?`: cache key used for `get` / `set`
  - `ctx.prefix?`: prefix used for `deleteByPrefix`

#### Returns

`void`

***

### methods?

> `optional` **methods?**: `object`

Defined in: [types/cache-store.ts:416](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/cache-store.ts#L416)

Per-method toggles to enable or disable caching behavior.

Any flag that is `false` or `undefined` is treated as "do not cache"
for that method. Omitted flags default to `true` in the implementation
(depending on how `AirtableRecordsCache` is wired).

This is useful if:

- Some methods are too dynamic to benefit from caching.
- You only want to cache list operations but not individual `getRecord` calls.

#### listRecords?

> `optional` **listRecords?**: `boolean`

Whether to cache the **first page** of list-based APIs.

This typically affects:

- `listRecords`
- `iterateRecords` (first page only; subsequent pages are usually streamed)

When enabled, keys are usually derived from:
- `baseId`, `table`, and normalized list parameters (e.g. `view`, `filterByFormula`).

##### Default Value

`true` (implementation-dependent)

#### listAllRecords?

> `optional` **listAllRecords?**: `boolean`

Whether to cache the **fully materialized** result of `listAllRecords`.

This can be very useful for moderately sized tables where the full
list is often requested, but can be memory-heavy for large tables.

When enabled, the entire aggregated result is cached under a single key.

##### Default Value

`true` (implementation-dependent)

#### getRecord?

> `optional` **getRecord?**: `boolean`

Whether to cache individual `getRecord` results.

This is usually safe and helpful for read-heavy workloads, but you may
want to disable it if:

- Records change very frequently.
- You prefer to always fetch the latest data from Airtable.

##### Default Value

`true` (implementation-dependent)
