# AirtableRateLimiter

Defined in: [rate-limiter.ts:83](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L83)

Small in-memory request scheduler for Airtable's per-base request limits.

The limiter is process-local. In serverless or multi-process deployments,
each instance has its own queue; use a custom [AirtableRequestScheduler](../Interfaces/AirtableRequestScheduler.md)
when you need distributed throttling.

## Example

```ts
import { AirtableClient, AirtableRateLimiter } from 'ts-airtable'

const limiter = new AirtableRateLimiter({ requestsPerSecond: 5 })

const client = new AirtableClient({
  apiKey: process.env.AIRTABLE_API_KEY!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  requestScheduler: limiter,
})
```

## Implements

- [`AirtableRequestScheduler`](../Interfaces/AirtableRequestScheduler.md)

## Constructors

### Constructor

> **new AirtableRateLimiter**(`options?`): `AirtableRateLimiter`

Defined in: [rate-limiter.ts:97](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L97)

Create a per-process Airtable request limiter.

#### Parameters

##### options?

[`AirtableRateLimiterOptions`](../Interfaces/AirtableRateLimiterOptions.md) = `{}`

#### Returns

`AirtableRateLimiter`

## Methods

### schedule()

> **schedule**\<`T`\>(`run`, `context`): `Promise`\<`T`\>

Defined in: [rate-limiter.ts:122](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/rate-limiter.ts#L122)

Schedule one Airtable HTTP attempt.

Requests are started in FIFO order. Start times are spaced by
`1000 / requestsPerSecond` milliseconds and no more than
`maxConcurrent` attempts run at once.

#### Type Parameters

##### T

`T`

#### Parameters

##### run

() => `Promise`\<`T`\>

##### context

[`AirtableRequestContext`](../Interfaces/AirtableRequestContext.md)

#### Returns

`Promise`\<`T`\>

#### Implementation of

[`AirtableRequestScheduler`](../Interfaces/AirtableRequestScheduler.md).[`schedule`](../Interfaces/AirtableRequestScheduler.md#schedule)
