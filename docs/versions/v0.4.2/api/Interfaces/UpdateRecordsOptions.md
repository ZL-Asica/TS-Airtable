# UpdateRecordsOptions

Defined in: [types/records.ts:320](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L320)

Options for batch update / upsert operations.

## Properties

### typecast?

> `optional` **typecast?**: `boolean`

Defined in: [types/records.ts:325](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L325)

When `true`, Airtable will attempt to coerce provided values into
the correct field types.

***

### performUpsert?

> `optional` **performUpsert?**: [`PerformUpsertOptions`](PerformUpsertOptions.md)

Defined in: [types/records.ts:331](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L331)

Upsert configuration specifying which fields should be treated as
external keys when matching existing records.

***

### returnFieldsByFieldId?

> `optional` **returnFieldsByFieldId?**: `boolean`

Defined in: [types/records.ts:336](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/records.ts#L336)

When `true`, fields in the response are keyed by field ID rather than name.
