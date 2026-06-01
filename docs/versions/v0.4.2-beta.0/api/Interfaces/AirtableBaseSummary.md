# AirtableBaseSummary

Defined in: [types/metadata.ts:6](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/metadata.ts#L6)

Basic information about a base returned by the **"List bases"** metadata endpoint.

See Airtable Web API docs: "List bases".


> \[`key`: `string`\]: `unknown`

Future-compatible bag of additional properties.

Airtable may add more fields over time; they will appear here as `unknown`.
If you need stricter typing, intersect this interface with your own type.

## Properties

### id

> **id**: `string`

Defined in: [types/metadata.ts:10](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/metadata.ts#L10)

Base ID, e.g. `"appXXXXXXXXXXXXXX"`.

***

### name

> **name**: `string`

Defined in: [types/metadata.ts:15](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/metadata.ts#L15)

Human-readable name of the base as shown in the Airtable UI.

***

### permissionLevel

> **permissionLevel**: `string`

Defined in: [types/metadata.ts:21](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/metadata.ts#L21)

Permission level of the current token for this base,
e.g. `"read"`, `"editor"`, `"creator"`, etc.
