# AirtableWebhookSpecification

Defined in: [types/webhook.ts:64](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L64)

Webhook specification passed when creating a webhook.

This is intentionally not fully closed over – you can add extra fields
according to Airtable's official Webhooks specification.

See: https://airtable.com/developers/web/api/model/webhooks-specification


> \[`key`: `string`\]: `unknown`

Additional forward-compatible fields.

## Properties

### options?

> `optional` **options?**: `object`

Defined in: [types/webhook.ts:68](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L68)

Options object, typically containing filters.

#### Index Signature

\[`key`: `string`\]: `unknown`

Additional option properties supported by Airtable.

#### filters?

> `optional` **filters?**: [`AirtableWebhookFilters`](AirtableWebhookFilters.md)

Filter configuration controlling which changes will be delivered
to this webhook.

***

### scope?

> `optional` **scope?**: `Record`\<`string`, `unknown`\>

Defined in: [types/webhook.ts:87](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L87)

Optional scope configuration (for example, scoping to a view or table).

The exact shape depends on what kind of webhook you are creating and
is documented in Airtable's Webhooks specification.
