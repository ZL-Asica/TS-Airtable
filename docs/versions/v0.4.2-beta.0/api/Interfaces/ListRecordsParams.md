# ListRecordsParams

Defined in: [types/records.ts:92](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L92)

Query parameters for the **"List records"** endpoint.

These map closely to Airtable's documented query string parameters.

## Properties

### maxRecords?

> `optional` **maxRecords?**: `number`

Defined in: [types/records.ts:99](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L99)

Maximum total number of records to return.

Note: when using `client.records.listAllRecords(...)`, this limit is
enforced at the client side by stopping pagination early.

***

### pageSize?

> `optional` **pageSize?**: `number`

Defined in: [types/records.ts:106](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L106)

Maximum number of records per page (1–100).

Airtable defaults to 100 if not specified.

***

### offset?

> `optional` **offset?**: `string`

Defined in: [types/records.ts:115](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L115)

Pagination cursor returned from a previous page.

You usually do not need to set this manually; use
`client.records.listAllRecords(...)` or `client.records.iterateRecords(...)`
to handle pagination automatically.

***

### view?

> `optional` **view?**: `string`

Defined in: [types/records.ts:121](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L121)

View name or ID. When provided, the returned records are constrained
to that view's configuration and filter.

***

### fields?

> `optional` **fields?**: `string`[]

Defined in: [types/records.ts:128](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L128)

List of field names or IDs to include in the response.

If omitted, all fields in the table may be returned.

***

### filterByFormula?

> `optional` **filterByFormula?**: `string`

Defined in: [types/records.ts:133](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L133)

Airtable formula used to filter rows (e.g. `"Status = 'Done'"`).

***

### sort?

> `optional` **sort?**: [`SortSpec`](SortSpec.md)[]

Defined in: [types/records.ts:138](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L138)

Sort specification for one or more fields.

***

### cellFormat?

> `optional` **cellFormat?**: [`CellFormat`](../Type Aliases/CellFormat.md)

Defined in: [types/records.ts:143](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L143)

Format in which cell values should be returned.

***

### timeZone?

> `optional` **timeZone?**: `string`

Defined in: [types/records.ts:148](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L148)

Time zone ID to use when formatting date/time fields.

***

### userLocale?

> `optional` **userLocale?**: `string`

Defined in: [types/records.ts:153](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L153)

Locale identifier to use when formatting values for display.

***

### returnFieldsByFieldId?

> `optional` **returnFieldsByFieldId?**: `boolean`

Defined in: [types/records.ts:158](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L158)

When `true`, fields in the response are keyed by field ID rather than name.
