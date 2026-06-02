# AirtableRequestScheduler

Defined in: [types/observability.ts:175](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L175)

Scheduler hook used to delay or serialize HTTP attempts before `fetch`.

Custom schedulers can implement request queues, shared rate limiters,
distributed throttling, tracing, or circuit breakers. The scheduler receives
a callback that performs exactly one HTTP attempt and must return its result.

## Properties

### schedule

> **schedule**: \<`T`\>(`run`, `context`) => `Promise`\<`T`\>

Defined in: [types/observability.ts:183](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L183)

Schedule a single HTTP attempt.

#### Type Parameters

##### T

`T`

#### Parameters

##### run

() => `Promise`\<`T`\>

Callback that performs the actual `fetch` attempt.

##### context

[`AirtableRequestContext`](AirtableRequestContext.md)

Request metadata for this attempt. It omits headers and
bodies, but its URL may contain Airtable query values.

#### Returns

`Promise`\<`T`\>
