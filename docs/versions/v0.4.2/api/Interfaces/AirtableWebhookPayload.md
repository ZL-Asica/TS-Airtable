# AirtableWebhookPayload

Defined in: [types/webhook.ts:241](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L241)

Single webhook payload describing a batch of changes in a base.

For the full schema see:
https://airtable.com/developers/web/api/model/webhooks-payload


> \[`key`: `string`\]: `unknown`

Additional forward-compatible fields.

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/webhook.ts:245](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L245)

When the underlying change occurred.

***

### baseTransactionNumber

> **baseTransactionNumber**: `number`

Defined in: [types/webhook.ts:250](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L250)

Monotonically increasing transaction number within the base.

***

### actionMetadata?

> `optional` **actionMetadata?**: `object`

Defined in: [types/webhook.ts:255](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L255)

Metadata about where the change came from (web, API, automation, etc).

#### Index Signature

\[`key`: `string`\]: `unknown`

#### source?

> `optional` **source?**: `string`

#### sourceMetadata?

> `optional` **sourceMetadata?**: `object`

##### Index Signature

\[`key`: `string`\]: `unknown`

##### sourceMetadata.user?

> `optional` **user?**: `object`

###### Index Signature

\[`key`: `string`\]: `unknown`

##### sourceMetadata.user.id?

> `optional` **id?**: `string`

##### sourceMetadata.user.email?

> `optional` **email?**: `string`

##### sourceMetadata.user.permissionLevel?

> `optional` **permissionLevel?**: `string`

##### sourceMetadata.user.name?

> `optional` **name?**: `string`

##### sourceMetadata.user.profilePicUrl?

> `optional` **profilePicUrl?**: `string`

***

### payloadFormat

> **payloadFormat**: `string`

Defined in: [types/webhook.ts:274](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L274)

Payload format identifier (e.g. `"v0"`).

***

### changedTablesById?

> `optional` **changedTablesById?**: `Record`\<`string`, `unknown`\>

Defined in: [types/webhook.ts:282](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L282)

Map of table IDs to change information.

The inner structure is quite rich (created/updated/deleted records,
fields, views, etc); see Airtable docs for details.

***

### createdTablesById?

> `optional` **createdTablesById?**: `Record`\<`string`, `unknown`\>

Defined in: [types/webhook.ts:287](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L287)

Newly created tables, keyed by table ID.

***

### destroyedTableIds?

> `optional` **destroyedTableIds?**: `string`[]

Defined in: [types/webhook.ts:292](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L292)

IDs of tables that were deleted.

***

### error?

> `optional` **error?**: `unknown`

Defined in: [types/webhook.ts:298](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L298)

Error information in case something went wrong while generating
or delivering this payload.

***

### errorCode?

> `optional` **errorCode?**: `string` \| `null`

Defined in: [types/webhook.ts:299](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/webhook.ts#L299)
