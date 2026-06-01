# AirtableObservabilityHooks

Defined in: [types/observability.ts:141](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L141)

Lightweight observability hooks for production logging and metrics.

The SDK calls these hooks best-effort. If a hook throws, the hook error is
swallowed so logging or metrics code cannot break Airtable requests.

## Properties

### onRequestStart?

> `optional` **onRequestStart?**: (`event`) => `void`

Defined in: [types/observability.ts:145](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L145)

Called immediately before an HTTP attempt is scheduled.

#### Parameters

##### event

[`AirtableRequestContext`](AirtableRequestContext.md)

#### Returns

`void`

***

### onRequestEnd?

> `optional` **onRequestEnd?**: (`event`) => `void`

Defined in: [types/observability.ts:150](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L150)

Called after an HTTP attempt receives a response.

#### Parameters

##### event

[`AirtableRequestEndEvent`](AirtableRequestEndEvent.md)

#### Returns

`void`

***

### onRetry?

> `optional` **onRetry?**: (`event`) => `void`

Defined in: [types/observability.ts:155](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L155)

Called before a retry delay is applied.

#### Parameters

##### event

[`AirtableRequestRetryEvent`](AirtableRequestRetryEvent.md)

#### Returns

`void`

***

### onRateLimit?

> `optional` **onRateLimit?**: (`event`) => `void`

Defined in: [types/observability.ts:160](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L160)

Called when a request waits inside a configured scheduler or rate limiter.

#### Parameters

##### event

[`AirtableRequestRateLimitEvent`](AirtableRequestRateLimitEvent.md)

#### Returns

`void`

***

### onError?

> `optional` **onError?**: (`event`) => `void`

Defined in: [types/observability.ts:165](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L165)

Called when a request fails and will not be retried.

#### Parameters

##### event

[`AirtableRequestErrorEvent`](AirtableRequestErrorEvent.md)

#### Returns

`void`
