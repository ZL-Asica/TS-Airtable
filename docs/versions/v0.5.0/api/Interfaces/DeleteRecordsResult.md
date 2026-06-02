# DeleteRecordsResult

Defined in: [types/records.ts:367](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L367)

Response shape for batch delete operations.

## Properties

### records

> **records**: `object`[]

Defined in: [types/records.ts:373](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L373)

Per-record deletion status.

Airtable reports whether each requested record was successfully deleted.

#### id

> **id**: `string`

Record ID that was targeted by the delete operation.

#### deleted

> **deleted**: `boolean`

Indicates whether the record was successfully deleted.
