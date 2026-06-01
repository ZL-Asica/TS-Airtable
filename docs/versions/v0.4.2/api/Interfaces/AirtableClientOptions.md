# AirtableClientOptions

Defined in: [types/client.ts:11](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L11)

Options for constructing an [AirtableClient](../Classes/AirtableClient.md) instance.

The same shape (without `baseId`) is also used by the high-level
`Airtable.configure(...)` helper as global defaults.

## Properties

### apiKey

> **apiKey**: `string`

Defined in: [types/client.ts:25](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L25)

Personal access token / OAuth token / legacy API key.

This value is sent as a Bearer token via the `Authorization` header.

#### Example

```ts
const client = new AirtableClient({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: 'appXXXXXXXXXXXXXX',
})
```

***

### apiVersion?

> `optional` **apiVersion?**: `string`

Defined in: [types/client.ts:37](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L37)

Optional Airtable API version string.

This is accepted for compatibility with the official `airtable` client.
When provided, the value is sent as `X-Airtable-API-Version`, while this
library continues to use Airtable's v0 HTTP path.

If you need to target a different API surface, prefer configuring
[endpointUrl](#endpointurl) instead (e.g. pointing at a proxy or mock).

***

### baseId

> **baseId**: `string`

Defined in: [types/client.ts:46](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L46)

The base ID, e.g. `"appXXXXXXXXXXXXXX"`.

The client is always bound to a single base. To work with multiple bases,
construct multiple `AirtableClient` instances (or use `Airtable.base(...)`
from the façade).

***

### customHeaders?

> `optional` **customHeaders?**: [`CustomHeaders`](../Type Aliases/CustomHeaders.md)

Defined in: [types/client.ts:54](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L54)

Global custom headers added to every request.

Values will be stringified. Per-request headers can still
override these.

***

### endpointUrl?

> `optional` **endpointUrl?**: `string`

Defined in: [types/client.ts:63](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L63)

Override Airtable API root URL.

Defaults to `https://api.airtable.com`. You generally do not need to
customize this unless you are using a proxy, mock server, or testing
environment.

***

### fetch?

> `optional` **fetch?**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [types/client.ts:77](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L77)

Custom fetch implementation.

Useful for:
- Custom HTTP agents (proxy, retries, logging, etc.)
- Tests, where you may wish to mock fetch.

If omitted, the global `fetch` function is used.

This also makes it possible to use the client in edge runtimes or
other environments that provide a standards-compliant `fetch`.

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`URL` \| `RequestInfo`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`string` \| `URL` \| `Request`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

***

### noRetryIfRateLimited?

> `optional` **noRetryIfRateLimited?**: `boolean`

Defined in: [types/client.ts:91](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L91)

When `true`, 429 ("Rate limited") responses are **not** retried, even if
429 is present in [retryOnStatuses](#retryonstatuses).

This flag is equivalent to removing `429` from `retryOnStatuses`, but
can be more convenient in simple setups.

Default: `false`.

If you need fine-grained control over which statuses are retried, prefer
setting [retryOnStatuses](#retryonstatuses) explicitly.

***

### maxRetries?

> `optional` **maxRetries?**: `number`

Defined in: [types/client.ts:101](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L101)

Maximum number of retry attempts for retryable HTTP status codes.

This controls how many times a single request may be retried when the
response status is one of [retryOnStatuses](#retryonstatuses).

Default: `5`.

***

### retryInitialDelayMs?

> `optional` **retryInitialDelayMs?**: `number`

Defined in: [types/client.ts:114](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L114)

Initial delay (in milliseconds) for exponential backoff.

Example progression (no `Retry-After` header, 20% jitter ignored):
- attempt 0: `retryInitialDelayMs`
- attempt 1: `retryInitialDelayMs * 2`
- attempt 2: `retryInitialDelayMs * 4`
- ...

Default: `500`.

***

### retryOnStatuses?

> `optional` **retryOnStatuses?**: `number`[]

Defined in: [types/client.ts:125](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L125)

HTTP status codes that should be retried.

Defaults to `[429, 500, 502, 503, 504]`.
Set to `[]` to disable automatic retries entirely.

Combined with [noRetryIfRateLimited](#noretryifratelimited), you can quickly toggle
whether 429 is retried or not.

***

### recordsCache?

> `optional` **recordsCache?**: [`AirtableRecordsCacheOptions`](AirtableRecordsCacheOptions.md)

Defined in: [types/client.ts:154](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/client.ts#L154)

Options for caching Airtable records at the SDK level.

When provided, read operations such as `listRecords`, `listAllRecords`,
`iterateRecords` (first page), and `getRecord` can reuse cached responses
instead of hitting the Airtable HTTP API every time.

Under the hood this delegates to an [AirtableCacheStore](AirtableCacheStore.md)
implementation (for example the built-in `InMemoryCacheStore`) and uses
stable, prefixed keys derived from:

- `baseId`
- table name / ID
- normalized request params (e.g. view, filter, sorts, etc.)

Use this to:

- Reduce latency and API usage for repeated reads
- Shield your app from short bursts of traffic
- Plug in shared stores like Redis / Cloudflare KV / Upstash, etc.

When omitted, the client performs no caching and every read is sent
directly to Airtable.

This option can also be set globally via `Airtable.configure({ recordsCache })`
and overridden per-base via `Airtable.base(baseId, { recordsCache })`.
