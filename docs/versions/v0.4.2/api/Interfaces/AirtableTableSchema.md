# AirtableTableSchema

Defined in: [types/metadata.ts:132](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L132)

Schema for a single table in **"Get base schema"**.


> \[`key`: `string`\]: `unknown`

Future-compatible bag of additional properties.

## Properties

### id

> **id**: `string`

Defined in: [types/metadata.ts:136](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L136)

Table ID, e.g. `"tblXXXXXXXXXXXXXX"`.

***

### primaryFieldId

> **primaryFieldId**: `string`

Defined in: [types/metadata.ts:141](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L141)

ID of the primary field for this table.

***

### name

> **name**: `string`

Defined in: [types/metadata.ts:146](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L146)

Human-readable table name.

***

### description?

> `optional` **description?**: `string`

Defined in: [types/metadata.ts:151](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L151)

Optional description configured in Airtable.

***

### fields

> **fields**: [`AirtableFieldSchema`](AirtableFieldSchema.md)[]

Defined in: [types/metadata.ts:156](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L156)

All fields in this table.

***

### views

> **views**: [`AirtableViewSchema`](AirtableViewSchema.md)[]

Defined in: [types/metadata.ts:161](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L161)

All views defined on this table.
