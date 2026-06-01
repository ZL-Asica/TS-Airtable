# UpdateRecordInput

Defined in: [types/records.ts:268](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L268)

Input shape for updating records in batch.

## Example

```ts
await client.records.updateRecords('Tasks', [
  { id: 'rec1', fields: { Status: 'Done' } },
])
```

## Type Parameters

### TFields

`TFields`

Shape of the `fields` object to update.

## Properties

### id

> **id**: `string`

Defined in: [types/records.ts:272](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L272)

Record ID to update (e.g. `"recXXXXXXXXXXXXXX"`).

***

### fields

> **fields**: `Partial`\<`TFields`\>

Defined in: [types/records.ts:277](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L277)

Partial fields to update. Only the provided keys will be modified.
