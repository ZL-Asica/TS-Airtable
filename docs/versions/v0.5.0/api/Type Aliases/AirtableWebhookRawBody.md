# AirtableWebhookRawBody

> **AirtableWebhookRawBody** = `string` \| `ArrayBuffer` \| `ArrayBufferView`

Defined in: [webhook-verification.ts:18](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L18)

Raw request body accepted by the webhook verification helpers.

Always pass the exact raw body bytes received by your HTTP server. Parsing
JSON and then stringifying it again will usually change whitespace or key
ordering and make signature verification fail.
