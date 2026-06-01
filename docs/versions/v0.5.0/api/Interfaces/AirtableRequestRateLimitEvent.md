# AirtableRequestRateLimitEvent

Defined in: [types/observability.ts:106](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L106)

Event emitted when a request waits inside an SDK scheduler or rate limiter.

## Extends

- [`AirtableRequestContext`](AirtableRequestContext.md)

## Properties

### requestId

> **requestId**: `string`

Defined in: [types/observability.ts:26](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L26)

Unique identifier for this logical SDK request.

Retries keep the same `requestId` and increment [attempt](AirtableRequestContext.md#attempt).

#### Inherited from

[`AirtableRequestContext`](AirtableRequestContext.md).[`requestId`](AirtableRequestContext.md#requestid)

***

### baseId

> **baseId**: `string`

Defined in: [types/observability.ts:31](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L31)

Base id configured on the client that is making the request.

#### Inherited from

[`AirtableRequestContext`](AirtableRequestContext.md).[`baseId`](AirtableRequestContext.md#baseid)

***

### method

> **method**: [`AirtableRequestMethod`](../Type Aliases/AirtableRequestMethod.md)

Defined in: [types/observability.ts:36](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L36)

HTTP method used for this attempt.

#### Inherited from

[`AirtableRequestContext`](AirtableRequestContext.md).[`method`](AirtableRequestContext.md#method)

***

### url

> **url**: `string`

Defined in: [types/observability.ts:44](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L44)

Fully resolved request URL.

This may contain Airtable query parameters such as view names, field names,
formulas, and offsets. It never includes API keys or request headers.

#### Inherited from

[`AirtableRequestContext`](AirtableRequestContext.md).[`url`](AirtableRequestContext.md#url)

***

### attempt

> **attempt**: `number`

Defined in: [types/observability.ts:51](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L51)

Zero-based attempt number.

`0` is the initial request. Retries increment this value.

#### Inherited from

[`AirtableRequestContext`](AirtableRequestContext.md).[`attempt`](AirtableRequestContext.md#attempt)

***

### delayMs

> **delayMs**: `number`

Defined in: [types/observability.ts:110](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L110)

Delay before this attempt is allowed to start.
