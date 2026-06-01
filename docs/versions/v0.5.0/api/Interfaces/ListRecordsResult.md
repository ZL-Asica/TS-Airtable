# ListRecordsResult

Defined in: [types/records.ts:166](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L166)

Response shape for one page of **"List records"**.

## Type Parameters

### TFields

`TFields`

Shape of the `fields` object for records in this page.

## Properties

### records

> **records**: [`AirtableRecord`](AirtableRecord.md)\<`TFields`\>[]

Defined in: [types/records.ts:170](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L170)

Records returned in this page.

***

### offset?

> `optional` **offset?**: `string`

Defined in: [types/records.ts:176](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L176)

Pagination cursor. When present, you can pass it as `offset` in the
next request to fetch the following page.
