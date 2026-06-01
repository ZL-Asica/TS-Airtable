# InMemoryCacheStore

Defined in: [memory-cache-store.ts:28](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/memory-cache-store.ts#L28)

In-memory implementation of [AirtableCacheStore](../Interfaces/AirtableCacheStore.md) with:

- **LRU (least recently used) eviction** when `maxSize` is reached.
- **Per-entry TTL support** (time-to-live, in milliseconds).
- **Prefix-based deletion** for grouped invalidation (e.g. all keys for a table).

This is intended as a simple, zero-dependency cache for environments like
Node.js or Cloudflare Workers. It uses a `Map` internally and relies on
insertion order to track LRU state:

- Every `get()` of a non-expired entry marks it as most recently used.
- Every `set()` marks the key as most recently used.
- When capacity is exceeded, the **least recently used** key is evicted.

TTL is enforced lazily:

- On `get()`, if the entry is expired, it is removed and `undefined` is returned.
- On `set()`, before evicting for capacity, the cache will try to drop any
  expired entry first (if found).

This class is not meant to be shared across multiple processes; it is strictly
in-memory for a single runtime.

## Implements

- [`AirtableCacheStore`](../Interfaces/AirtableCacheStore.md)

## Constructors

### Constructor

> **new InMemoryCacheStore**(`maxSize?`): `InMemoryCacheStore`

Defined in: [memory-cache-store.ts:70](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/memory-cache-store.ts#L70)

Creates a new in-memory cache store.

#### Parameters

##### maxSize?

`number` = `1000`

Maximum number of entries the cache will hold.
  When the limit is reached, the **least recently used** entry is evicted.
  Defaults to `1000`.

#### Returns

`InMemoryCacheStore`

#### Examples

```ts
// Basic usage with default capacity
const cache = new InMemoryCacheStore()
```

```ts
// Custom capacity (e.g. keep at most 100 entries)
const cache = new InMemoryCacheStore(100)
```

## Methods

### get()

> **get**\<`T`\>(`key`): `T` \| `undefined`

Defined in: [memory-cache-store.ts:97](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/memory-cache-store.ts#L97)

Retrieves a cached value if present and not expired.

Accessing a non-expired key marks it as **most recently used**
for LRU purposes.

If the entry has expired, it is removed and `undefined` is returned.

#### Type Parameters

##### T

`T` = `unknown`

Expected type of the cached value.

#### Parameters

##### key

`string`

Cache key to look up.

#### Returns

`T` \| `undefined`

The cached value typed as `T`, or `undefined` if the key
  is missing or expired.

#### Example

```ts
const value = cache.get<MyType>(key)
if (value) {
  // cache hit
} else {
  // cache miss
}
```

#### Implementation of

[`AirtableCacheStore`](../Interfaces/AirtableCacheStore.md).[`get`](../Interfaces/AirtableCacheStore.md#get)

***

### set()

> **set**\<`T`\>(`key`, `value`, `ttlMs?`): `void`

Defined in: [memory-cache-store.ts:145](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/memory-cache-store.ts#L145)

Stores a value in the cache, optionally with a TTL.

Setting an existing key updates its value and TTL and marks it as
most recently used.

When inserting a new key and the cache is at or above capacity,
the cache will:

1. Try to remove **one expired entry** (if any).
2. If none are expired, evict the **least recently used** entry.

#### Type Parameters

##### T

`T` = `unknown`

Type of the value being stored.

#### Parameters

##### key

`string`

Cache key. Should be globally unique for the data
  you are caching (e.g. include baseId, table, params, etc.).

##### value

`T`

Value to store.

##### ttlMs?

`number`

Optional TTL in milliseconds. If provided, the entry
  is considered expired once `Date.now() > createdAt + ttlMs`.

#### Returns

`void`

#### Examples

```ts
// Cache a list response for 10 seconds
const key = listKey(baseId, table, params)
cache.set(key, records, 10_000)
```

```ts
// Cache a single record without TTL
const key = getKey(baseId, table, recordId, params)
cache.set(key, record)
```

#### Implementation of

[`AirtableCacheStore`](../Interfaces/AirtableCacheStore.md).[`set`](../Interfaces/AirtableCacheStore.md#set)

***

### delete()

> **delete**(`key`): `void`

Defined in: [memory-cache-store.ts:176](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/memory-cache-store.ts#L176)

Deletes a single key from the cache, if present.

This does **not** throw if the key does not exist.

#### Parameters

##### key

`string`

Cache key to remove.

#### Returns

`void`

#### Example

```ts
cache.delete(getKey(baseId, table, recordId, params))
```

#### Implementation of

[`AirtableCacheStore`](../Interfaces/AirtableCacheStore.md).[`delete`](../Interfaces/AirtableCacheStore.md#delete)

***

### deleteByPrefix()

> **deleteByPrefix**(`prefix`): `void`

Defined in: [memory-cache-store.ts:201](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/memory-cache-store.ts#L201)

Deletes all keys that start with the given prefix.

This is useful for invalidating all cache entries for:

- A specific table: use something like `tablePrefix(baseId, table)`.
- A specific record: use `recordPrefix(baseId, table, recordId)`.

Complexity is O(n) over current cache size, since it needs to scan
all keys to check the prefix.

#### Parameters

##### prefix

`string`

String prefix to match against cache keys.

#### Returns

`void`

#### Examples

```ts
// Invalidate all list queries for a table
cache.deleteByPrefix(tablePrefix(baseId, table))
```

```ts
// Invalidate all cached views of a single record
cache.deleteByPrefix(recordPrefix(baseId, table, recordId))
```

#### Implementation of

[`AirtableCacheStore`](../Interfaces/AirtableCacheStore.md).[`deleteByPrefix`](../Interfaces/AirtableCacheStore.md#deletebyprefix)

***

### transformAttachment()

> **transformAttachment**(`attachment`, `_`): `Promise`\<[`AirtableAttachment`](../Interfaces/AirtableAttachment.md)\>

Defined in: [memory-cache-store.ts:264](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/memory-cache-store.ts#L264)

Transforms an Airtable attachment object before it is cached.

This sample implementation demonstrates **ID-based memoization**
without performing any network or filesystem I/O:

- It keeps an in-memory map keyed by `attachment.id`.
- The first time a given attachment ID is seen, the attachment
  is stored in attachmentById and returned as-is.
- Subsequent calls with the *same* `attachment.id` will return
  the previously stored attachment instance, avoiding repeated
  work for that attachment within the lifetime of this cache
  store instance.

This is intentionally conservative:

- It does **not** rely on browser APIs like `localStorage`, so it
  works in Node.js, Edge runtimes, and browsers.
- It does **not** attempt to download or re-host the file; the
  attachment’s `url` is left unchanged.

In a real-world application, this method is the place where you
would plug in heavier logic, for example:

- Downloading the attachment from Airtable using `attachment.url`.
- Uploading the bytes to your own storage (e.g. S3, R2, local
  filesystem, or a media CDN).
- Replacing `attachment.url` with a long-lived, stable URL that
  you control.

When you add that kind of logic, the `attachmentById` map ensures
that the expensive "download + upload" step only runs **once per
attachment ID** per cache-store instance, even if the same record
(or different records that reference the same attachment) is seen
many times.

#### Parameters

##### attachment

[`AirtableAttachment`](../Interfaces/AirtableAttachment.md)

The Airtable attachment object as returned by
  the Airtable API. At minimum it contains a stable `id` and a
  short-lived signed `url`.

##### _

[`AirtableAttachmentCacheContext`](../Interfaces/AirtableAttachmentCacheContext.md)

Context about where this attachment was found:
  base, table, record, and field name. This can be useful if your
  transformation wants to organize objects by location, e.g.
  `baseId/tableId/recordId/filename`.

#### Returns

`Promise`\<[`AirtableAttachment`](../Interfaces/AirtableAttachment.md)\>

The attachment object that should be written into the
  record cache. In this sample implementation it is the original
  attachment (or a previously memoized copy) without any changes.

#### Example

```ts
// Example of extending this implementation:
// 1. Subclass InMemoryCacheStore
// 2. Override `transformAttachment` to download + re-host files
// 3. Still call `super.transformAttachment(...)` to keep the
//    ID-based memoization behavior.
```

#### Implementation of

[`AirtableCacheStore`](../Interfaces/AirtableCacheStore.md).[`transformAttachment`](../Interfaces/AirtableCacheStore.md#transformattachment)
