# AirtableWebhookNotification

Defined in: [webhook-verification.ts:27](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L27)

Minimal shape of the webhook notification ping sent to your
`notificationUrl`.

The ping only identifies the base and webhook. Fetch the actual changes via
`client.webhooks.listWebhookPayloads(...)`.

## Properties

### base

> **base**: `object`

Defined in: [webhook-verification.ts:31](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L31)

Base that changed.

#### id

> **id**: `string`

Airtable base id, e.g. `"appXXXXXXXXXXXXXX"`.

***

### webhook

> **webhook**: `object`

Defined in: [webhook-verification.ts:41](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L41)

Webhook that received the notification.

#### id

> **id**: `string`

Airtable webhook id, e.g. `"achXXXXXXXXXXXXXX"`.

***

### timestamp?

> `optional` **timestamp?**: `string`

Defined in: [webhook-verification.ts:51](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L51)

Airtable notification timestamp, when present.
