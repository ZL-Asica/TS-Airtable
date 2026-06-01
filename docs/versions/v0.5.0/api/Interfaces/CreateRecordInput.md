# CreateRecordInput

Defined in: [types/records.ts:218](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L218)

Input shape for creating records.

## Example

```ts
await client.records.createRecords('Tasks', [
  { fields: { Name: 'New task', Status: 'Todo' } },
])
```

## Type Parameters

### TFields

`TFields`

Shape of the `fields` object to create.

## Properties

### fields

> **fields**: `Partial`\<`TFields`\>

Defined in: [types/records.ts:222](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L222)

Fields to set on the new record.
