# ComputeAirtableWebhookSignatureOptions

Defined in: [webhook-verification.ts:64](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L64)

Options for computing an Airtable webhook signature.

## Extended by

- [`VerifyAirtableWebhookSignatureOptions`](VerifyAirtableWebhookSignatureOptions.md)

## Properties

### body

> **body**: [`AirtableWebhookRawBody`](../Type Aliases/AirtableWebhookRawBody.md)

Defined in: [webhook-verification.ts:68](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L68)

Raw request body bytes or string exactly as received.

***

### macSecretBase64

> **macSecretBase64**: `string`

Defined in: [webhook-verification.ts:73](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L73)

`macSecretBase64` returned by Airtable when the webhook was created.

***

### crypto?

> `optional` **crypto?**: `Pick`\<`Crypto`, `"subtle"`\>

Defined in: [webhook-verification.ts:80](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L80)

Optional Web Crypto implementation for tests or non-standard runtimes.

Defaults to `globalThis.crypto`.
