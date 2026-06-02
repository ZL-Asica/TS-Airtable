# AirtableRecordData

Defined in: [types/records.ts:448](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L448)

Record shape used in some higher level helpers, compatible with the
`RecordData<TFields>` type from the official client.

It is essentially an [AirtableRecord](AirtableRecord.md) plus an optional
`commentCount` property.

## Extends

- [`AirtableRecord`](AirtableRecord.md)\<`TFields`\>

## Type Parameters

### TFields

`TFields`

Shape of the `fields` object for this record.

## Properties

### id

> **id**: `string`

Defined in: [types/records.ts:36](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L36)

Airtable record ID (e.g. `"recXXXXXXXXXXXXXX"`).

#### Inherited from

[`AirtableRecord`](AirtableRecord.md).[`id`](AirtableRecord.md#id)

***

### createdTime?

> `optional` **createdTime?**: `string`

Defined in: [types/records.ts:42](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L42)

Creation time of the record as an ISO-8601 string.
This field may be omitted if not requested.

#### Inherited from

[`AirtableRecord`](AirtableRecord.md).[`createdTime`](AirtableRecord.md#createdtime)

***

### fields

> **fields**: `TFields`

Defined in: [types/records.ts:47](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L47)

Arbitrary structured data stored in the record's fields.

#### Inherited from

[`AirtableRecord`](AirtableRecord.md).[`fields`](AirtableRecord.md#fields)

***

### commentCount?

> `optional` **commentCount?**: `number`

Defined in: [types/records.ts:453](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L453)

Optional number of comments associated with this record, when returned
by endpoints that include comment metadata.
