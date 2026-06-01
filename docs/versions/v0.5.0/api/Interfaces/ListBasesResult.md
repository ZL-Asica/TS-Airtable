# ListBasesResult

Defined in: [types/metadata.ts:48](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/metadata.ts#L48)

Response shape for a single page of **"List bases"**.

## Properties

### bases

> **bases**: [`AirtableBaseSummary`](AirtableBaseSummary.md)[]

Defined in: [types/metadata.ts:52](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/metadata.ts#L52)

Bases visible to the current token for this page.

***

### offset?

> `optional` **offset?**: `string`

Defined in: [types/metadata.ts:57](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/metadata.ts#L57)

When present, you can pass this `offset` to fetch the next page.
