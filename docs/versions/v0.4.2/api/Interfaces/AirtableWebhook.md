# AirtableWebhook

Defined in: [types/webhook.ts:149](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L149)

A webhook configured on a base.

See "List webhooks" in Airtable Web API docs.


> \[`key`: `string`\]: `unknown`

Additional forward-compatible fields.

## Properties

### id

> **id**: `string`

Defined in: [types/webhook.ts:153](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L153)

Webhook ID, e.g. `"achXXXXXXXXXXXXXX"`.

***

### notificationUrl?

> `optional` **notificationUrl?**: `string`

Defined in: [types/webhook.ts:158](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L158)

Notification URL currently configured for this webhook, if any.

***

### areNotificationsEnabled

> **areNotificationsEnabled**: `boolean`

Defined in: [types/webhook.ts:163](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L163)

Whether notification pings are enabled for this webhook.

***

### isHookEnabled

> **isHookEnabled**: `boolean`

Defined in: [types/webhook.ts:171](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L171)

Whether the webhook itself is enabled.

Airtable may disable a webhook automatically when it becomes invalid
(for example, repeated failures).

***

### expirationTime

> **expirationTime**: `string`

Defined in: [types/webhook.ts:176](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L176)

When this webhook will expire unless it is refreshed.

***

### cursorForNextPayload

> **cursorForNextPayload**: `number`

Defined in: [types/webhook.ts:184](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L184)

Cursor associated with the next payload that will be generated.

Used together with the "List webhook payloads" endpoint to resume
from a specific position.

***

### lastSuccessfulNotificationTime?

> `optional` **lastSuccessfulNotificationTime?**: `string` \| `null`

Defined in: [types/webhook.ts:189](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L189)

Timestamp of the last successful notification, if any.

***

### lastNotificationResult?

> `optional` **lastNotificationResult?**: \{\[`key`: `string`\]: `unknown`; `completionTimestamp?`: `string`; `durationMs?`: `number`; `retryNumber?`: `number`; `success?`: `boolean`; \} \| `null`

Defined in: [types/webhook.ts:194](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L194)

Information about the last notification attempt, if any.

***

### specification

> **specification**: [`AirtableWebhookSpecification`](AirtableWebhookSpecification.md)

Defined in: [types/webhook.ts:205](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L205)

The specification originally used to create the webhook.
