# AirtableFieldValue

> **AirtableFieldValue** = `undefined` \| `null` \| `string` \| `number` \| `boolean` \| [`AirtableAttachment`](../Interfaces/AirtableAttachment.md) \| [`AirtableCollaborator`](../Interfaces/AirtableCollaborator.md) \| [`AirtableThumbnail`](../Interfaces/AirtableThumbnail.md) \| `Record`\<`string`, `unknown`\> \| readonly `unknown`[]

Defined in: [types/field-values.ts:110](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/field-values.ts#L110)

Broad runtime value shape for Airtable cells.

Airtable can return primitives, `null`, arrays from lookup/rollup fields,
attachment/collaborator objects, and other structured field-specific
objects such as barcode values.
