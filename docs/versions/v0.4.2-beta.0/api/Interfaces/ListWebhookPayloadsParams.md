# ListWebhookPayloadsParams

Defined in: [types/webhook.ts:312](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L312)

Parameters for listing webhook payloads.

Used with the "List webhook payloads" endpoint.

## Properties

### cursor?

> `optional` **cursor?**: `number`

Defined in: [types/webhook.ts:319](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L319)

Cursor for the first payload to retrieve.

If omitted, Airtable will return the earliest available payloads
for this webhook.

***

### limit?

> `optional` **limit?**: `number`

Defined in: [types/webhook.ts:324](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L324)

Maximum number of payloads to return in a single call.
