# AirtableClient

Defined in: [client/index.ts:37](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/client/index.ts#L37)

High-level Airtable Web API client.

Composed from:
- `AirtableRecordsClient` exposed as `client.records`
- `AirtableMetadataClient` exposed as `client.metadata`
- `AirtableWebhooksClient` exposed as `client.webhooks`

## Example

```ts
import type { AirtableFieldSet } from 'ts-airtable'

interface Task extends AirtableFieldSet {
  Name: string
  Status?: 'Todo' | 'Doing' | 'Done'
}

const client = new AirtableClient<Task>({
  apiKey: process.env.AIRTABLE_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
})

const page = await client.records.listRecords('Tasks', { pageSize: 50 })
console.log(page.records[0].fields.Name)
```

## Type Parameters

### TDefaultFields

`TDefaultFields` *extends* [`AirtableFieldSet`](../Interfaces/AirtableFieldSet.md) = [`AirtableFieldSet`](../Interfaces/AirtableFieldSet.md)

Default shape of the `fields` object for records
  when using `client.records.*` without specifying a more specific type.
  Defaults to [AirtableFieldSet](../Interfaces/AirtableFieldSet.md).

## Constructors

### Constructor

> **new AirtableClient**\<`TDefaultFields`\>(`options`): `AirtableClient`\<`TDefaultFields`\>

Defined in: [client/index.ts:61](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/client/index.ts#L61)

#### Parameters

##### options

[`AirtableClientOptions`](../Interfaces/AirtableClientOptions.md)

#### Returns

`AirtableClient`\<`TDefaultFields`\>

## Properties

### core

> `readonly` **core**: `AirtableCoreClient`

Defined in: [client/index.ts:44](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/client/index.ts#L44)

Low-level HTTP / retry / URL utilities.
Exposed in case advanced consumers want direct access.

***

### records

> `readonly` **records**: `AirtableRecordsClient`\<`TDefaultFields`\>

Defined in: [client/index.ts:49](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/client/index.ts#L49)

Records API (CRUD, pagination, upsert).

***

### metadata

> `readonly` **metadata**: `AirtableMetadataClient`

Defined in: [client/index.ts:54](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/client/index.ts#L54)

Metadata API (bases, schema, views).

***

### webhooks

> `readonly` **webhooks**: `AirtableWebhooksClient`

Defined in: [client/index.ts:59](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/client/index.ts#L59)

Webhooks API.
