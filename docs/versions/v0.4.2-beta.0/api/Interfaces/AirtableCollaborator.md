# AirtableCollaborator

Defined in: [types/field-values.ts:86](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/field-values.ts#L86)

Collaborator object used by fields of type `"collaborator"`.

This matches the shape exported by the official `airtable` package and
is typically used for:

- single collaborator fields
- multi-collaborator / users fields (as arrays of collaborators)

## Properties

### id

> **id**: `string`

Defined in: [types/field-values.ts:90](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/field-values.ts#L90)

Unique identifier of the collaborator in Airtable.

***

### email

> **email**: `string`

Defined in: [types/field-values.ts:95](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/field-values.ts#L95)

Email address of the collaborator.

***

### name

> **name**: `string`

Defined in: [types/field-values.ts:100](https://github.com/ZL-Asica/TS-Airtable/blob/v0.4.2-beta.0/types/field-values.ts#L100)

Display name of the collaborator.
