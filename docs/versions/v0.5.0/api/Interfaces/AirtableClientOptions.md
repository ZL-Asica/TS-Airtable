# AirtableClientOptions

Defined in: [types/client.ts:16](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L16)

Options for constructing an [AirtableClient](../Classes/AirtableClient.md) instance.

The same shape (without `baseId`) is also used by the high-level
`Airtable.configure(...)` helper as global defaults.

## Properties

### apiKey

> **apiKey**: `string`

Defined in: [types/client.ts:30](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L30)

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

Defined in: [types/client.ts:42](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L42)

Optional Airtable API version string.

This is accepted for compatibility with the official `airtable` client.
When provided, the value is sent as `X-Airtable-API-Version`, while this
library continues to use Airtable's v0 HTTP path.

If you need to target a different API surface, prefer configuring
[endpointUrl](#endpointurl) instead (e.g. pointing at a proxy or mock).

***

### baseId

> **baseId**: `string`

Defined in: [types/client.ts:51](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L51)

The base ID, e.g. `"appXXXXXXXXXXXXXX"`.

The client is always bound to a single base. To work with multiple bases,
construct multiple `AirtableClient` instances (or use `Airtable.base(...)`
from the façade).

***

### customHeaders?

> `optional` **customHeaders?**: [`CustomHeaders`](../Type Aliases/CustomHeaders.md)

Defined in: [types/client.ts:59](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L59)

Global custom headers added to every request.

Values will be stringified. Per-request headers can still
override these.

***

### endpointUrl?

> `optional` **endpointUrl?**: `string`

Defined in: [types/client.ts:68](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L68)

Override Airtable API root URL.

Defaults to `https://api.airtable.com`. You generally do not need to
customize this unless you are using a proxy, mock server, or testing
environment.

***

### fetch?

> `optional` **fetch?**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [types/client.ts:82](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L82)

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

Defined in: [types/client.ts:96](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L96)

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

Defined in: [types/client.ts:106](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L106)

Maximum number of retry attempts for retryable HTTP status codes.

This controls how many times a single request may be retried when the
response status is one of [retryOnStatuses](#retryonstatuses).

Default: `5`.

***

### retryInitialDelayMs?

> `optional` **retryInitialDelayMs?**: `number`

Defined in: [types/client.ts:119](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L119)

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

Defined in: [types/client.ts:130](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L130)

HTTP status codes that should be retried.

Defaults to `[429, 500, 502, 503, 504]`.
Set to `[]` to disable automatic retries entirely.

Combined with [noRetryIfRateLimited](#noretryifratelimited), you can quickly toggle
whether 429 is retried or not.

***

### recordsCache?

> `optional` **recordsCache?**: [`AirtableRecordsCacheOptions`](AirtableRecordsCacheOptions.md)

Defined in: [types/client.ts:159](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L159)

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

***

### observability?

> `optional` **observability?**: [`AirtableObservabilityHooks`](AirtableObservabilityHooks.md)

Defined in: [types/client.ts:173](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L173)

Lightweight lifecycle hooks for production logging and metrics.

These hooks receive request metadata such as URL, method, base id, attempt
number, status, retry delay, and duration. They intentionally do not
include request headers or bodies so API keys and request payloads are not
logged by default. URLs can still contain Airtable query values such as
formulas, view names, field names, and offsets; redact them when needed.

Hook failures are swallowed by the SDK. Observability code should never
make Airtable requests fail.

***

### requestScheduler?

> `optional` **requestScheduler?**: [`AirtableRequestScheduler`](AirtableRequestScheduler.md)

Defined in: [types/client.ts:183](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L183)

Optional scheduler that wraps every HTTP attempt before `fetch` is called.

Use this when you want to enforce a shared queue, rate limiter, circuit
breaker, or tracing boundary around Airtable requests. The built-in
`AirtableRateLimiter` implements this interface for common per-process
throttling.

***

### rateLimiter?

> `optional` **rateLimiter?**: `boolean` \| [`AirtableRateLimiterOptions`](AirtableRateLimiterOptions.md)

Defined in: [types/client.ts:196](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/client.ts#L196)

Convenience configuration for the built-in `AirtableRateLimiter`.

- `true` enables the default limiter (`5` request starts per second,
  up to `5` concurrent attempts).
- an options object customizes the limiter.

Use [requestScheduler](#requestscheduler) instead when you need a shared external
scheduler or distributed rate limiting. `rateLimiter` and
`requestScheduler` are mutually exclusive.
