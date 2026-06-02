# CreateRecordsOptions

Defined in: [types/records.ts:228](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L228)

Options for creating records.

## Properties

### typecast?

> `optional` **typecast?**: `boolean`

Defined in: [types/records.ts:236](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L236)

When `true`, Airtable will attempt to coerce provided values into
the correct field types.

For example, a string may be cast into a date field if it matches
the expected format.

***

### returnFieldsByFieldId?

> `optional` **returnFieldsByFieldId?**: `boolean`

Defined in: [types/records.ts:241](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L241)

When `true`, fields in the response are keyed by field ID rather than name.
