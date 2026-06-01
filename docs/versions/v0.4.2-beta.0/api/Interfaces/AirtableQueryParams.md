# AirtableQueryParams

Defined in: [types/records.ts:418](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L418)

Generic, strongly typed variant of [ListRecordsParams](ListRecordsParams.md).

This mirrors the `QueryParams<TFields>` type from the official `airtable`
package by:

- using `keyof TFields` for `fields`
- using [AirtableSortParameter](AirtableSortParameter.md) for `sort`

All other properties map directly to [ListRecordsParams](ListRecordsParams.md).

## Extends

- `Omit`\<[`ListRecordsParams`](ListRecordsParams.md), `"fields"` \| `"sort"`\>

## Type Parameters

### TFields

`TFields`

Field set shape whose keys are valid field names.

## Properties

### maxRecords?

> `optional` **maxRecords?**: `number`

Defined in: [types/records.ts:99](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L99)

Maximum total number of records to return.

Note: when using `client.records.listAllRecords(...)`, this limit is
enforced at the client side by stopping pagination early.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`maxRecords`](ListRecordsParams.md#maxrecords)

***

### pageSize?

> `optional` **pageSize?**: `number`

Defined in: [types/records.ts:106](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L106)

Maximum number of records per page (1–100).

Airtable defaults to 100 if not specified.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`pageSize`](ListRecordsParams.md#pagesize)

***

### offset?

> `optional` **offset?**: `string`

Defined in: [types/records.ts:115](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L115)

Pagination cursor returned from a previous page.

You usually do not need to set this manually; use
`client.records.listAllRecords(...)` or `client.records.iterateRecords(...)`
to handle pagination automatically.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`offset`](ListRecordsParams.md#offset)

***

### view?

> `optional` **view?**: `string`

Defined in: [types/records.ts:121](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L121)

View name or ID. When provided, the returned records are constrained
to that view's configuration and filter.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`view`](ListRecordsParams.md#view)

***

### filterByFormula?

> `optional` **filterByFormula?**: `string`

Defined in: [types/records.ts:133](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L133)

Airtable formula used to filter rows (e.g. `"Status = 'Done'"`).

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`filterByFormula`](ListRecordsParams.md#filterbyformula)

***

### cellFormat?

> `optional` **cellFormat?**: [`CellFormat`](../Type Aliases/CellFormat.md)

Defined in: [types/records.ts:143](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L143)

Format in which cell values should be returned.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`cellFormat`](ListRecordsParams.md#cellformat)

***

### timeZone?

> `optional` **timeZone?**: `string`

Defined in: [types/records.ts:148](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L148)

Time zone ID to use when formatting date/time fields.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`timeZone`](ListRecordsParams.md#timezone)

***

### userLocale?

> `optional` **userLocale?**: `string`

Defined in: [types/records.ts:153](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L153)

Locale identifier to use when formatting values for display.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`userLocale`](ListRecordsParams.md#userlocale)

***

### returnFieldsByFieldId?

> `optional` **returnFieldsByFieldId?**: `boolean`

Defined in: [types/records.ts:158](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L158)

When `true`, fields in the response are keyed by field ID rather than name.

#### Inherited from

[`ListRecordsParams`](ListRecordsParams.md).[`returnFieldsByFieldId`](ListRecordsParams.md#returnfieldsbyfieldid)

***

### fields?

> `optional` **fields?**: keyof `TFields`[]

Defined in: [types/records.ts:423](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L423)

Subset of `TFields` keys to include in the response.

***

### sort?

> `optional` **sort?**: [`AirtableSortParameter`](AirtableSortParameter.md)\<`TFields`\>[]

Defined in: [types/records.ts:428](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L428)

Sort specification using keys of `TFields`.

***

### method?

> `optional` **method?**: `string`

Defined in: [types/records.ts:435](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L435)

Extra properties kept for compatibility with the official `airtable`
client. They are accepted at the type level but are not interpreted
by this library.

***

### recordMetadata?

> `optional` **recordMetadata?**: `string`[]

Defined in: [types/records.ts:436](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/records.ts#L436)
