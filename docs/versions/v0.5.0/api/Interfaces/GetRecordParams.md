# GetRecordParams

Defined in: [types/records.ts:184](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L184)

Query parameters for the **"Retrieve a record"** endpoint.

These parameters control how field values are formatted.

## Properties

### cellFormat?

> `optional` **cellFormat?**: [`CellFormat`](../Type Aliases/CellFormat.md)

Defined in: [types/records.ts:188](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L188)

Format in which cell values should be returned.

***

### timeZone?

> `optional` **timeZone?**: `string`

Defined in: [types/records.ts:193](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L193)

Time zone ID to use when formatting date/time fields.

***

### userLocale?

> `optional` **userLocale?**: `string`

Defined in: [types/records.ts:198](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L198)

Locale identifier to use when formatting values for display.

***

### returnFieldsByFieldId?

> `optional` **returnFieldsByFieldId?**: `boolean`

Defined in: [types/records.ts:203](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/records.ts#L203)

When `true`, fields in the response are keyed by field ID rather than name.
