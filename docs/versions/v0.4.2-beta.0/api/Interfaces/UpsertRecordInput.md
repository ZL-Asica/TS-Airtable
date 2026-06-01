# UpsertRecordInput

Defined in: [types/records.ts:288](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L288)

Input shape for upsert operations.

Airtable can create or update records using `performUpsert.fieldsToMergeOn`,
so an `id` is optional when that option is provided.

## Type Parameters

### TFields

`TFields`

Shape of the `fields` object to upsert.

## Properties

### id?

> `optional` **id?**: `string`

Defined in: [types/records.ts:293](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L293)

Optional record ID. When omitted, Airtable uses `fieldsToMergeOn`
to decide whether to create or update a record.

***

### fields

> **fields**: `Partial`\<`TFields`\>

Defined in: [types/records.ts:298](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L298)

Partial fields to create/update.
