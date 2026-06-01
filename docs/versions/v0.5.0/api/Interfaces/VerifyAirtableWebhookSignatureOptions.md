# VerifyAirtableWebhookSignatureOptions

Defined in: [webhook-verification.ts:86](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L86)

Options for verifying an Airtable webhook signature.

## Extends

- [`ComputeAirtableWebhookSignatureOptions`](ComputeAirtableWebhookSignatureOptions.md)

## Extended by

- [`VerifyAirtableWebhookNotificationOptions`](VerifyAirtableWebhookNotificationOptions.md)

## Properties

### body

> **body**: [`AirtableWebhookRawBody`](../Type Aliases/AirtableWebhookRawBody.md)

Defined in: [webhook-verification.ts:68](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L68)

Raw request body bytes or string exactly as received.

#### Inherited from

[`ComputeAirtableWebhookSignatureOptions`](ComputeAirtableWebhookSignatureOptions.md).[`body`](ComputeAirtableWebhookSignatureOptions.md#body)

***

### macSecretBase64

> **macSecretBase64**: `string`

Defined in: [webhook-verification.ts:73](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L73)

`macSecretBase64` returned by Airtable when the webhook was created.

#### Inherited from

[`ComputeAirtableWebhookSignatureOptions`](ComputeAirtableWebhookSignatureOptions.md).[`macSecretBase64`](ComputeAirtableWebhookSignatureOptions.md#macsecretbase64)

***

### crypto?

> `optional` **crypto?**: `Pick`\<`Crypto`, `"subtle"`\>

Defined in: [webhook-verification.ts:80](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L80)

Optional Web Crypto implementation for tests or non-standard runtimes.

Defaults to `globalThis.crypto`.

#### Inherited from

[`ComputeAirtableWebhookSignatureOptions`](ComputeAirtableWebhookSignatureOptions.md).[`crypto`](ComputeAirtableWebhookSignatureOptions.md#crypto)

***

### signature

> **signature**: `string` \| `null` \| `undefined`

Defined in: [webhook-verification.ts:93](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L93)

Signature from `X-Airtable-Content-MAC`.

Both Airtable's `hmac-sha256=<hex>` format and a raw hex digest are
accepted.
