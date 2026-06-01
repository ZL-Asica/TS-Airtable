# DeleteWebhookResult

Defined in: [types/webhook.ts:230](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/webhook.ts#L230)

Result returned when deleting a webhook.

Airtable currently responds with HTTP 204 and an empty body,
but this type is kept here for forward-compatibility in case
a structured response is added in the future.


> \[`key`: `string`\]: `unknown`

## Properties

### deleted?

> `optional` **deleted?**: `boolean`

Defined in: [types/webhook.ts:231](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/webhook.ts#L231)
