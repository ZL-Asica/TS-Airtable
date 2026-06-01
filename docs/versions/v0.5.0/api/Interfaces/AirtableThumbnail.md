# AirtableThumbnail

Defined in: [types/field-values.ts:10](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/field-values.ts#L10)

Represents a single thumbnail rendition of an attachment image.

Airtable automatically generates multiple thumbnail sizes for image
attachments (e.g. small / large / full). Each rendition has its own
URL and dimensions.

This matches the shape exported by the official `airtable` package.

## Properties

### url

> **url**: `string`

Defined in: [types/field-values.ts:14](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/field-values.ts#L14)

Public URL of this thumbnail rendition.

***

### width

> **width**: `number`

Defined in: [types/field-values.ts:19](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/field-values.ts#L19)

Width of the thumbnail image in pixels.

***

### height

> **height**: `number`

Defined in: [types/field-values.ts:24](https://github.com/ZL-Asica/TS-Airtable/blob/v0.5.0/types/field-values.ts#L24)

Height of the thumbnail image in pixels.
