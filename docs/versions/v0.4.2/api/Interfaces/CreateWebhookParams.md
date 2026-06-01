# CreateWebhookParams

Defined in: [types/webhook.ts:98](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L98)

Parameters for creating a webhook on a base.

## Properties

### notificationUrl?

> `optional` **notificationUrl?**: `string` \| `null`

Defined in: [types/webhook.ts:105](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L105)

URL that Airtable will POST webhook pings to.

If omitted or set to `null`, you can still poll changes using the
"List webhook payloads" endpoint and ignore push notifications.

***

### specification

> **specification**: [`AirtableWebhookSpecification`](AirtableWebhookSpecification.md)

Defined in: [types/webhook.ts:111](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L111)

Webhook configuration that describes which changes you want
to listen for. Must follow Airtable's Webhooks specification.
