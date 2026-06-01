# AirtableWebhookFilters

Defined in: [types/webhook.ts:8](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L8)

Filters used inside the webhook specification.

This is a lightly-typed mirror of Airtable's Webhooks filters.
For the full model, see:
https://airtable.com/developers/web/api/model/webhooks-specification


> \[`key`: `string`\]: `unknown`

Any extra filter properties supported by Airtable.

This is intentionally left as a loose bag of `unknown` so the type
does not break when Airtable adds new filter fields.

## Properties

### dataTypes?

> `optional` **dataTypes?**: `string`[]

Defined in: [types/webhook.ts:18](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L18)

Data types this webhook should receive changes for.

Common values include:
- "tableData"
- "baseMetadata"

but this is kept as `string[]` so it remains future-compatible.

***

### recordChangeScope?

> `optional` **recordChangeScope?**: `string`

Defined in: [types/webhook.ts:25](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L25)

Limit notifications to changes in a particular table, given by its ID.

For example: `"tblXXXXXXXXXXXXXX"`.

***

### changeTypes?

> `optional` **changeTypes?**: `string`[]

Defined in: [types/webhook.ts:35](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L35)

Restrict notifications to specific change types.

Common values include:
- "create"
- "update"
- "delete"

***

### fromSources?

> `optional` **fromSources?**: `string`[]

Defined in: [types/webhook.ts:45](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/webhook.ts#L45)

Restrict notifications to changes coming from particular sources.

For example:
- "publicApi"
- "web"
- "mobile"
