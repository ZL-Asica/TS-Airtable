# AirtableRecordsCacheOnErrorContext

Defined in: [types/cache-store.ts:255](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L255)

Context object passed to [AirtableRecordsCacheOptions.onError](AirtableRecordsCacheOptions.md#onerror)
whenever a cache operation throws.

This is meant to give you enough information to:

- Log what went wrong at the cache layer (key / prefix / op type)
- Decide whether to treat it as a soft warning or escalate
- Correlate with upstream application logs

It does **not** include the error itself — that is provided as the
first parameter to `onError(error, ctx)`.

### Semantics

- `op`:
  - `"get"`   — a call to `store.get(key)` failed
  - `"set"`   — a call to `store.set(key, value, ttlMs)` failed
  - `"delete"` — a call to `store.deleteByPrefix(prefix)` failed
- `key`:
  - Present only for `"get"` / `"set"` operations
  - Contains the fully constructed cache key
- `prefix`:
  - Present only for `"delete"` operations
  - Contains the prefix passed to `deleteByPrefix`, usually produced by
    helpers like `tablePrefix(...)` or `recordPrefix(...)`

## Example

```ts
const cacheOptions: AirtableRecordsCacheOptions = {
  store: myStore,
  onError(error, ctx) {
    console.warn('[airtable-cache]', {
      op: ctx.op,
      key: ctx.key,
      prefix: ctx.prefix,
      error,
    })
  },
  failOnCacheError: false, // keep cache failures non-fatal
}
```

## Properties

### op

> **op**: `"get"` \| `"set"` \| `"delete"`

Defined in: [types/cache-store.ts:263](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L263)

Type of cache operation that failed.

- `"get"`   — failure during a `cache.get(key)` call
- `"set"`   — failure during a `cache.set(key, value, ttlMs)` call
- `"delete"` — failure during a `cache.deleteByPrefix(prefix)` call

***

### key?

> `optional` **key?**: `string`

Defined in: [types/cache-store.ts:275](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L275)

Fully constructed cache key used for the operation, when applicable.

This is only set for:
- `op === "get"`
- `op === "set"`

For `"delete"` operations, this will be `undefined`, and you should
look at [AirtableRecordsCacheOnErrorContext.prefix](#prefix) instead.

***

### prefix?

> `optional` **prefix?**: `string`

Defined in: [types/cache-store.ts:287](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/cache-store.ts#L287)

Prefix used for bulk invalidation operations.

This is only set for:
- `op === "delete"` (i.e. `deleteByPrefix`)

It typically comes from helpers like:
- `tablePrefix(baseId, tableIdOrName)`
- `recordPrefix(baseId, tableIdOrName, recordId)`
