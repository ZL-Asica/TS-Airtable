# CreateWebhookResult

Defined in: [types/webhook.ts:119](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/webhook.ts#L119)

Response returned when a webhook is created.

See "Create a webhook" in Airtable Web API docs.


> \[`key`: `string`\]: `unknown`

Additional forward-compatible fields.

## Properties

### id

> **id**: `string`

Defined in: [types/webhook.ts:123](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/webhook.ts#L123)

Identifier of the webhook, e.g. `"achXXXXXXXXXXXXXX"`.

***

### macSecretBase64

> **macSecretBase64**: `string`

Defined in: [types/webhook.ts:130](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/webhook.ts#L130)

Secret used to validate webhook signatures.

See Airtable docs for how to verify webhook requests using this value.

***

### expirationTime

> **expirationTime**: `string`

Defined in: [types/webhook.ts:136](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/webhook.ts#L136)

ISO-8601 timestamp when this webhook will expire
unless it is refreshed.
