# computeAirtableWebhookSignature()

> **computeAirtableWebhookSignature**(`options`): `Promise`\<`string`\>

Defined in: [webhook-verification.ts:140](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L140)

Compute the expected Airtable webhook signature for a raw request body.

The returned value includes Airtable's `hmac-sha256=` prefix, so it can be
compared directly to `X-Airtable-Content-MAC` or used in tests.

## Parameters

### options

[`ComputeAirtableWebhookSignatureOptions`](../Interfaces/ComputeAirtableWebhookSignatureOptions.md)

## Returns

`Promise`\<`string`\>
