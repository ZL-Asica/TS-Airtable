# UpdateRecordsResult

Defined in: [types/records.ts:344](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L344)

Response shape for batch update / upsert operations.

## Type Parameters

### TFields

`TFields`

Shape of the `fields` object for updated/created records.

## Properties

### records

> **records**: [`AirtableRecord`](AirtableRecord.md)\<`TFields`\>[]

Defined in: [types/records.ts:349](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L349)

For regular updates, this is the main array of processed records.
For upserts, this may contain all created and updated records.

***

### updatedRecords?

> `optional` **updatedRecords?**: `string`[]

Defined in: [types/records.ts:355](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L355)

Record IDs that were updated during an upsert operation.
Only present when `performUpsert` is used.

***

### createdRecords?

> `optional` **createdRecords?**: `string`[]

Defined in: [types/records.ts:361](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L361)

Record IDs that were created during an upsert operation.
Only present when `performUpsert` is used.
