# AirtableCacheStore

Defined in: [types/cache-store.ts:119](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/cache-store.ts#L119)

Abstraction over a key–value cache used by the Airtable client.

Implementations can be **synchronous** (e.g. in-memory map) or
**asynchronous** (e.g. Redis, Cloudflare KV). Each method may either
return its value directly or a Promise that resolves to that value.

All TTL values are expressed in **milliseconds** and are interpreted
relative to the time `set` is called (e.g. `30_000` = 30 seconds).

Minimal requirements:

- `get` and `set` **must** be implemented.
- `delete` and `deleteByPrefix` are optional and will only be used
  when mutation should invalidate cached entries.

Implementations are expected to:

- Respect TTL semantics if they support expiration.
- Treat a missing or expired entry as `undefined`.
- Be safe to use across multiple keys within the same process.

## Examples

```ts
// A minimal synchronous implementation (no TTL, no invalidation)
const store: AirtableCacheStore = {
  get(key) {
    return localMap.get(key)
  },
  set(key, value) {
    localMap.set(key, value)
  },
}
```

```ts
// A simple async KV-style implementation
const store: AirtableCacheStore = {
  async get(key) {
    const raw = await env.MY_KV.get(key)
    return raw ? JSON.parse(raw) : undefined
  },
  async set(key, value, ttlMs) {
    const serialized = JSON.stringify(value)
    await env.MY_KV.put(key, serialized, ttlMs ? { expirationTtl: ttlMs / 1000 } : undefined)
  },
  async delete(key) {
    await env.MY_KV.delete(key)
  },
}
```

## Properties

### get

> **get**: \<`T`\>(`key`) => `T` \| `Promise`\<`T` \| `undefined`\> \| `undefined`

Defined in: [types/cache-store.ts:135](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/cache-store.ts#L135)

Retrieves a cached value by key.

Implementations should:

- Return `undefined` when the key is missing or the entry is expired.
- Respect TTL if the backend supports expiration.

#### Type Parameters

##### T

`T` = `unknown`

Expected type of the cached value.

#### Parameters

##### key

`string`

Cache key previously used in [AirtableCacheStore.set](#set).

#### Returns

`T` \| `Promise`\<`T` \| `undefined`\> \| `undefined`

The cached value (typed as `T`) or `undefined`.
         May be returned directly or wrapped in a Promise.

***

### set

> **set**: \<`T`\>(`key`, `value`, `ttlMs?`) => `void` \| `Promise`\<`void`\>

Defined in: [types/cache-store.ts:158](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/cache-store.ts#L158)

Stores a value in the cache for the given key.

Implementations are free to decide how TTL is handled; a typical
behavior is to compute `expiresAt = Date.now() + ttlMs` and discard
entries once expired.

If `ttlMs` is omitted or `undefined`, implementations may:

- Store entries without expiration, or
- Fall back to a default TTL.

#### Type Parameters

##### T

`T` = `unknown`

Type of the value to be stored.

#### Parameters

##### key

`string`

Cache key under which the value will be stored.

##### value

`T`

Value to store.

##### ttlMs?

`number`

Optional time-to-live in **milliseconds**.

#### Returns

`void` \| `Promise`\<`void`\>

Either `void` or a Promise that resolves once the value
         has been written.

***

### delete?

> `optional` **delete?**: (`key`) => `void` \| `Promise`\<`void`\>

Defined in: [types/cache-store.ts:173](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/cache-store.ts#L173)

Deletes a single cache entry by key.

This method is optional. If omitted, mutation-triggered invalidation
(e.g. after creating/updating a record) will not delete individual keys.

Implementations should not throw when the key does not exist.

#### Parameters

##### key

`string`

Cache key to remove.

#### Returns

`void` \| `Promise`\<`void`\>

Either `void` or a Promise that resolves when the entry
         has been removed.

***

### deleteByPrefix?

> `optional` **deleteByPrefix?**: (`prefix`) => `void` \| `Promise`\<`void`\>

Defined in: [types/cache-store.ts:192](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/cache-store.ts#L192)

Deletes all cache entries whose keys start with the given prefix.

This is typically used for invalidating groups of keys, for example:

- All list queries for a table (using `tablePrefix(baseId, table)`).
- All cached views of a single record (using `recordPrefix(...)`).

This method is optional. If omitted, prefix-based invalidation
will be skipped (the cache will still work, but may serve stale data
after mutations unless you call `delete` manually).

#### Parameters

##### prefix

`string`

String prefix to match against cache keys.

#### Returns

`void` \| `Promise`\<`void`\>

Either `void` or a Promise that resolves when all matching
         entries have been removed.

***

### transformAttachment?

> `optional` **transformAttachment?**: (`attachment`, `ctx`) => [`AirtableAttachment`](AirtableAttachment.md) \| `Promise`\<[`AirtableAttachment`](AirtableAttachment.md)\>

Defined in: [types/cache-store.ts:206](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/cache-store.ts#L206)

Optional hook for rewriting Airtable attachment objects
before they are cached (and returned).

Called **once per attachment object** when records contain
`AirtableAttachment[]` fields.

Implementations can:
- Mirror the file to their own storage and replace `.url`
- Do id-based deduplication (att.id is stable while file doesn't change)
- Strip thumbnails, normalize filenames, etc.

#### Parameters

##### attachment

[`AirtableAttachment`](AirtableAttachment.md)

##### ctx

[`AirtableAttachmentCacheContext`](AirtableAttachmentCacheContext.md)

#### Returns

[`AirtableAttachment`](AirtableAttachment.md) \| `Promise`\<[`AirtableAttachment`](AirtableAttachment.md)\>
