# ListWebhookPayloadsResult

Defined in: [types/webhook.ts:332](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L332)

Response shape for **"List webhook payloads"**.

See: https://airtable.com/developers/web/api/list-webhook-payloads

## Properties

### payloads

> **payloads**: [`AirtableWebhookPayload`](AirtableWebhookPayload.md)[]

Defined in: [types/webhook.ts:336](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L336)

Payloads returned for this page.

***

### cursor?

> `optional` **cursor?**: `number`

Defined in: [types/webhook.ts:341](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L341)

Cursor you can pass to the next call to continue reading.

***

### mightHaveMore?

> `optional` **mightHaveMore?**: `boolean`

Defined in: [types/webhook.ts:346](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L346)

Whether there might be more payloads available.

***

### payloadFormat?

> `optional` **payloadFormat?**: `string`

Defined in: [types/webhook.ts:351](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L351)

Payload format identifier (e.g. `"v0"`).
