# AirtableRequestContext

Defined in: [types/observability.ts:20](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L20)

Shared metadata emitted by request observability hooks and schedulers.

Sensitive headers and request bodies are intentionally omitted. The URL may
still contain Airtable query parameters such as view names, field names, and
formulas; redact or sample it before forwarding events to shared logs.

## Extended by

- [`AirtableRequestEndEvent`](AirtableRequestEndEvent.md)
- [`AirtableRequestRetryEvent`](AirtableRequestRetryEvent.md)
- [`AirtableRequestRateLimitEvent`](AirtableRequestRateLimitEvent.md)
- [`AirtableRequestErrorEvent`](AirtableRequestErrorEvent.md)

## Properties

### requestId

> **requestId**: `string`

Defined in: [types/observability.ts:26](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L26)

Unique identifier for this logical SDK request.

Retries keep the same `requestId` and increment [attempt](#attempt).

***

### baseId

> **baseId**: `string`

Defined in: [types/observability.ts:31](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L31)

Base id configured on the client that is making the request.

***

### method

> **method**: [`AirtableRequestMethod`](../Type Aliases/AirtableRequestMethod.md)

Defined in: [types/observability.ts:36](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L36)

HTTP method used for this attempt.

***

### url

> **url**: `string`

Defined in: [types/observability.ts:44](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L44)

Fully resolved request URL.

This may contain Airtable query parameters such as view names, field names,
formulas, and offsets. It never includes API keys or request headers.

***

### attempt

> **attempt**: `number`

Defined in: [types/observability.ts:51](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/observability.ts#L51)

Zero-based attempt number.

`0` is the initial request. Retries increment this value.
