# verifyAirtableWebhookNotification()

> **verifyAirtableWebhookNotification**(`options`): `Promise`\<[`AirtableWebhookNotification`](../Interfaces/AirtableWebhookNotification.md)\>

Defined in: [webhook-verification.ts:219](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/webhook-verification.ts#L219)

Verify the signature and parse the Airtable webhook notification body.

Use this in request handlers when you have the raw body and the stored
`macSecretBase64` for the webhook.

## Parameters

### options

[`VerifyAirtableWebhookNotificationOptions`](../Interfaces/VerifyAirtableWebhookNotificationOptions.md)

## Returns

`Promise`\<[`AirtableWebhookNotification`](../Interfaces/AirtableWebhookNotification.md)\>
