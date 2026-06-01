# AirtableRecord

Defined in: [types/records.ts:32](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L32)

Generic Airtable record wrapper.

## Examples

```ts
type Task = { Name: string; Done?: boolean }

const record: AirtableRecord<Task> = {
  id: 'rec123',
  createdTime: '2024-10-01T10:00:00.000Z',
  fields: { Name: 'Buy milk', Done: false },
}
```

```ts
import type { AirtableFieldSet, AirtableAttachment } from 'ts-airtable'

interface TaskFields extends AirtableFieldSet {
  Name: string
  Attachments?: readonly AirtableAttachment[]
}

const record: AirtableRecord<TaskFields> = ...
```

## Extended by

- [`AirtableRecordData`](AirtableRecordData.md)

## Type Parameters

### TFields

`TFields` = [`AirtableFieldSet`](AirtableFieldSet.md)

Shape of the `fields` object for this record.
  By default this is `AirtableFieldSet` (see [AirtableFieldSet](AirtableFieldSet.md)).

## Properties

### id

> **id**: `string`

Defined in: [types/records.ts:36](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L36)

Airtable record ID (e.g. `"recXXXXXXXXXXXXXX"`).

***

### createdTime?

> `optional` **createdTime?**: `string`

Defined in: [types/records.ts:42](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L42)

Creation time of the record as an ISO-8601 string.
This field may be omitted if not requested.

***

### fields

> **fields**: `TFields`

Defined in: [types/records.ts:47](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L47)

Arbitrary structured data stored in the record's fields.
