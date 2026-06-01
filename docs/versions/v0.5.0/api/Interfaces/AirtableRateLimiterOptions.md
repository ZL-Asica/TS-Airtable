# AirtableRateLimiterOptions

Defined in: [rate-limiter.ts:10](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L10)

Options for the built-in per-process Airtable request rate limiter.

## Properties

### requestsPerSecond?

> `optional` **requestsPerSecond?**: `number`

Defined in: [rate-limiter.ts:20](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L20)

Maximum number of request attempts allowed per second.

Airtable's public Web API limit is commonly enforced per base, so the
default is `5` requests per second. If you share a single limiter across
clients for the same base, keep this value at or below Airtable's limit.

Default: `5`.

***

### maxConcurrent?

> `optional` **maxConcurrent?**: `number`

Defined in: [rate-limiter.ts:31](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L31)

Maximum number of request attempts that may run at the same time.

The limiter still spaces out start times according to
[requestsPerSecond](#requestspersecond); this option mainly protects long-running
requests from piling up.

Default: `5`.

***

### onDelay?

> `optional` **onDelay?**: (`event`) => `void`

Defined in: [rate-limiter.ts:39](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L39)

Optional delay callback used for metrics and tests.

The SDK wires this into `observability.onRateLimit` when the limiter is
configured through `new AirtableClient({ rateLimiter: ... })`.

#### Parameters

##### event

[`AirtableRequestRateLimitEvent`](AirtableRequestRateLimitEvent.md)

#### Returns

`void`

***

### now?

> `optional` **now?**: () => `number`

Defined in: [rate-limiter.ts:46](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L46)

**`Internal`**

Custom clock, primarily useful for deterministic tests.

#### Returns

`number`

***

### sleep?

> `optional` **sleep?**: (`ms`) => `Promise`\<`void`\>

Defined in: [rate-limiter.ts:53](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L53)

**`Internal`**

Custom sleep function, primarily useful for deterministic tests.

#### Parameters

##### ms

`number`

#### Returns

`Promise`\<`void`\>
