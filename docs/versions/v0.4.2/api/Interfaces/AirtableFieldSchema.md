# AirtableFieldSchema

Defined in: [types/metadata.ts:67](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L67)

Schema for a single field in the **"Get base schema"** field model.

This is intentionally lightweight and keeps `options` as a loose
`Record<string, unknown>` so it remains future-compatible with Airtable
adding more field types / configuration.


> \[`key`: `string`\]: `unknown`

Future-compatible bag of additional properties.

## Properties

### id

> **id**: `string`

Defined in: [types/metadata.ts:71](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L71)

Field ID, e.g. `"fldXXXXXXXXXXXXXX"`.

***

### type

> **type**: `string`

Defined in: [types/metadata.ts:76](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L76)

Field type, e.g. `"singleLineText"`, `"number"`, `"singleSelect"`, ...

***

### name

> **name**: `string`

Defined in: [types/metadata.ts:81](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L81)

Human-readable field name.

***

### description?

> `optional` **description?**: `string`

Defined in: [types/metadata.ts:86](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L86)

Optional description configured in Airtable.

***

### options?

> `optional` **options?**: `Record`\<`string`, `unknown`\>

Defined in: [types/metadata.ts:96](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2/types/metadata.ts#L96)

Type-specific options, as documented in Airtable's "Field model".

Examples:
- select options
- number precision
- date/time format
