# verifyAirtableWebhookSignature()

> **verifyAirtableWebhookSignature**(`options`): `Promise`\<`boolean`\>

Defined in: [webhook-verification.ts:173](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L173)

Verify an Airtable webhook notification signature in constant time.

Returns `false` for missing or malformed signatures. Throws only when the
runtime cannot perform HMAC-SHA256 verification.

## Parameters

### options

[`VerifyAirtableWebhookSignatureOptions`](../Interfaces/VerifyAirtableWebhookSignatureOptions.md)

## Returns

`Promise`\<`boolean`\>
